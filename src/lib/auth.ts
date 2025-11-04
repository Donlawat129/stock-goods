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
  appendUser, // ✅ ใช้ตัวนี้แทน addUserRow/userExistsByEmail
} from "./sheetsClient";

// ===== Types =====
export type AuthUser = { uid: string; email: string; name?: string };

// ✅ เพิ่ม type role
export type UserRole = "guest" | "user" | "admin" | "owner";

// ✅ กำหนดเมลพิเศษ (เปลี่ยนให้เป็นเมลจริงของคุณ)
const ADMIN_EMAILS = ["admin@yourcompany.com"];
const OWNER_EMAILS = ["owner@yourcompany.com"];

// ✅ แปลง email → role
export function getRoleFromEmail(email?: string | null): UserRole {
  if (!email) return "guest";
  const e = email.toLowerCase();

  if (OWNER_EMAILS.map((x) => x.toLowerCase()).includes(e)) return "owner";
  if (ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(e)) return "admin";

  return "user";
}

// ✅ role สำหรับบันทึกลง Google Sheets (ไม่มี guest)
function sheetRoleFor(email?: string | null): string {
  const r = getRoleFromEmail(email);
  if (r === "guest") return "user";
  return r;
}

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
    // โครงสร้างแถว Users: timestamp | uid | email | displayName | provider | role | status
    await appendUser([
      new Date().toISOString(),
      u.uid,
      u.email,
      u.name || "",
      "password",
      sheetRoleFor(u.email), // ✅ เดิมใช้ "user"
      "active",
    ]);
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

    // ✅ บันทึกลงชีต (append แถวใหม่)
    try {
      await requestSheetsToken();
      await appendUser([
        new Date().toISOString(),
        u.uid,
        u.email,
        u.name || "",
        "google",
        sheetRoleFor(u.email), // ✅ เดิมใช้ "user"
        "active",
      ]);
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
