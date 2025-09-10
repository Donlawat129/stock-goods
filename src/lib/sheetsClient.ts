// lib/sheetsClient.ts

// ===== Env =====
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SHEET_ID = import.meta.env.VITE_SHEET_ID as string;
const SHEET_TAB = (import.meta.env.VITE_SHEET_TAB as string) || "Users"; // สำหรับ Users
const TAB_PRODUCTS = (import.meta.env.VITE_SHEET_TAB_PRODUCTS as string) || "Products";

// แค่ scope spreadsheets ก็พอสำหรับอ่าน/เขียนชีต
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// ===== Token Storage Keys =====
const TOKEN_KEY = "sheets_token";
const TOKEN_EXP_KEY = "sheets_token_exp"; // epoch ms

// ===== OAuth token (ต้องอยู่ก่อนใช้งานทุกฟังก์ชัน) =====
let accessToken: string | null = null;

// ---------- Utilities ----------
const now = () => Date.now();

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
  // พยายามกู้จาก localStorage ถ้ายังไม่มีในหน่วยความจำ
  if (!accessToken) accessToken = getStoredToken();
  if (!accessToken) throw new Error("No OAuth token. Call requestSheetsToken() first.");
  return accessToken;
}

// โหลด GSI อัตโนมัติถ้ายังไม่มี <script>
function ensureGisLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => !!(window as any).google?.accounts?.oauth2;

    // มีอยู่แล้ว
    if (ok()) return resolve();

    // ถ้ามีแท็กแล้วรอให้โหลดเสร็จ
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]'
    );
    if (existing) {
      const iv = setInterval(() => {
        if (ok()) {
          clearInterval(iv);
          resolve();
        }
      }, 50);
      return;
    }

    // สร้างแท็ก script ใหม่
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
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

/** ให้มี token พร้อมใช้: พยายาม silent ก่อน ถ้าไม่ได้ค่อย consent */
export async function ensureToken() {
  // พยายามโหลด token จาก storage
  accessToken = getStoredToken();
  if (accessToken) return accessToken;

  // silent ก่อน
  try {
    return await requestSheetsToken("none");
  } catch {
    // ถ้าไม่ได้ ค่อย popup
    return await requestSheetsToken("consent");
  }
}

/** ล้าง token ทั้งหมด (logout) */
export function clearSheetsToken() {
  accessToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

/** helper สำหรับ debug UI */
export function getAuthInfo() {
  return {
    hasMemoryToken: !!accessToken,
    hasStoredToken: !!getStoredToken(),
    expAt: Number(localStorage.getItem(TOKEN_EXP_KEY) || 0),
  };
}

// ---------- Fetch helper (auto refresh on 401) ----------
async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  // 1) ถ้ายังไม่มี token ลอง silent ก่อน
  if (!accessToken) {
    try {
      await requestSheetsToken("none");
    } catch {}
  }
  // 2) ถ้ายังไม่มีอีก ให้ popup consent อัตโนมัติ (ครั้งแรก)
  if (!accessToken) {
    try {
      await requestSheetsToken("consent");
    } catch {}
  }

  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${assertToken()}`);

  const res = await fetch(url, { ...init, headers });
  if (res.status !== 401 || !retry) return res;

  // 401 → ลองรีเฟรชแบบเงียบ ถ้าไม่ได้ค่อย consent แล้ว retry 1 ครั้ง
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}`;
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}`;
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
  rowNumber: number; // แถวจริง (1-based) เพื่อแก้ไข/ลบ
  id: string; // A
  imageUrl: string; // B
  name: string; // C
  category: string; // D
  description: string; // E
  price: string; // F
  quantity: string; // G
};

// หา Product ID ถัดไปแบบเรียงเลข 1,2,3,...
export async function getNextProductId(
  tab = (import.meta.env.VITE_SHEET_TAB_PRODUCTS as string) || "Products"
): Promise<string> {
  const { items } = await getProducts(tab);
  let max = 0;
  for (const it of items) {
    const s = String(it.id || "").trim();
    if (/^\d+$/.test(s)) {
      const n = parseInt(s, 10);
      if (n > max) max = n;
    }
  }
  return String(max + 1 || 1);
}

// อ่านสินค้าทั้งหมด (A..G)
export async function getProducts(
  tab = TAB_PRODUCTS
): Promise<{ header: string[]; items: ProductRow[] }> {
  const range = `${tab}!A1:G`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}`;
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
      quantity: r[6] ?? "",
    }))
    .filter((x) => x.id);

  return { header, items };
}

