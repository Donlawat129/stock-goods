export interface LedgerRow {
  rowNumber?: number;     // ใช้ตอนแก้/ลบ
  id: string;             // LG-xxxxx
  date: string;           // YYYY-MM-DD
  productId: string;      // อ้างอิง Products.id
  productName: string;
  quantity: number;
  price: number;          // ราคาต่อหน่วย ณ วันที่ทำรายการ
  amount: number;         // quantity * price
  note?: string;
  createdAt: string;      // ISO
  updatedAt?: string;
}
