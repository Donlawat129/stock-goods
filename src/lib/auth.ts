// src/lib/auth.ts  (Firebase version; drop-in replacement)
// ไม่พึ่ง Google Sheets อีกต่อไป

import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";

// ===== Types =====
export type AuthUser = { uid: string; email: string; name?: string };

// ===== session helpers (เก็บ snapshot เบา ๆ ไว้ใช้กับ UI) =====
const AUTH_KEY = "auth_user";

export function setSessionUser(u: AuthUser | null) {
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  else localStorage.removeItem(AUTH_KEY);
}

export function getSessionUser(): AuthUser | null {
  try {
    // 1) ใช้จาก localStorage ก่อน (เร็วสุด)
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;

    // 2) ถ้าไม่มี ให้ดึงจาก Firebase currentUser แล้ว cache ไว้
    const u = auth.currentUser;
    if (!u) return null;
    const snapshot = toAuthUser(u);
    setSessionUser(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

// subscribe การเปลี่ยนสถานะผู้ใช้ (ใช้ใน Sidebar/Nav ได้)
export function onAuthUserChanged(cb: (u: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (u) => {
    const snap = u ? toAuthUser(u) : null;
    setSessionUser(snap);
    cb(snap);
  });
}

export async function logout() {
  setSessionUser(null);
  await signOut(auth);
}

// ===== Register/Login ด้วย Firebase =====
export async function registerUser(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const u = toAuthUser(cred.user);
  setSessionUser(u);
  // ส่งรูปแบบที่ใช้งานได้กว้าง: มีทั้ง message และ user
  return { message: "Register successful.", user: u };
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const u = toAuthUser(cred.user);
  setSessionUser(u);
  return u;
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
