// src/components/pages/Dashboard/ProductManagement.tsx
import { useEffect, useMemo, useState } from "react";
import {
  FiPlus, FiEdit, FiTrash, FiLink, FiCloud, FiRefreshCw, FiArrowDown, FiSearch,
} from "react-icons/fi";
import {
  requestSheetsToken,
  ensureToken,
  addProduct,
  getProducts,
  updateProductRow,
  deleteProductRow,
  getNextProductId,
  type ProductItem, // ✅ ใช้ type จาก sheetsClient
} from "../../../lib/sheetsClient";

// ---------- Types ----------
export type Category = "Mens" | "Womens" | "Objects";
const CATEGORIES: Category[] = ["Mens", "Womens", "Objects"];

// เพิ่ม All เป็นตัวเลือกพิเศษสำหรับการแสดงผล
type SortCategory = Category | "All";

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

  // ✅ state: เลือกหมวด (หรือ All) + คำค้นหา
  const [sortCategory, setSortCategory] = useState<SortCategory>("All");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchText, setSearchText] = useState("");

  // ------- helpers -------
  const assignNewId = async () => {
    const { id: nextId } = await getNextProductId();
    setForm((f) => ({ ...f, id: nextId }));
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await getProducts();
      const normalized: ProductItem[] = (Array.isArray(list) ? list : []).map((r, i) => ({
        rowNumber: r.rowNumber ?? i + 2,
        id: r.id ?? "",
        imageUrl: r.imageUrl ?? "",
        name: r.name ?? "",
        category: r.category ?? "",
        description: r.description ?? "",
        price: r.price ?? "",
        quantity: r.quantity ?? "",
      }));
      setItems(normalized);
    } catch (err: unknown) {
      console.error("refresh error:", err);
      alert((err as any)?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ===== Auto connect on mount =====
  useEffect(() => {
    (async () => {
      try {
        await ensureToken();   // stub: true
        setConnected(true);
        await refresh();
        await assignNewId();
      } catch {
        // รอให้ผู้ใช้กด Connect
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Actions =====
  const connectSheets = async () => {
    try {
      await requestSheetsToken(); // stub: true
      setConnected(true);
      await refresh();
      await assignNewId();
    } catch (err: unknown) {
      console.error("connect error:", err);
      alert((err as any)?.message ?? "เชื่อม Google Sheets ไม่สำเร็จ");
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name) return alert("กรอกชื่อสินค้า");
    if (!form.category) return alert("เลือก Category");

    setLoading(true);
    try {
      let idToUse = String(form.id || "").trim();
      if (!isEditing && !idToUse) {
        const { id } = await getNextProductId();
        idToUse = id;
      }

      const payload = {
        id: idToUse,
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

      setEditingRow(null);
      setForm(initForm);
      await refresh();
      await assignNewId();
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

  // ===== View: กรองตาม category (หรือ All) และคำค้นหา =====
  const viewItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let list = sortCategory === "All"
      ? items
      : items.filter((it) => it.category === sortCategory);

    if (q) {
      list = list.filter((it) => {
        const fields = [
          String(it.id ?? ""),
          String(it.name ?? ""),
          String(it.category ?? ""),
        ].map((s) => s.toLowerCase());
        return fields.some((f) => f.includes(q));
      });
    }
    return list;
  }, [items, sortCategory, searchText]);

  // ===== styles =====
  const card = "bg-white rounded-2xl shadow-sm border border-gray-200/60";
  const input =
    "w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm placeholder:text-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent";
  const actionBtn =
    "inline-flex items-center gap-2 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition";
  const primaryBtn =
    "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 text-sm shadow " +
    "hover:opacity-95 disabled:opacity-50";

  const sortMenuWrap = "relative";
  const sortMenuBtn = actionBtn + " relative";
  const sortMenuPane =
    "absolute right-0 mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-10";
  const sortMenuItem = (active: boolean) =>
    `w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
      active ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
    }`;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
        </div>

        <div className="flex gap-2 items-center">
          {/* 🔎 Search (อยู่หน้า Connected) */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className={input + " pl-9 w-64"}
              placeholder="Search products…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {!connected && (
            <button className={actionBtn} onClick={connectSheets} disabled={connected}>
              <FiCloud className="text-indigo-500" />
              Connect Google Sheets
            </button>
          )}
          {connected && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <FiCloud /> Connected
            </span>
          )}

          {/* ✅ Sort by (All/Mens/Womens/Objects) */}
          <div
            className={sortMenuWrap}
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setShowSortMenu(false);
              }
            }}
          >
            <button
              className={sortMenuBtn}
              onClick={() => setShowSortMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={showSortMenu}
              title="Filter by category"
            >
              <FiArrowDown className="text-gray-600" />
              Sort by: {sortCategory}
            </button>

            {showSortMenu && (
              <div className={sortMenuPane} role="menu">
                {(["All", ...CATEGORIES] as SortCategory[]).map((c) => (
                  <button
                    key={c}
                    className={sortMenuItem(sortCategory === c)}
                    onClick={() => {
                      setSortCategory(c);
                      setShowSortMenu(false);
                    }}
                    role="menuitem"
                  >
                    <span className="inline-block w-4 text-center">
                      {sortCategory === c ? "✓" : ""}
                    </span>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={actionBtn} onClick={refresh} disabled={!connected || loading}>
            <FiRefreshCw className="text-gray-600" />
            Refresh
          </button>
        </div>
      </div>

      {/* form */}
      <div className={card}>
        <div className="p-5">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {/* Product ID */}
            <div className="flex gap-2">
              <input
                className={input + " flex-1"}
                placeholder="Product ID (auto)"
                value={form.id}
                readOnly
                title="ระบบจะกำหนดเลขให้อัตโนมัติ"
              />
              <button
                type="button"
                className={actionBtn}
                onClick={assignNewId}
                title="ใช้เลขถัดไป"
                disabled={!connected || loading}
              >
                <FiRefreshCw /> New
              </button>
            </div>

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

            <select
              className={input}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            >
              <option value="" disabled>Category</option>
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>

            <input
              type="number"
              className={input}
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              min="0"
              step="1"
            />

            <input
              type="number"
              className={input}
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              inputMode="numeric"
              min="0"
              step="1"
            />

            <textarea
              className={input + " md:col-span-7 resize-y"}
              placeholder="Description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="md:col-span-7 flex gap-2 pt-1">
              <button className={primaryBtn} type="submit" disabled={!connected || loading}>
                {isEditing ? (<><FiEdit /> Update</>) : (<><FiPlus /> Add</>)}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className={actionBtn}
                  onClick={async () => {
                    setEditingRow(null);
                    setForm(initForm);
                    await assignNewId();
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* table */}
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
                {viewItems.length === 0 ? (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={8}>ไม่มีข้อมูล</td>
                  </tr>
                ) : (
                  viewItems.map((it, idx) => (
                    <tr
                      key={it.rowNumber ?? idx}
                      className={`border-t ${idx % 2 ? "bg-gray-50/40" : "bg-white"} hover:bg-indigo-50/40 transition`}
                    >
                      <td className="py-2 pr-4 font-mono">{it.id}</td>
                      <td className="py-2 pr-4">
                        {it.imageUrl ? (
                          <img src={it.imageUrl} alt={it.name} className="h-10 w-10 object-cover rounded-md ring-1 ring-gray-200" />
                        ) : "-"}
                      </td>
                      <td className="py-2 pr-4">{it.name}</td>
                      <td className="py-2 pr-4">{it.category}</td>
                      <td className="py-2 pr-4 max-w-[480px] truncate" title={it.description}>{it.description}</td>
                      <td className="py-2 pr-4">{it.price}</td>
                      <td className="py-2 pr-4">{it.quantity}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button className={actionBtn} onClick={() => onEdit(it.rowNumber!, it)}>
                            <FiEdit /> Edit
                          </button>
                          <button className={actionBtn + " text-red-600 hover:bg-red-50"} onClick={() => onDelete(it.rowNumber!)}>
                            <FiTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 text-xs text-gray-500">
            Showing: <span className="font-medium">{sortCategory}</span>
            {searchText.trim() ? (
              <> · Search: <span className="font-medium">“{searchText}”</span></>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
