export type Product = {
  id: string;              // ไอดีสินค้า (document id ใน Firestore)
  image: string;           // URL รูปสินค้า
  name: string;            // ชื่อสินค้า
  description: string;     // รายละเอียด
  price: number;           // ราคา (หน่วยเป็นบาทหรือสกุลเงินที่คุณใช้)
  createdAt: number;       // timestamp ms
  updatedAt: number;       // timestamp ms
};
