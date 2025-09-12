// src/lib/auth.ts
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  EmailAuthProvider,
  linkWithCredential, 
  type User,
} from "firebase/auth";

import {
  requestSheetsToken,
  addUserRow,
  userExistsByEmail,
} from "./sheetsClient";

// ===== Types =====
export type AuthUser = { uid: string; email: string; name?: string };

// ===== session helpers =====
const AUTH_KEY = "auth_user";
const GMAIL_TOKEN_KEY = "gmail_access_token";
const GMAIL_TOKEN_EXP_KEY = "gmail_access_token_exp"; // epoch ms

export function setSessionUser(u: AuthUser | null) {
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  else localStorage.removeItem(AUTH_KEY);
}

export function getSessionUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;

    const u = auth.currentUser;
    if (!u) return null;
    const snapshot = toAuthUser(u);
    setSessionUser(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

export function getGmailAccessToken(): string | null {
  const exp = Number(localStorage.getItem(GMAIL_TOKEN_EXP_KEY) || "0");
  const now = Date.now();
  if (!exp || now >= exp) return null; // หมดอายุ
  return localStorage.getItem(GMAIL_TOKEN_KEY);
}

function setGmailAccessToken(token: string | null, expiresInSec = 3600) {
  if (token) {
    localStorage.setItem(GMAIL_TOKEN_KEY, token);
    // ใส่ buffer 5 นาที กันเผื่อ
    const exp = Date.now() + (expiresInSec - 300) * 1000;
    localStorage.setItem(GMAIL_TOKEN_EXP_KEY, String(exp));
  } else {
    localStorage.removeItem(GMAIL_TOKEN_KEY);
    localStorage.removeItem(GMAIL_TOKEN_EXP_KEY);
  }
}

// subscribe การเปลี่ยนสถานะผู้ใช้
export function onAuthUserChanged(cb: (u: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (u) => {
    const snap = u ? toAuthUser(u) : null;
    setSessionUser(snap);
    cb(snap);
  });
}

export async function logout() {
  setSessionUser(null);
  setGmailAccessToken(null);
  await signOut(auth);
}

// ===== Register/Login Email+Password =====
export async function registerUser(email: string, password: string) {
  // 1) สมัครใน Firebase
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const u = toAuthUser(cred.user);
  setSessionUser(u);

  // 2) บันทึกลง Google Sheets (non-blocking)
  try {
    await requestSheetsToken();
    const exists = await userExistsByEmail(email.trim());
    if (!exists) {
      await addUserRow({
        uid: u.uid,
        email: u.email,
        displayName: u.name || "",
        provider: "password",
        role: "user",
        status: "active",
      });
    }
  } catch (e) {
    console.error("[Sheets] append user failed:", e);
  }

  return { message: "Register successful.", user: u };
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const u = toAuthUser(cred.user);
  setSessionUser(u);
  return u;
}

// ===== Helpers สำหรับจัดการกรณี email ใช้งานแล้ว =====
export async function getSignInMethods(email: string) {
  return fetchSignInMethodsForEmail(auth, email);
}

export async function sendReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// ===== Google Login (Redirect-safe, สำหรับ Vercel) =====
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("openid");
googleProvider.addScope("email");
googleProvider.addScope("profile");
// (ถ้าไม่ต้องการอ่าน Gmail ให้ลบบรรทัดนี้ออก)
googleProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function loginWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);
  await signInWithRedirect(auth, googleProvider);
}

// เรียกครั้งเดียวหลัง redirect กลับมา (เช่นใน App.tsx useEffect)
export async function handleGoogleRedirect() {
  const result = await getRedirectResult(auth);
  if (result?.user) {
    const u = toAuthUser(result.user);
    setSessionUser(u);

    // เก็บ Gmail OAuth token (ถ้ามี scope)
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const accessToken: string | undefined = cred?.accessToken;
    if (accessToken) setGmailAccessToken(accessToken, 3600);

    // ✅ ลิงก์ password ที่ผู้ใช้กรอกไว้ (กรณีสมัครด้วย Google เดิม)
    const pendingPw = sessionStorage.getItem("link_password");
    if (pendingPw && u.email) {
      try {
        const pwCred = EmailAuthProvider.credential(u.email, pendingPw);
        await linkWithCredential(auth.currentUser!, pwCred);
        console.log("Linked password to Google account");
      } catch (e) {
        console.error("Link password failed:", e);
      } finally {
        sessionStorage.removeItem("link_password");
      }
    }

    // ✅ บันทึกลงชีตถ้ายังไม่มีแถวของอีเมลนี้
    try {
      await requestSheetsToken();
      const exists = await userExistsByEmail(u.email);
      if (!exists) {
        await addUserRow({
          uid: u.uid,
          email: u.email,
          displayName: u.name || "",
          provider: "google",
          role: "user",
          status: "active",
        });
      }
    } catch (e) {
      console.error("[Sheets] append user (google) failed:", e);
    }

    return u;
  }
  return null;
}

// ===== Utils =====
function toAuthUser(u: User): AuthUser {
  const nameGuess =
    (u.displayName ?? u.email?.split("@")[0] ?? "").trim() || undefined;
  return {
    uid: u.uid,
    email: u.email ?? "",
    name: nameGuess,
  };
}
