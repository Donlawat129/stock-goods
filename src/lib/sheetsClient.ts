// src/lib/sheetsClient.ts
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SHEET_ID  = import.meta.env.VITE_SHEET_ID as string;
const SHEET_TAB = (import.meta.env.VITE_SHEET_TAB as string) || 'Users';
const DEFAULT_TAB = import.meta.env.VITE_SHEET_TAB as string;

// อ่านข้อมูลจากแท็บที่กำหนด (ถ้าไม่ใส่ ใช้ DEFAULT_TAB)
export async function readSheet(tabName?: string) {
  const token = assertToken();
  const range = `${tabName || DEFAULT_TAB}!A1:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}
let accessToken: string | null = null;
await readSheet('Logs');      // อ่านแท็บ Logs
await readSheet('Inventory'); // อ่านแท็บ Inventory
await readSheet();            // ถ้าไม่ใส่จะไปอ่านแท็บ Users (default)

// 1) ขอโทเคน OAuth แบบ popup
export function requestSheetsToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const g = (window as any).google;
    if (!g?.accounts?.oauth2) return reject(new Error('GSI not loaded'));

    const tokenClient = g.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (resp: any) => {
        const token = resp?.access_token as string | undefined;
        if (token) {
          accessToken = token;
          resolve(token); // <-- แน่ใจว่าเป็น string
        } else {
          reject(new Error('No access token'));
        }
      },
    });

    tokenClient.requestAccessToken();
  });
}
function assertToken() {
  if (!accessToken) throw new Error('No OAuth token. Call requestSheetsToken() first.');
  return accessToken;
}

// 2) เขียนแถวใหม่: [[uid, email, password]]
export async function appendUserRow(uid: string, email: string, password: string) {
  const token = assertToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!A1:append?valueInputOption=USER_ENTERED`;
  const body = { values: [[uid, email, password]] };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 3) อ่าน Users ทั้งหมด (A:C)
export async function readUsers() {
  const token = assertToken();
  const range = `${SHEET_TAB}!A1:C`; // uid | email | password
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json() as { values?: string[][] };
  const values = data.values || [];
  const [header, ...rows] = values;
  return { header: header || [], rows };
}

// 4) ฟังก์ชันช่วยหา user จาก email/password (เดโมเท่านั้น)
export async function findUserByEmailPassword(email: string, password: string) {
  const { rows } = await readUsers();
  for (const r of rows) {
    const [uid, em, pw] = [r[0] || '', r[1] || '', r[2] || ''];
    if (em === email && pw === password) return { uid, email: em };
  }
  return null;
}
