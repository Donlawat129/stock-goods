// src/lib/authBootstrap.ts
import { auth } from "./firebase";
import {
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  OAuthCredential,
} from "firebase/auth";

/** ให้แอปบูตด้วย anonymous ก่อน เผื่อส่วนที่ไม่ต้องล็อกอิน */
export async function ensureIdentity() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) { unsub(); resolve(user); return; }
      try { await signInAnonymously(auth); }
      catch (e) { reject(e); }
    });
  });
}

/**
 * ล็อกอิน Google พร้อมสโคปที่ต้องใช้กับ Google Sheets
 * - ถ้ายังไม่เคยให้สิทธิ์ จะขึ้นหน้าต่าง consent
 * - เก็บ access_token ลง localStorage เพื่อนำไปใส่ Authorization: Bearer <token>
 * test
 */
export async function ensureSignedInWithSheetsScope(forceConsent = false) {
  const provider = new GoogleAuthProvider();
  // ==== สโคปสำคัญ ====
  provider.addScope("https://www.googleapis.com/auth/spreadsheets");
  provider.addScope("https://www.googleapis.com/auth/drive.file"); // ถ้าจะสร้าง/อัปโหลดไฟล์ด้วย
  provider.setCustomParameters({
    include_granted_scopes: "true",
    ...(forceConsent ? { prompt: "consent" } : {}),
  });

  const result = await signInWithPopup(auth, provider);

  // ดึงและเก็บ access_token
  const cred = GoogleAuthProvider.credentialFromResult(result) as OAuthCredential | null;
  const accessToken = cred?.accessToken;
  if (accessToken) {
    localStorage.setItem("google.access_token", accessToken);
  }
  return auth.currentUser;
}

/** ดึง access_token ที่จะใช้กับ Google Sheets API */
export function getGoogleAccessToken(): string | null {
  return localStorage.getItem("google.access_token");
}

/** เวอร์ชันสั้น ๆ เผื่อโค้ดเดิมเรียกชื่อเดิมอยู่ */
export async function ensureSignedIn() {
  // เรียกแบบมีสโคปเสมอ
  return ensureSignedInWithSheetsScope(false);
}
