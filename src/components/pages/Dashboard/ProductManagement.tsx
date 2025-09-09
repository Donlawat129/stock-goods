// src/components/dashboard/ProductManagement.tsx
import { useMemo, useState } from "react";
import { FiPlus, FiEdit, FiTrash, FiLink } from "react-icons/fi";

// ===== Google Sheets helpers =====
import {
  requestSheetsToken,
  getProducts,
  addProduct,
  updateProductRow,
  deleteProductRow,
} from "../../../lib/sheetsClient";

// ---------- Types ----------
export type Category = "Mens" | "Womens" | "Objects";
const CATEGORIES: Category[] = ["Mens", "Womens", "Objects"];

export interface ProductItem {
  rowNumber: number;
  id: string;          // A
  imageUrl: string;    // B
  name: string;        // C
  // ใช้ string เพื่อให้รับค่าที่มาจากชีตได้ทุกกรณี (กัน header/พิมพ์ผิด)
  category: string;    // D
  description: string; // E
  price: string;       // F
}

interface ProductForm {
  id: string;
  imageUrl: string;
  name: string;
  category: Category | ""; // ว่างได้ระหว่างยังไม่เลือก
  description: string;
  price: string | number;
}

const initForm: ProductForm = {
  id: "",
  imageUrl: "",
  name: "",
  category: "",
  description: "",
  price: "",
};

export default function ProductManagement() {
  const [connected, setConnected] = useState(false);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [form, setForm] = useState<ProductForm>(initForm);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = useMemo(() => editingRow !== null, [editingRow]);

  const connectSheets = async () => {
    try {
      await requestSheetsToken();
      setConnected(true);
      await refresh();
    } catch (err: unknown) {
      console.error("connect error:", err);
      alert((err as any)?.message ?? "เชื่อม Google Sheets ไม่สำเร็จ");
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const { items } = await getProducts();
      // ป้องกันคอลัมน์ไม่ครบ -> fill เป็นสตริงว่าง
      const normalized = (items as any[]).map((r, i) => ({
        rowNumber: r.rowNumber ?? i + 2,
        id: r.id ?? "",
        imageUrl: r.imageUrl ?? "",
        name: r.name ?? "",
        category: r.category ?? "",       // << สำคัญ
        description: r.description ?? "",
        price: r.price ?? "",
      })) as ProductItem[];
      setItems(normalized);
    } catch (err: unknown) {
      console.error("refresh error:", err);
      alert((err as any)?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.id || !form.name) return alert("กรอก ID และชื่อสินค้า");
    if (!form.category) return alert("เลือก Category");
    setLoading(true);
    try {
      // ✅ ประกอบ payload ให้เรียงและมี category แน่นอน
      const payload = {
        id: String(form.id).trim(),
        imageUrl: String(form.imageUrl).trim(),
        name: String(form.name).trim(),
        category: String(form.category).trim(),      // << ส่งแน่ ๆ
        description: String(form.description).trim(),
        price: String(form.price).trim(),
      };

      if (isEditing && editingRow !== null) {
        await updateProductRow(editingRow, payload);
      } else {
        await addProduct(payload);
      }

      setForm(initForm);
      setEditingRow(null);
      await refresh();
    } catch (err: unknown) {
      console.error("submit error:", err);
      alert((err as any)?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (rowNumber: number, item: ProductItem) => {
    setEditingRow(rowNumber);
    setForm({
      id: item.id ?? "",
      imageUrl: item.imageUrl ?? "",
      name: item.name ?? "",
      // cast ถ้าค่า category จากชีตไม่ตรงกับสามตัวเลือก จะเซตเป็น "" เพื่อให้เลือกใหม่
      category: (CATEGORIES as string[]).includes(item.category) ? (item.category as Category) : "",
      description: item.description ?? "",
      price: item.price ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (rowNumber: number) => {
    if (!confirm("ลบสินค้านี้ใช่ไหม?")) return;
    setLoading(true);
    try {
      await deleteProductRow(rowNumber);
      await refresh();
    } catch (err: unknown) {
      console.error("delete error:", err);
      alert((err as any)?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Product Management</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-lg border text-sm"
            onClick={connectSheets}
            disabled={connected}
          >
            {connected ? "✅ Connected" : "🔗 Connect Google Sheets"}
          </button>
          <button
            className="px-3 py-2 rounded-lg border text-sm"
            onClick={refresh}
            disabled={!connected || loading}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <input
          className="border p-2 rounded"
          placeholder="Product ID"
          value={form.id}
          onChange={(e) => setForm({ ...form, id: e.target.value })}
        />

        <div className="md:col-span-2 flex gap-2">
          <input
            className="border p-2 rounded flex-1"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <a
            className="px-3 flex items-center gap-1 text-sm underline"
            href={form.imageUrl || "#"}
            target="_blank"
            rel="noreferrer"
            title="ดูรูป"
          >
            <FiLink /> ดูรูป
          </a>
        </div>

        <input
          className="border p-2 rounded"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Category dropdown */}
        <select
          className="border p-2 rounded"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
        >
          <option value="" disabled>
            Category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <input
          className="border p-2 rounded md:col-span-6"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="md:col-span-6 flex gap-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            type="submit"
            disabled={!connected || loading}
          >
            {isEditing ? (
              <>
                <FiEdit className="inline mr-1" /> Update
              </>
            ) : (
              <>
                <FiPlus className="inline mr-1" /> Add
              </>
            )}
          </button>

          {isEditing && (
            <button
              type="button"
              className="border px-3 py-2 rounded"
              onClick={() => {
                setEditingRow(null);
                setForm(initForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Image</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.rowNumber} className="border-t">
                <td className="py-2 pr-4 font-mono">{it.id}</td>
                <td className="py-2 pr-4">
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt={it.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-2 pr-4">{it.name}</td>
                <td className="py-2 pr-4">{it.category}</td>
                <td className="py-2 pr-4 max-w-[320px] truncate" title={it.description}>
                  {it.description}
                </td>
                <td className="py-2 pr-4">{it.price}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    <button
                      className="border px-2 py-1 rounded flex items-center gap-1"
                      onClick={() => onEdit(it.rowNumber, it)}
                    >
                      <FiEdit /> Edit
                    </button>
                    <button
                      className="border px-2 py-1 rounded text-red-600 flex items-center gap-1"
                      onClick={() => onDelete(it.rowNumber)}
                    >
                      <FiTrash /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-4 text-gray-500" colSpan={7}>
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
