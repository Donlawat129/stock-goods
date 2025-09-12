// src/lib/sheetsClient.ts
// Proxy ไปหา Google Apps Script Web App เพื่อให้ GAS เป็นคนเขียน/อ่าน Google Sheets ให้เรา
// ✅ Drop-in แทนเวอร์ชันเดิม: คงชื่อฟังก์ชันหลักๆ เดิมไว้

type AnyObj = Record<string, any>;

const GAS_URL   = import.meta.env.VITE_GAS_URL as string;   // ex: https://script.google.com/macros/s/xxx/exec
const GAS_TOKEN = import.meta.env.VITE_GAS_TOKEN as string; // ex: safe-2025-abcdef....

function assertEnv() {
  if (!GAS_URL)  throw new Error('Missing VITE_GAS_URL');
  if (!GAS_TOKEN) throw new Error('Missing VITE_GAS_TOKEN');
}

// ส่งคำสั่งไปที่ GAS (เลี่ยง CORS preflight โดยใช้ text/plain)
async function callGAS<T = any>(action: string, payload: AnyObj = {}): Promise<T> {
  assertEnv();
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ token: GAS_TOKEN, action, payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!json?.ok) {
    throw new Error(json?.error || `GAS error for action "${action}"`);
  }
  return json.data as T;
}

/* =========================
   Types (ตาม schema เดิม)
   ========================= */
export type Category = "Mens" | "Womens" | "Objects";

export interface ProductItem {
  rowNumber: number;     // แถวในชีต
  id: string;            // คอลัมน์ A
  imageUrl: string;      // คอลัมน์ B
  name: string;          // คอลัมน์ C
  category: string;      // คอลัมน์ D
  description: string;   // คอลัมน์ E
  price: string;         // คอลัมน์ F
  quantity: string;      // คอลัมน์ G
}

// ========== Compatibility stubs (ไม่ต้อง OAuth แล้ว) ==========
export async function requestSheetsToken(): Promise<boolean> { return true; }
export async function ensureToken(): Promise<boolean> { return true; }

// ========== Products ==========
export async function getProducts(): Promise<ProductItem[]> {
  return callGAS<ProductItem[]>("products.get");
}

export async function addProduct(item: Omit<ProductItem, "rowNumber">): Promise<{ rowNumber: number }> {
  return callGAS("products.add", { item });
}

export async function updateProductRow(rowNumber: number, fields: Partial<ProductItem>): Promise<{ updated: true }> {
  return callGAS("products.updateRow", { rowNumber, fields });
}

export async function deleteProductRow(rowNumber: number): Promise<{ deleted: true }> {
  return callGAS("products.deleteRow", { rowNumber });
}

export async function getNextProductId(): Promise<{ id: string }> {
  return callGAS("products.nextId");
}


// ========== Banner Hero (H2 เก็บ interval) ==========
export async function getHeroIntervalMs(): Promise<number> {
  return callGAS<number>("banner.getInterval");
}

export async function setHeroIntervalMs(ms: number): Promise<{ ok: true }> {
  return callGAS("banner.setInterval", { ms });
}

// ========== Users (ตัวอย่าง helper) ==========
export async function appendUser(row: (string | number | boolean)[]): Promise<{ rowNumber: number }> {
  // คุณสามารถผูกกับแบบฟอร์มลง tab Users ได้
  return callGAS("users.append", { row });
}

// ========== อื่นๆ ที่อยากเพิ่มในอนาคต ==========
// สร้าง action ใหม่ใน Apps Script แล้วมา wrap ฟังก์ชันที่นี่
