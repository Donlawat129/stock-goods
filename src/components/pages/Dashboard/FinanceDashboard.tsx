// src/components/pages/Dashboard/FinanceDashboard.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { FiSearch, FiX, FiRefreshCw, FiCloud } from "react-icons/fi";
import {
  getProducts,
  getLedger,
  addLedger,
  updateLedgerRow,
  deleteLedgerRow,
  type ProductItem,
  type LedgerRow,
} from "../../../lib/sheetsClient";

function today() { return new Date().toISOString().slice(0, 10); }
function baht(n: number) { return Number(n || 0).toLocaleString("th-TH"); }
function toInt(x: any) { const n = Number(String(x ?? "").toString().replace(/[, ]+/g,"")); return isNaN(n) ? 0 : n; }

// normalize YYYY-MM-DD
function toYMD(v: string): string {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function showDate(v: string, mode: "ymd" | "dmy" = "ymd"): string {
  const ymd = toYMD(v);
  if (!ymd || mode === "ymd") return ymd;
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

// ✅ helper เงิน “มีเครื่องหมาย”
const sign = (type?: string) => (type === "รายรับ" ? 1 : -1);
const fmtSigned = (n: number) => (n >= 0 ? `฿${baht(n)}` : `-฿${baht(Math.abs(n))}`);

// dropdown view modes
type ViewMode = "newest" | "oldest" | "income" | "expense" | "all";

export default function FinanceDashboard() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("all");
  const [editOpen, setEditOpen] = useState(false); // ✅ modal state

  // ---------- styles ----------
  const card = "bg-white rounded-2xl shadow-sm border border-gray-200/60";
  const inputCls =
    "w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm placeholder:text-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent";
  const actionBtn =
    "inline-flex items-center gap-2 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition";
  const primaryBtn =
    "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 text-sm shadow " +
    "hover:opacity-95 disabled:opacity-50";

  // ------- helpers -------
  function pickProductInfo(pid: string) {
    const p = products.find(x => x.id === String(pid));
    const amount = toInt(p?.price);
    const name = p?.name || "";
    return { amount, name };
  }
  function getProductQty(pid: string) {
    const p = products.find(x => String(x.id) === String(pid));
    return toInt(p?.quantity);
  }
  // ✅ จำกัดจำนวนกรอก: รายรับ(ขาย) = จำกัดตามสต็อก, รายจ่าย(ซื้อ) = ไม่จำกัด
  function calcAvailableSigned(pid: string, type: string, currentRowQty: number) {
    if (!pid) return 0;
    if (type === "รายจ่าย") return Number.POSITIVE_INFINITY; // ซื้อเข้าคลัง ไม่จำกัด
    // ขาย: จำกัดตามคงเหลือ (+ คืน q เดิมตอนแก้ไขเพื่อให้แก้ได้)
    return Math.max(0, getProductQty(pid) + Math.max(0, currentRowQty || 0));
  }

  // ---- Add form ----
  const [form, setForm] = useState({
    date: today(),
    productId: "",
    productName: "",
    type: "รายจ่าย" as "รายรับ" | "รายจ่าย",
    quantity: 1,
    amount: 0,
    total: 0,
    note: "",
  });

  const availableAdd = useMemo(
    () => calcAvailableSigned(form.productId, form.type, 0),
    [form.productId, form.type, products]
  );

  // ---- Edit form ----
  const [edit, setEdit] = useState<{
    rowNumber?: number;
    date?: string;
    productId?: string;
    productName?: string;
    type?: "รายรับ" | "รายจ่าย";
    quantity?: number;
    amount?: number;
    total?: number;
    note?: string;
  }>({});

  const availableEdit = useMemo(
    () => calcAvailableSigned(String(edit.productId || ""), String(edit.type || "รายจ่าย"), Number(edit.quantity || 0)),
    [edit.productId, edit.type, edit.quantity, products]
  );

  // โหลดข้อมูล
  async function refresh() {
    setLoading(true);
    const [plist, ledger] = await Promise.all([getProducts(), getLedger()]);
    setProducts(plist);
    setRows(ledger);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  // auto-fill (add)
  useEffect(() => {
    if (!form.productId) return;
    const { amount, name } = pickProductInfo(form.productId);
    const max = availableAdd;
    setForm(f => {
      const q = Math.min(Number(f.quantity || 0), isFinite(max) ? max : Number(f.quantity || 0));
      return { ...f, productName: name, amount, total: amount * q, quantity: q };
    });
  }, [form.productId, products, availableAdd]);

  // calc total (add)
  useEffect(() => {
    setForm(f => ({ ...f, total: Number(f.quantity || 0) * Number(f.amount || 0) }));
  }, [form.quantity, form.amount]);

  // auto-fill (edit)
  useEffect(() => {
    if (!edit.productId) return;
    const { amount, name } = pickProductInfo(String(edit.productId));
    const max = availableEdit;
    setEdit(f => {
      const qRaw = Number(f?.quantity ?? 0);
      const q = Math.min(qRaw, isFinite(max) ? max : qRaw);
      return { ...f, productName: name, amount, total: amount * q, quantity: q };
    });
  }, [edit.productId, products, availableEdit]);

  // recalc (edit)
  useEffect(() => {
    setEdit(f => ({ ...f, total: Number(f?.quantity ?? 0) * Number(f?.amount ?? 0) }));
  }, [edit.quantity, edit.amount]);

  // ตารางที่แสดง (จัดเรียง/กรองตาม dropdown + ค้นหา)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    let base = [...rows];

    // ⬇️ จัดเรียงตาม mode
    if (view === "oldest") {
      base.sort((a, b) => (toYMD(a.date) > toYMD(b.date) ? 1 : -1)); // เก่า → ใหม่
    } else if (view === "all") {
      base.sort((a, b) => (Number(a.no || 0) - Number(b.no || 0)));   // ดูทั้งหมด → เรียง 1,2,3,...
    } else {
      base.sort((a, b) => (toYMD(b.date) > toYMD(a.date) ? 1 : -1));  // ใหม่ → เก่า (default)
    }

    // กรองประเภท
    if (view === "income")  base = base.filter(r => sign(r.type) * (r.totalAmount || 0) > 0);
    if (view === "expense") base = base.filter(r => sign(r.type) * (r.totalAmount || 0) <= 0);

    // ค้นหา
    if (!term) return base;
    return base.filter(r =>
      [r.productId, r.productName, r.note].some(x =>
        String(x || "").toLowerCase().includes(term)
      )
    );
  }, [rows, q, view]);

  // ✅ รวมแบบมีเครื่องหมาย
  const grandTotal = useMemo(
    () => filtered.reduce((s, r) => s + sign(r.type) * (r.totalAmount || 0), 0),
    [filtered]
  );
  // ✅ รวมคงเหลือของรายการที่แสดงอยู่
  const totalStock = useMemo(
    () => filtered.reduce((s, r) => s + Number(r.stock || 0), 0),
    [filtered]
  );


  async function onAdd() {
    if (!form.date || !form.productId || !form.quantity) return;
    if (form.type === "รายรับ" && isFinite(availableAdd) && form.quantity > availableAdd) {
      alert(`จำนวนเกินคงเหลือ (คงเหลือ ${availableAdd})`);
      return;
    }

    setSaving(true);
    await (addLedger as any)({
      date: form.date,
      productId: form.productId,
      quantity: Number(form.quantity),
      type: form.type,
      note: form.note,
    });
    await refresh();
    setSaving(false);
    setForm({
      date: today(),
      productId: "",
      productName: "",
      type: "รายจ่าย",
      quantity: 1,
      amount: 0,
      total: 0,
      note: "",
    });
  }

  function openEdit(row: LedgerRow) {
    setEdit({
      rowNumber: row.rowNumber,
      date: toYMD(row.date),
      productId: row.productId,
      productName: row.productName,
      type: row.type as any,
      quantity: row.quantity,
      amount: row.amount,
      total: row.totalAmount,
      note: row.note ?? "",
    });
    setEditOpen(true);
  }

  async function onEditSave() {
    if (!edit.rowNumber) return;
    const qNum = Number(edit.quantity || 0);
    if ((edit.type ?? "รายจ่าย") === "รายรับ" && isFinite(availableEdit) && qNum > availableEdit) {
      alert(`จำนวนเกินคงเหลือ (คงเหลือ ${availableEdit})`);
      return;
    }
    await (updateLedgerRow as any)(edit.rowNumber, {
      date: String(edit.date || ""),
      productId: String(edit.productId || ""),
      quantity: qNum,
      type: edit.type,
      note: String(edit.note ?? ""),
    });
    setEditOpen(false);
    await refresh();
  }

  async function onDelete(row: LedgerRow) {
    const rn = Number(row.rowNumber ?? 0);
    if (!rn || rn < 2) {
      console.error("Delete aborted: invalid rowNumber", row);
      alert("ไม่สามารถลบได้: หมายเลขแถวไม่ถูกต้อง");
      return;
    }

    const ok = confirm(`ลบรายการวันที่ ${showDate(row.date)} / ${row.productId} - ${row.productName} ?`);
    if (!ok) return;

    try {
      const res = await deleteLedgerRow(rn);
      console.log("Delete response:", res);
      await refresh();
    } catch (e: any) {
      console.error("Delete failed", e);
      alert("ลบไม่สำเร็จ: " + (e?.message || e));
    }
  }

  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Finance Dashboard</h1>

        {/* แถบคอนโทรลฝั่งขวา: ไม่ให้ตัดบรรทัด */}
        <div className="flex items-center gap-3 flex-nowrap">
          {/* Search: ความกว้างคงที่ ไม่ดันของอื่นลงบรรทัดใหม่ */}
          <div className="relative w-[210px] flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              className={inputCls + " rounded-full pl-9 pr-8 w-full"}
              placeholder="ค้นหารายการ…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && q) {
                  setQ("");
                  requestAnimationFrame(() => searchRef.current?.focus());
                }
              }}
            />
            {q && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setQ("");
                  requestAnimationFrame(() => searchRef.current?.focus());
                }}
                aria-label="Clear"
                title="Clear"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* สถานะเชื่อมต่อ */}
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700 whitespace-nowrap flex-none">
              <FiCloud /> กำลังเชื่อมต่อ
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 whitespace-nowrap flex-none">
              <FiCloud /> เชื่อมต่อแล้ว
            </span>
          )}

          {/* ดรอปดาวน์จัดเรียง/กรอง */}
          <select
            className={inputCls + " rounded-full flex-none w-48 md:w-56"}
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            title="จัดเรียง/กรอง"
          >
            <option value="all">ดูข้อมูลทั้งหมด</option>
            <option value="newest">ล่าสุด → เก่า</option>
            <option value="oldest">เก่า → ล่าสุด</option>
            <option value="income">รายรับ</option>
            <option value="expense">รายจ่าย</option>
          </select>

          {/* รีเฟรช */}
          <button
            className={
              "inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 whitespace-nowrap flex-none" +
              (loading ? " opacity-60 cursor-not-allowed" : "")
            }
            onClick={refresh}
            disabled={loading}
          >
            <FiRefreshCw className="text-gray-600" />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className={card}>
        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <Field label="วันที่" span={2}>
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>

          <Field label="รหัสสินค้า" span={2}>
            <select
              className={inputCls}
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">-- เลือก --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.id}</option>
              ))}
            </select>
          </Field>

          {/* ชื่อสินค้า: เลือกตามชื่อ แต่ value เป็น productId */}
          <Field label="ชื่อสินค้า" span={4}>
            <select
              className={inputCls}
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">-- เลือก --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="ประเภท" span={2}>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "รายรับ" | "รายจ่าย" })}
            >
              <option value="รายรับ">รายรับ</option>
              <option value="รายจ่าย">รายจ่าย</option>
            </select>
          </Field>

          <Field label={`จำนวน (คงเหลือ ${isFinite(availableAdd) ? availableAdd : "∞"})`} span={2}>
            <input
              type="number"
              min={0}
              max={isFinite(availableAdd) ? availableAdd : undefined}
              className={inputCls + " text-right"}
              value={form.quantity}
              onChange={(e) => {
                const raw = Number(e.target.value);
                const cap = isFinite(availableAdd) ? availableAdd : raw;
                const q = Math.max(0, Math.min(raw, cap));
                setForm({ ...form, quantity: q });
              }}
            />
          </Field>

          <Field label="ราคา/หน่วย (บาท)" span={2}>
            <input className={inputCls + " text-right"} value={form.amount} readOnly />
          </Field>

          <Field label="หมายเหตุ" span={10}>
            <input
              type="text"
              className={inputCls}
              placeholder="กรอกหมายเหตุ…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>

          <div className="md:col-span-12 flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">
              เป็นเงินรวม: <span className="font-semibold text-gray-900">฿{baht(form.total)}</span>
            </div>
            <button
              onClick={onAdd}
              disabled={saving || !form.productId || !form.quantity}
              className={primaryBtn}
            >
              <FaPlus /> บันทึกรายการ
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={card}>
        <div className="p-5 overflow-x-auto">
          <table className="min-w-full text-sm table-fixed border-collapse">
            <thead>
              <tr className="text-gray-600">
                <th className="py-2 px-4 text-left">ลำดับ</th>
                <th className="py-2 px-4 text-left">วันที่</th>
                <th className="py-2 px-4 text-left">รหัสสินค้า</th>
                <th className="py-2 px-4 text-left">ชื่อสินค้า</th>
                <th className="py-2 px-4 text-right">ประเภท</th>
                <th className="py-2 px-4 text-right">จำนวน</th>
                <th className="py-2 px-4 text-right">ราคา/หน่วย</th>
                <th className="py-2 px-4 text-right">เป็นเงินรวม</th>
                <th className="py-2 px-4 text-right">สินค้าคงเหลือ</th>
                <th className="py-2 px-4 text-left">หมายเหตุ</th>
                <th className="py-2 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500">ไม่มีข้อมูล</td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const signedTotal = sign(r.type) * (r.totalAmount || 0);
                  return (
                    <tr key={r.rowNumber ?? idx} className="border-t">
                      <td className="py-2 px-4">{view === "all" ? (idx + 1) : (r.no || idx + 1)}</td>
                      <td className="py-2 px-4">{showDate(r.date, "ymd")}</td>
                      <td className="py-2 px-4">{r.productId}</td>
                      <td className="py-2 px-4">{r.productName}</td>
                      <td className="py-2 px-4 text-right">{r.type}</td>
                      <td className="py-2 px-4 text-right">{r.quantity}</td>
                      <td className="py-2 px-4 text-right">{baht(r.amount)}</td>
                      <td className={`py-2 px-4 text-right font-semibold ${signedTotal>=0?"text-green-600":"text-red-600"}`}>
                        {fmtSigned(signedTotal)}
                      </td>
                      <td className="py-2 px-4 text-right">{baht(r.stock)}</td>
                      <td className="py-2 px-4">{r.note}</td>
                      <td className="py-2 px-4">
                        <div className="flex justify-center gap-2">
                          <button className={actionBtn} onClick={() => openEdit(r)}>
                            <FaEdit /> แก้ไข
                          </button>
                          <button
                            className={actionBtn + " text-red-600 hover:bg-red-50"}
                            onClick={() => onDelete({ ...r, rowNumber: Number(r.rowNumber ?? 0) })}
                          >
                            <FaTrash /> ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
            <tr className="bg-gray-50">
              {/* ซ้าย: ข้อความสถานะ */}
              <td colSpan={7} className="py-2 px-4 text-sm text-gray-600">
                กำลังแสดง: {filtered.length} รายการ
              </td>

              {/* ใต้คอลัมน์ เป็นเงินรวม */}
              <td className="py-2 px-4 text-right font-bold">
                {fmtSigned(grandTotal)}
              </td>

              {/* ใต้คอลัมน์ สินค้าคงเหลือ */}
              <td className="py-2 px-4 text-right font-bold">
                {baht(totalStock)}
              </td>

              {/* ช่องว่างครอบ “หมายเหตุ” + “จัดการ” */}
              <td colSpan={2}></td>
            </tr>
          </tfoot>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className={card + " w-full max-w-6xl"}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">แก้ไขรายการ</h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* แถวแรก: 2/2/4/2/2 ให้เท่ากับฟอร์ม Add */}
                <Field label="วันที่" span={2}>
                  <input
                    type="date"
                    className={inputCls}
                    value={String(edit.date ?? "")}
                    onChange={(e) => setEdit({ ...edit, date: e.target.value })}
                  />
                </Field>

                <Field label="รหัสสินค้า" span={2}>
                  <select
                    className={inputCls}
                    value={String(edit.productId ?? "")}
                    onChange={(e) => setEdit({ ...edit, productId: e.target.value })}
                  >
                    <option value="">-- เลือก --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* ชื่อสินค้า (value เป็น productId) */}
                <Field label="ชื่อสินค้า" span={4}>
                  <select
                    className={inputCls}
                    value={String(edit.productId ?? "")}
                    onChange={(e) => setEdit({ ...edit, productId: e.target.value })}
                  >
                    <option value="">-- เลือก --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="ประเภท" span={2}>
                  <select
                    className={inputCls}
                    value={String(edit.type ?? "รายจ่าย")}
                    onChange={(e) =>
                      setEdit({ ...edit, type: e.target.value as "รายรับ" | "รายจ่าย" })
                    }
                  >
                    <option value="รายรับ">รายรับ</option>
                    <option value="รายจ่าย">รายจ่าย</option>
                  </select>
                </Field>

                <Field
                  label={`จำนวน (คงเหลือ ${isFinite(availableEdit) ? availableEdit : "∞"})`}
                  span={2}
                >
                  <input
                    type="number"
                    min={0}
                    max={isFinite(availableEdit) ? availableEdit : undefined}
                    className={inputCls + " text-right"}
                    value={Number(edit.quantity ?? 0)}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const cap = isFinite(availableEdit) ? availableEdit : raw;
                      const q = Math.max(0, Math.min(raw, cap));
                      setEdit({ ...edit, quantity: q });
                    }}
                  />
                </Field>

                {/* แถวสอง: ราคา/หน่วย 2 + หมายเหตุ 10 (เหมือนฝั่ง Add) */}
                <Field label="ราคา/หน่วย (บาท)" span={2}>
                  <input
                    className={inputCls + " text-right"}
                    value={Number(edit.amount ?? 0)}
                    readOnly
                  />
                </Field>

                <Field label="หมายเหตุ" span={10}>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="กรอกหมายเหตุ…"
                    value={edit.note ?? ""}
                    onChange={(e) => setEdit({ ...edit, note: e.target.value })}
                  />
                </Field>
              </div>

              {/* แถวสรุปด้านล่างเหมือน Add: แสดงเป็นเงินรวม + ปุ่ม */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  เป็นเงินรวม:{" "}
                  <span className="font-semibold text-gray-900">
                    ฿{baht(Number(edit.total ?? 0))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className={actionBtn} onClick={() => setEditOpen(false)}>
                    ยกเลิก
                  </button>
                  <button className={primaryBtn} onClick={onEditSave}>
                    บันทึกการแก้ไข
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Field helper ---------- */
function Field({
  label,
  span = 3,
  children,
}: {
  label: string;
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  children?: any;
}) {
  const map: Record<number, string> = {
    1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
    5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
    9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
  };
  return (
    <label className={`flex flex-col gap-1 ${map[span]} col-span-1`}>
      <span className="text-sm text-gray-600">{label}</span>
      {children}
    </label>
  );
}
