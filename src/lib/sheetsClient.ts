// src/lib/sheetsClient.ts
type AnyObj = Record<string, any>;

const GAS_URL   = import.meta.env.VITE_GAS_URL as string;
const GAS_TOKEN = import.meta.env.VITE_GAS_TOKEN as string;

function assertEnv() {
  if (!GAS_URL)  throw new Error('Missing VITE_GAS_URL');
  if (!GAS_TOKEN) throw new Error('Missing VITE_GAS_TOKEN');
}

async function callGAS<T = any>(action: string, payload: AnyObj = {}): Promise<T> {
  assertEnv();
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ token: GAS_TOKEN, action, payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!json?.ok) throw new Error(json?.error || `GAS error for action "${action}"`);
  return json.data as T;
}

// ===== Products =====
export type Category = "Mens" | "Womens" | "Objects";

export interface ProductItem {
  rowNumber: number;     // แถวในชีต
  id: string;            // A
  imageUrl: string;      // B
  name: string;          // C
  category: string;      // D
  description: string;   // E
  price: string;         // F (เก็บเป็น string ตามชีต)
  quantity: string;      // G (เก็บเป็น string ตามชีต)
}

// ===== Ledger (10 คอลัมน์: no,date,id(product),name(product),type,quantity,amount,total amount,stock,note)
export type LedgerRow = {
  rowNumber?: number;                 // แถวในชีท
  no?: number;
  date: string;
  productId: string;
  productName: string;
  type: "รายรับ" | "รายจ่าย";        // ✅ ใหม่
  quantity: number;
  amount: number;
  totalAmount: number;
  stock: number;
  note?: string;                      // ✅ ใหม่
};

// ========== Compatibility stubs ==========
export async function requestSheetsToken(): Promise<boolean> { return true; }
export async function ensureToken(): Promise<boolean> { return true; }

// ========== Products ==========
export async function getProducts(): Promise<ProductItem[]> {
  return callGAS<ProductItem[]>("products.get");
}
export async function addProduct(item: Omit<ProductItem, "rowNumber">): Promise<{ rowNumber: number; id: string }> {
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

// ========== Banner (optional) ==========
export async function getHeroIntervalMs(): Promise<number> {
  // หมายเหตุ: ถ้า Apps Script ยังไม่มี route 'banner.getInterval' ฟังก์ชันนี้จะไม่ถูกใช้ในหน้า Finance
  return callGAS<number>("banner.getInterval");
}
export async function setHeroIntervalMs(ms: number): Promise<{ ok: true }> {
  return callGAS("banner.setInterval", { ms });
}

// ========== Users (optional) ==========
export async function appendUser(row: (string | number | boolean)[]): Promise<{ rowNumber: number }> {
  return callGAS("users.append", { row });
}

/* ========== Ledger (แมปกับ ledger8.* ที่ฝั่ง GAS ชี้ไปยัง 10 คอลัมน์) ========== */
// อ่านทั้งหมด
export async function getLedger(): Promise<LedgerRow[]> {
  return callGAS<LedgerRow[]>("ledger8.get");
}

// เพิ่มรายการ (ส่ง type/note ได้; GAS จะเติมชื่อ/ราคา/คำนวณ total/stock ให้เอง)
export async function addLedger(input: {
  date: string;
  productId: string;
  quantity: number;
  type?: "รายรับ" | "รายจ่าย";
  note?: string;
}): Promise<{ rowNumber: number; no: number }> {
  return callGAS("ledger8.add", input);
}

// อัปเดตบางฟิลด์ (รองรับ date/productId/quantity/type/note)
export async function updateLedgerRow(
  rowNumber: number,
  fields: Partial<{ date: string; productId: string; quantity: number; type: "รายรับ" | "รายจ่าย"; note: string; }>
): Promise<{ updated: true }> {
  return callGAS("ledger8.updateRow", { rowNumber, fields });
}

// ลบแถว
export async function deleteLedgerRow(rowNumber: number): Promise<{ deleted: true }> {
  return callGAS("ledger8.deleteRow", { rowNumber });
}

// สั่งคำนวณ amount/total/stock ใหม่ทั้งหมด
export async function recalcLedger(): Promise<{ rows: number }> {
  return callGAS("ledger8.recalcAll");
}
