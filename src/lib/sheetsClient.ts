// src/lib/sheetsClient.ts

// ===== Env =====
const CLIENT_ID  = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SHEET_ID   = import.meta.env.VITE_SHEET_ID as string;
const SHEET_TAB  = (import.meta.env.VITE_SHEET_TAB as string) || "Users";     // สำหรับ Users
const DEFAULT_TAB = SHEET_TAB;

// ===== OAuth token (ต้องอยู่ก่อนใช้งานทุกฟังก์ชัน) =====
let accessToken: string | null = null;

function assertToken() {
  if (!accessToken) throw new Error("No OAuth token. Call requestSheetsToken() first.");
  return accessToken;
}

// 1) ขอ OAuth token แบบ popup (Google Identity Services)
export function requestSheetsToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const g = (window as any).google;
    if (!g?.accounts?.oauth2) return reject(new Error("GSI not loaded"));

    const tokenClient = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (resp: any) => {
        const token = resp?.access_token as string | undefined;
        if (token) {
          accessToken = token;
          resolve(token);
        } else {
          reject(new Error("No access token"));
        }
      },
    });

    tokenClient.requestAccessToken();
  });
}

// 2) ฟังก์ชันอ่านช่วงข้อมูลทั่วไป
export async function readSheet(tabName?: string) {
  const token = assertToken();
  const range = `${tabName || DEFAULT_TAB}!A1:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ====== ส่วน Users (เดิม) ======
export async function appendUserRow(uid: string, email: string, password: string) {
  const token = assertToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!A1:append?valueInputOption=USER_ENTERED`;
  const body = { values: [[uid, email, password]] };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function readUsers() {
  const token = assertToken();
  const range = `${SHEET_TAB}!A1:C`; // uid | email | password
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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

// ====== ส่วน Products (ที่หน้า Dashboard ใช้) ======
const TAB_PRODUCTS = (import.meta.env.VITE_SHEET_TAB_PRODUCTS as string) || "Products";

export type ProductRow = {
  rowNumber: number; // ใช้ชี้แถวเวลาแก้ไข/ลบ
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  price: string;
};

// อ่านสินค้าทั้งหมด
export async function getProducts(tab = TAB_PRODUCTS): Promise<{ header: string[]; items: ProductRow[] }> {
  const token = assertToken();
  const range = `${tab}!A1:E`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());

  const data = (await res.json()) as { values?: string[][] };
  const values = data.values ?? [];
  const [header = [], ...rows] = values;

  const items: ProductRow[] = rows
    .map((r, i) => ({
      rowNumber: i + 2, // แถวจริงเริ่มที่ 2
      id: r[0] ?? "",
      imageUrl: r[1] ?? "",
      name: r[2] ?? "",
      description: r[3] ?? "",
      price: r[4] ?? "",
    }))
    .filter((x) => x.id);

  return { header, items };
}

// เพิ่มสินค้า (append แถวใหม่)
export async function addProduct(
  p: { id: string; imageUrl: string; name: string; description: string; price: string | number },
  tab = TAB_PRODUCTS
) {
  const token = assertToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tab)}!A1:append?valueInputOption=USER_ENTERED`;
  const body = { values: [[p.id, p.imageUrl, p.name, p.description, String(p.price)]] };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// อัปเดตสินค้า (โดยใช้ rowNumber)
export async function updateProduct(
  rowNumber: number,
  p: { id: string; imageUrl: string; name: string; description: string; price: string | number },
  tab = TAB_PRODUCTS
) {
  const token = assertToken();
  const range = `${tab}!A${rowNumber}:E${rowNumber}`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const body = { values: [[p.id, p.imageUrl, p.name, p.description, String(p.price)]] };
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ลบสินค้า (ล้างค่าแถว)
export async function deleteProduct(rowNumber: number, tab = TAB_PRODUCTS) {
  const token = assertToken();
  const range = `${tab}!A${rowNumber}:E${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ----- ชื่อ alias ให้ตรงกับหน้า Dashboard.tsx -----
export const updateProductRow = updateProduct;
export const deleteProductRow = deleteProduct;
