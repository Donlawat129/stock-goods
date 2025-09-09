// lib/sheetsClient.ts

// ===== Env =====
const CLIENT_ID   = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SHEET_ID    = import.meta.env.VITE_SHEET_ID as string;
const SHEET_TAB   = (import.meta.env.VITE_SHEET_TAB as string) || "Users";      // สำหรับ Users
const TAB_PRODUCTS = (import.meta.env.VITE_SHEET_TAB_PRODUCTS as string) || "Products";

const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// ===== Token Storage Keys =====
const TOKEN_KEY = "sheets_token";
const TOKEN_EXP_KEY = "sheets_token_exp"; // epoch ms

// ===== OAuth token (ต้องอยู่ก่อนใช้งานทุกฟังก์ชัน) =====
let accessToken: string | null = null;

// ---------- Utilities ----------
function now() {
  return Date.now();
}

function getStoredToken() {
  const t = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || "0");
  if (t && exp && now() < exp) return t;
  return null;
}

function saveToken(token: string, expiresInSec?: number) {
  accessToken = token;
  localStorage.setItem(TOKEN_KEY, token);
  // ถ้าไม่มี expires_in จาก callback จะตั้ง 50 นาทีไว้ก่อน
  const lifeMs = (expiresInSec ?? 50 * 60) * 1000;
  localStorage.setItem(TOKEN_EXP_KEY, String(now() + lifeMs));
}

function assertToken() {
  if (!accessToken) throw new Error("No OAuth token. Call requestSheetsToken() first.");
  return accessToken;
}

function ensureGisLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.accounts?.oauth2) return resolve();
    const iv = setInterval(() => {
      if ((window as any).google?.accounts?.oauth2) {
        clearInterval(iv);
        resolve();
      }
    }, 50);
  });
}

// ---------- Auth ----------
/**
 * ขอ OAuth token ผ่าน Google Identity Services
 * - ครั้งแรกใช้ prompt: "consent"
 * - ต่อ ๆ ไปสามารถเรียกด้วย "none" เพื่อรีเฟรชแบบเงียบได้
 */
export async function requestSheetsToken(
  prompt: "consent" | "none" = "consent"
): Promise<string> {
  await ensureGisLoaded();

  // ใช้ token เดิมถ้ายังไม่หมดอายุ
  if (!accessToken) accessToken = getStoredToken();
  if (accessToken) return accessToken;

  const g = (window as any).google;
  if (!g?.accounts?.oauth2) throw new Error("GSI not loaded");

  return new Promise((resolve, reject) => {
    const tokenClient = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      prompt,
      callback: (resp: any) => {
        if (resp?.error) return reject(resp);
        const token = resp?.access_token as string | undefined;
        if (!token) return reject(new Error("No access token"));
        // resp.expires_in เป็นวินาที (ถ้ามี)
        saveToken(token, resp?.expires_in);
        resolve(token);
      },
    });
    tokenClient.requestAccessToken();
  });
}

/** เรียกสั้น ๆ: ให้มี token พร้อมใช้ (ถ้าไม่มีจะ popup ขอใหม่) */
export async function ensureToken() {
  accessToken = getStoredToken();
  if (!accessToken) {
    await requestSheetsToken("consent");
  }
}

/** ล้าง token ทั้งหมด (logout) */
export function clearSheetsToken() {
  accessToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

// ---------- Fetch helper (auto refresh on 401) ----------
async function fetchWithAuth(url: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = assertToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (res.status !== 401 || !retry) return res;

  // 401 → ลองรีเฟรชแบบเงียบ ถ้าไม่ได้ค่อย consent
  try {
    await requestSheetsToken("none");
  } catch {
    await requestSheetsToken("consent");
  }

  const headers2 = new Headers(init.headers || {});
  headers2.set("Authorization", `Bearer ${assertToken()}`);
  return fetch(url, { ...init, headers: headers2 });
}

// ---------- Generic read ----------
export async function readSheet(tabName?: string) {
  const range = `${tabName || SHEET_TAB}!A1:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ========== Users ==========
export async function appendUserRow(uid: string, email: string, password: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    SHEET_TAB
  )}!A1:append?valueInputOption=USER_ENTERED`;
  const body = { values: [[uid, email, password]] };
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function readUsers() {
  const range = `${SHEET_TAB}!A1:C`; // uid | email | password
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { values?: string[][] };
  const values = data.values || [];
  const [header, ...rows] = values;
  return { header: header || [], rows };
}

export async function findUserByEmailPassword(email: string, password: string) {
  const { rows } = await readUsers();
  for (const r of rows) {
    const [uid, em, pw] = [r[0] || "", r[1] || "", r[2] || ""];
    if (em === email && pw === password) return { uid, email: em };
  }
  return null;
}

// ========== Products ==========
export type ProductRow = {
  rowNumber: number;   // แถวจริง (1-based) เพื่อแก้ไข/ลบ
  id: string;          // A
  imageUrl: string;    // B
  name: string;        // C
  category: string;    // D
  description: string; // E
  price: string;       // F
};

// อ่านสินค้าทั้งหมด (A..F)
export async function getProducts(
  tab = TAB_PRODUCTS
): Promise<{ header: string[]; items: ProductRow[] }> {
  const range = `${tab}!A1:F`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(await res.text());

  const data = (await res.json()) as { values?: string[][] };
  const values = data.values ?? [];
  const [header = [], ...rows] = values;

  const items: ProductRow[] = rows
    .map((r, i) => ({
      rowNumber: i + 2, // เฮดเดอร์อยู่แถว 1
      id: r[0] ?? "",
      imageUrl: r[1] ?? "",
      name: r[2] ?? "",
      category: r[3] ?? "",
      description: r[4] ?? "",
      price: r[5] ?? "",
    }))
    .filter((x) => x.id);

  return { header, items };
}

// เพิ่มสินค้า (append) A..F
export async function addProduct(
  p: {
    id: string;
    imageUrl: string;
    name: string;
    category: string;
    description: string;
    price: string | number;
  },
  tab = TAB_PRODUCTS
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    tab
  )}!A1:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      p.id ?? "",
      p.imageUrl ?? "",
      p.name ?? "",
      p.category ?? "",
      p.description ?? "",
      String(p.price ?? ""),
    ]],
  };
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// อัปเดตสินค้า (ตาม rowNumber) A..F
export async function updateProduct(
  rowNumber: number,
  p: {
    id: string;
    imageUrl: string;
    name: string;
    category: string;
    description: string;
    price: string | number;
  },
  tab = TAB_PRODUCTS
) {
  const range = `${tab}!A${rowNumber}:F${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      p.id ?? "",
      p.imageUrl ?? "",
      p.name ?? "",
      p.category ?? "",
      p.description ?? "",
      String(p.price ?? ""),
    ]],
  };
  const res = await fetchWithAuth(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ลบสินค้า (clear) A..F
export async function deleteProduct(rowNumber: number, tab = TAB_PRODUCTS) {
  const range = `${tab}!A${rowNumber}:F${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ----- alias ให้ตรงกับหน้า ProductManagement.tsx -----
export const updateProductRow = updateProduct;
export const deleteProductRow = deleteProduct;
