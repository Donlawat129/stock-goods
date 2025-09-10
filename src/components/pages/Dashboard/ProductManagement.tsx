// src/components/pages/Dashboard/ProductManagement.tsx
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash,
  FiLink,
  FiCloud,
  FiRefreshCw,
} from "react-icons/fi";
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
  id: string;           // A
  imageUrl: string;     // B
  name: string;         // C
  category: string;     // D
  description: string;  // E
  price: string;        // F
  quantity: string;     // G
}

interface ProductForm {
  id: string;
  imageUrl: string;
  name: string;
  category: Category | "";
  description: string;
  price: string | number;
  quantity: string | number;
}

const initForm: ProductForm = {
  id: "",
  imageUrl: "",
  name: "",
  category: "",
  description: "",
  price: "",
  quantity: "",
};

export default function ProductManagement() {
  const [connected, setConnected] = useState(false);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [form, setForm] = useState<ProductForm>(initForm);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = useMemo(() => editingRow !== null, [editingRow]);

  // ===== Actions =====
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
      const normalized = (items as any[]).map((r, i) => ({
        rowNumber: r.rowNumber ?? i + 2,
        id: r.id ?? "",
        imageUrl: r.imageUrl ?? "",
        name: r.name ?? "",
        category: r.category ?? "",
        description: r.description ?? "",
        price: r.price ?? "",
        quantity: r.quantity ?? "",
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
      const payload = {
        id: String(form.id).trim(),
        imageUrl: String(form.imageUrl).trim(),
        name: String(form.name).trim(),
        category: String(form.category).trim(),
        description: String(form.description).trim(),
        price: String(form.price).trim(),
        quantity: String(form.quantity).trim(),
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
      category: (CATEGORIES as string[]).includes(item.category)
        ? (item.category as Category)
        : "",
      description: item.description ?? "",
      price: item.price ?? "",
      quantity: item.quantity ?? "",
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

  // ===== Reusable styles (เหมือนการ์ด Dashboard) =====
  const card =
    "bg-white rounded-2xl shadow-sm border border-gray-200/60";

  const input =
    "w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm placeholder:text-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent";

  const actionBtn =
    "inline-flex items-center gap-2 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition";

  const primaryBtn =
    "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 text-sm shadow " +
    "hover:opacity-95 disabled:opacity-50";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
          <p className="text-gray-500 text-sm">
            Manage products synced with Google Sheets
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className={actionBtn}
            onClick={connectSheets}
            disabled={connected}
            title="Connect Google Sheets"
          >
            <FiCloud className="text-indigo-500" />
            {connected ? "Connected" : "Connect Google Sheets"}
          </button>
          <button
            className={actionBtn}
            onClick={refresh}
            disabled={!connected || loading}
            title="Refresh"
          >
            <FiRefreshCw className="text-gray-600" />
            Refresh
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className={card}>
        <div className="p-5">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <input
              className={input}
              placeholder="Product ID"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />

            <div className="md:col-span-2 flex gap-2">
              <input
                className={input + " flex-1"}
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
              <a
                className="inline-flex items-center gap-1 px-3 text-sm text-indigo-600 hover:text-indigo-700"
                href={form.imageUrl || "#"}
                target="_blank"
                rel="noreferrer"
                title="ดูรูป"
              >
                <FiLink /> ดูรูป
              </a>
            </div>

            <input
              className={input}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            {/* Category */}
            <select
              className={input}
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
              className={input}
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <input
              className={input}
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              inputMode="numeric"
            />

            {/* Description → textarea */}
            <textarea
              className={input + " md:col-span-7 resize-y"}
              placeholder="Description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="md:col-span-7 flex gap-2 pt-1">
              <button
                className={primaryBtn}
                type="submit"
                disabled={!connected || loading}
              >
                {isEditing ? (
                  <>
                    <FiEdit /> Update
                  </>
                ) : (
                  <>
                    <FiPlus /> Add
                  </>
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className={actionBtn}
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
        </div>
      </div>

      {/* Table card */}
      <div className={card}>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  {["ID","Image","Name","Category","Description","Price","Quantity",""].map((h) => (
                    <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr
                    key={it.rowNumber}
                    className={`border-t ${idx % 2 ? "bg-gray-50/40" : "bg-white"} hover:bg-indigo-50/40 transition`}
                  >
                    <td className="py-2 pr-4 font-mono">{it.id}</td>
                    <td className="py-2 pr-4">
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt={it.name}
                          className="h-10 w-10 object-cover rounded-md ring-1 ring-gray-200"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2 pr-4">{it.name}</td>
                    <td className="py-2 pr-4">{it.category}</td>
                    <td
                      className="py-2 pr-4 max-w-[480px] truncate"
                      title={it.description}
                    >
                      {it.description}
                    </td>
                    <td className="py-2 pr-4">{it.price}</td>
                    <td className="py-2 pr-4">{it.quantity}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button
                          className={actionBtn}
                          onClick={() => onEdit(it.rowNumber, it)}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          className={actionBtn + " text-red-600 hover:bg-red-50"}
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
                    <td className="py-4 text-gray-500" colSpan={8}>
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