// เพิ่มสินค้า (append) A..G
export async function addProduct(
  p: {
    id: string;
    imageUrl: string;
    name: string;
    category: string;
    description: string;
    price: string | number;
    quantity: string | number;
  },
  tab = TAB_PRODUCTS
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    tab
  )}!A1:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [
      [
        p.id ?? "",
        p.imageUrl ?? "",
        p.name ?? "",
        p.category ?? "",
        p.description ?? "",
        String(p.price ?? ""),
        String(p.quantity ?? ""),
      ],
    ],
  };
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// อัปเดตสินค้า (ตาม rowNumber) A..G
export async function updateProduct(
  rowNumber: number,
  p: {
    id: string;
    imageUrl: string;
    name: string;
    category: string;
    description: string;
    price: string | number;
    quantity: string | number;
  },
  tab = TAB_PRODUCTS
) {
  const range = `${tab}!A${rowNumber}:G${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [
      [
        p.id ?? "",
        p.imageUrl ?? "",
        p.name ?? "",
        p.category ?? "",
        p.description ?? "",
        String(p.price ?? ""),
        String(p.quantity ?? ""),
      ],
    ],
  };
  const res = await fetchWithAuth(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ลบสินค้า (clear) A..G
export async function deleteProduct(rowNumber: number, tab = TAB_PRODUCTS) {
  const range = `${tab}!A${rowNumber}:G${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}:clear`;
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

// ====== Banner Hero (Google Sheets) ======
const TAB_BANNER_HERO =
  (import.meta.env.VITE_SHEET_TAB_BANNERHERO as string) || "BannerHero";

// โครงสร้างข้อมูลของแบนเนอร์ตามชีตใหม่
// A:No | B:Image | C:Title | D:Subtitle | E:Desc | F:Color | G:ButtonColor | H:Config
export type BannerRow = {
  rowNumber: number; // เลขแถวจริง (1-based) สำหรับอัปเดต/ลบ
  title: string;     // C
  subtitle: string;  // D
  desc: string;      // E
  image: string;     // B
  color: string;     // F
  buttonColor: string; // G
};

// อ่านรายการแบนเนอร์ทั้งหมด (A..H)
export async function getHeroBanners(
  tab = TAB_BANNER_HERO
): Promise<{ header: string[]; items: BannerRow[] }> {
  const range = `${tab}!A1:H`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(await res.text());

  const data = (await res.json()) as { values?: string[][] };
  const values = data.values ?? [];
  const [header = [], ...rows] = values;

  const items: BannerRow[] = rows
    .map((r, i) => ({
      rowNumber: i + 2,              // แถวจริง (ข้ามเฮดเดอร์)
      image: r[1] ?? "",             // B
      title: r[2] ?? "",             // C
      subtitle: r[3] ?? "",          // D
      desc: r[4] ?? "",              // E
      color: r[5] ?? "",             // F
      buttonColor: r[6] ?? "",       // G
    }))
    // แสดงเฉพาะแถวที่มีข้อมูลหลัก ๆ อย่างน้อย 1 ช่อง
    .filter((x) => x.title || x.subtitle || x.image || x.desc);

  return { header, items };
}

// เพิ่มแถวใหม่ (จะไม่ไปยุ่งคอลัมน์ A:No)
export async function addHeroBanner(
  b: Omit<BannerRow, "rowNumber">,
  tab = TAB_BANNER_HERO
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    tab
  )}!A1:append?valueInputOption=USER_ENTERED`;
  const body = {
    // ใส่ "" ไว้ช่อง A (No) ให้คงว่าง/ให้สูตรจัดการเอง
    values: [[
      "",                       // A: No
      b.image ?? "",            // B: Image
      b.title ?? "",            // C: Title
      b.subtitle ?? "",         // D: Subtitle
      b.desc ?? "",             // E: Desc
      b.color ?? "",            // F: Color
      b.buttonColor ?? "",      // G: ButtonColor
      "",                       // H: Config (ไม่แตะตอนเพิ่มแถวข้อมูล)
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

// อัปเดตแถวตาม rowNumber (เขียน B..G ตามสคีม่าใหม่)
export async function updateHeroBanner(
  rowNumber: number,
  b: Omit<BannerRow, "rowNumber">,
  tab = TAB_BANNER_HERO
) {
  // ยิงเฉพาะช่วง B..G (ไม่ยุ่ง A และ H)
  const range = `${tab}!B${rowNumber}:G${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      b.image ?? "",        // B
      b.title ?? "",        // C
      b.subtitle ?? "",     // D
      b.desc ?? "",         // E
      b.color ?? "",        // F
      b.buttonColor ?? "",  // G
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

// ลบแถว (ล้าง B..G และคง A/H ไว้)
export async function deleteHeroBanner(rowNumber: number, tab = TAB_BANNER_HERO) {
  const range = `${tab}!B${rowNumber}:G${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}:clear`;
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---- Config: autoplay (ms) ที่คอลัมน์ H2 ----
export async function getHeroIntervalMs(tab = TAB_BANNER_HERO): Promise<number> {
  // อ่านเซลล์ H2 เพียงช่องเดียว
  const range = `${tab}!H2`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}`;
  try {
    const res = await fetchWithAuth(url);
    if (!res.ok) return 10000;
    const data = (await res.json()) as { values?: string[][] };
    const raw = data.values?.[0]?.[0];
    const ms = Number(raw);
    return Number.isFinite(ms) ? ms : 10000;
  } catch {
    return 10000;
  }
}

export async function setHeroIntervalMs(ms: number, tab = TAB_BANNER_HERO) {
  // เขียนลง H2 อย่างเดียว (ไม่แตะ H1 header)
  const range = `${tab}!H2`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;
  const body = { values: [[String(ms)]] };
  const res = await fetchWithAuth(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
