// src/lib/auth.ts
import { readUsers, appendUserRow, findUserByEmailPassword } from "./sheetsClient";

// ฟังก์ชัน Register (แค่สร้าง user ใหม่)
export async function registerUser(email: string, password: string) {
  // 1. อ่าน Users ทั้งหมด
  const { rows } = await readUsers();
  const exists = rows.some((r) => r[1] === email);
  if (exists) throw new Error("Email already registered");

  // 2. สร้าง UID (ง่ายๆ ใช้ timestamp + random)
  const uid = `uid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 3. เพิ่ม User ลง Sheet
  await appendUserRow(uid, email, password);

  // 4. Return message แค่แจ้งว่า register สำเร็จ
  return { message: "Register successful. Please login." };
}

// ฟังก์ชัน Login
export async function login(email: string, password: string) {
  const user = await findUserByEmailPassword(email, password);
  if (!user) throw new Error("Invalid email or password");
  return user;
}
