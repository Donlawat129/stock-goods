// src/lib/auth.ts
import { readUsers, appendUserRow, findUserByEmailPassword } from "./sheetsClient";

export type AuthUser = { uid: string; email: string; name?: string };

const AUTH_KEY = "auth_user";

// ===== session helpers =====
export function setSessionUser(u: AuthUser | null) {
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  else localStorage.removeItem(AUTH_KEY);
}
export function getSessionUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
export function logout() {
  setSessionUser(null);
}

// ===== Register (เพิ่ม user ใหม่) =====
export async function registerUser(email: string, password: string) {
  const { rows } = await readUsers();
  const exists = rows.some((r) => r[1] === email);
  if (exists) throw new Error("Email already registered");

  const uid = `uid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await appendUserRow(uid, email, password);
  return { message: "Register successful. Please login." };
}

// ===== Login (บันทึก session ให้ด้วย) =====
export async function login(email: string, password: string) {
  const user = await findUserByEmailPassword(email, password);
  if (!user) throw new Error("Invalid email or password");

  // ไม่มีคอลัมน์ name ในชีต เลยเดาชื่อจากอีเมลก่อน @
  const nameGuess = email.split("@")[0];
  const sessionUser: AuthUser = { uid: user.uid, email: user.email, name: nameGuess };

  setSessionUser(sessionUser); // << เก็บไว้ให้ Sidebar ใช้
  return sessionUser;
}
