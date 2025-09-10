// src/pages/Dashboard/HeroBanner.tsx
import { useEffect, useRef, useState } from "react";
import {
  FiPlus,
  FiSave,
  FiEdit2,
  FiTrash2,
  FiImage,
  FiClock,
  FiCloud,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import {
  requestSheetsToken,
  ensureToken,            // <-- เพิ่ม
  getHeroBanners,
  addHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  getHeroIntervalMs,
  setHeroIntervalMs,
  type BannerRow,
} from "../../../lib/sheetsClient";

type ButtonType = "Mens" | "Womens" | "Objects";
const BTN_TYPES: ButtonType[] = ["Mens", "Womens", "Objects"];

type BannerForm = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonType: ButtonType | "";
};

const emptyForm: BannerForm = {
  id: "",
  imageUrl: "",
  title: "",
  subtitle: "",
  buttonText: "",
  buttonType: "",
};

const LS_AUTOPLAY = "hero_autoplay_ms";

/* ---------- Small UI helpers ---------- */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={"bg-white rounded-2xl shadow-sm border border-gray-200/60 " + className}>
    {children}
  </div>
);

const PillButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }
> = ({ children, className = "", variant = "ghost", ...rest }) => {
  const base = "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition shadow-sm";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-95"
      : variant === "danger"
      ? "bg-white border border-red-300/80 text-red-600 hover:bg-red-50"
      : "bg-white border border-gray-300/70 text-gray-700 hover:bg-gray-50";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
};

function toPayload(f: BannerForm) {
  return {
    id: (f.id || `bn_${Date.now()}_${Math.floor(Math.random() * 9999)}`).trim(),
    imageUrl: f.imageUrl.trim(),
    title: f.title.trim(),
    subtitle: f.subtitle.trim(),
    buttonText: f.buttonText.trim(),
    buttonType: (f.buttonType || "").toString(),
  };
}

export default function HeroBanner() {
  // Sheets
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data
  const [items, setItems] = useState<BannerRow[]>([]);
  const [intervalMs, setIntervalMs] = useState<number>(5000);

  // Quick Add
  const [quick, setQuick] = useState<BannerForm>(emptyForm);
  const quickImageRef = useRef<HTMLInputElement>(null);

  // Inline edit
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BannerForm>(emptyForm);

  // Toast
  const [toast, setToast] = useState<string>("");

  // ดีบาวน์ตัวจับเวลาเซฟอัตโนมัติ
  const saveTimer = useRef<number | null>(null);

  /* --------- initial: โหลดค่า autoplay จาก localStorage ---------- */
  useEffect(() => {
    const v = Number(localStorage.getItem(LS_AUTOPLAY) || "5000");
    if (!Number.isNaN(v)) setIntervalMs(v);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  /* --------- AUTO-CONNECT (silent) เมื่อหน้าโหลด ---------- */
  useEffect(() => {
    (async () => {
      try {
        await ensureToken();     // ถ้าเคยอนุญาตไว้จะผ่านแบบเงียบ
        setConnected(true);
        await refresh(true);     // force โหลดครั้งแรกเลย
      } catch {
        // เงียบไว้ → ผู้ใช้ใหม่ยังต้องกด Connect ครั้งแรก
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------- persist autoplay (Sheets ถ้า connected + localStorage เสมอ) ---------- */
  async function persistAutoplay(ms: number) {
    try {
      if (connected) await setHeroIntervalMs(ms);
      localStorage.setItem(LS_AUTOPLAY, String(ms));
      setToast("Saved autoplay");
    } catch (e) {
      console.error(e);
      setToast("Save failed");
    } finally {
      setTimeout(() => setToast(""), 1200);
    }
  }

  /* --------- AUTO-SAVE: เซฟอัตโนมัติทุกครั้งที่ intervalMs เปลี่ยน (หน่วง 300ms) ---------- */
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistAutoplay(intervalMs);
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [intervalMs]);

  /* --------- Sheets actions ---------- */
  const connectSheets = async () => {
    try {
      await requestSheetsToken();
      setConnected(true);
      await refresh(true);
    } catch (e: any) {
      alert(e?.message || "เชื่อม Google Sheets ไม่สำเร็จ");
    }
  };

  // เพิ่ม force เพื่อใช้หลัง setConnected(true) ในเฟรมเดียวกัน
  const refresh = async (force = false) => {
    if (!connected && !force) return;
    setLoading(true);
    try {
      const [{ items }, ms] = await Promise.all([getHeroBanners(), getHeroIntervalMs()]);
      setItems(items);
      setIntervalMs(ms);
      localStorage.setItem(LS_AUTOPLAY, String(ms));
    } catch (e: any) {
      alert(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  async function addQuick(e: React.FormEvent) {
    e.preventDefault();
    if (!connected) return alert("กรุณา Connect Google Sheets ก่อน");
    if (!quick.title.trim()) return alert("กรอก Title");
    if (!quick.buttonText.trim()) return alert("กรอก Button Text");

    try {
      await addHeroBanner(toPayload(quick));
      setQuick(emptyForm);
      await refresh();
      setToast("Added");
      setTimeout(() => setToast(""), 900);
    } catch (e: any) {
      alert(e?.message || "เพิ่มไม่สำเร็จ");
    }
  }

  /* --------- Inline Edit ---------- */
  function startEdit(b: BannerRow) {
    setEditingRow(b.rowNumber);
    setEditForm({
      id: b.id,
      imageUrl: b.imageUrl,
      title: b.title,
      subtitle: b.subtitle,
      buttonText: b.buttonText,
      buttonType: (BTN_TYPES as readonly string[]).includes(b.buttonType)
        ? (b.buttonType as ButtonType)
        : "",
    });
  }

  async function saveEdit(rowNumber: number) {
    if (!connected) return alert("กรุณา Connect Google Sheets ก่อน");
    if (!editForm.title.trim()) return alert("กรอก Title");
    if (!editForm.buttonText.trim()) return alert("กรอก Button Text");
    try {
      await updateHeroBanner(rowNumber, toPayload(editForm));
      setEditingRow(null);
      await refresh();
      setToast("Updated");
      setTimeout(() => setToast(""), 900);
    } catch (e: any) {
      alert(e?.message || "บันทึกไม่สำเร็จ");
    }
  }

  async function remove(rowNumber: number) {
    if (!connected) return alert("กรุณา Connect Google Sheets ก่อน");
    if (!confirm("ลบแบนเนอร์นี้ใช่ไหม?")) return;
    try {
      await deleteHeroBanner(rowNumber);
      await refresh();
      setToast("Deleted");
      setTimeout(() => setToast(""), 900);
    } catch (e: any) {
      alert(e?.message || "ลบไม่สำเร็จ");
    }
  }

  /* -------------------------------- UI -------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Banner Hero</h1>
        </div>

        <div className="flex items-center gap-2">
          {!connected ? (
            <PillButton onClick={connectSheets}>
              <FiCloud /> Connect Google Sheets
            </PillButton>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              <FiCloud /> Connected
            </span>
          )}
          <PillButton onClick={() => refresh()} disabled={!connected || loading}>
            <FiRefreshCw /> Refresh
          </PillButton>
        </div>
      </div>

      {/* Controls - autoplay */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <label className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-gray-700">
              <FiClock /> เล่นอัตโนมัติ (ms)
            </span>
            <input
              type="number"
              min={0}
              step={1}
              className="w-32 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              value={intervalMs}
              onChange={(e) => setIntervalMs(Math.max(0, Number(e.target.value) || 0))}
              disabled={!connected}
            />
            <PillButton variant="primary" onClick={() => persistAutoplay(intervalMs)} disabled={!connected}>
              <FiSave /> บันทึก
            </PillButton>
          </label>

          <div className="flex items-center gap-2">
            <div className="text-gray-500">
              จำนวนแบนเนอร์: <span className="font-semibold">{items.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Add */}
      <Card>
        <form onSubmit={addQuick} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="block text-xs text-gray-500 mb-1">Image URL</label>
            <input
              ref={quickImageRef}
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              placeholder="https://..."
              value={quick.imageUrl}
              onChange={(e) => setQuick({ ...quick, imageUrl: e.target.value })}
              disabled={!connected}
            />
            <div className="mt-2 h-12 w-12 rounded-md ring-1 ring-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
              {quick.imageUrl ? (
                <img src={quick.imageUrl} className="h-full w-full object-cover" />
              ) : (
                <FiImage className="text-gray-400" />
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              value={quick.title}
              onChange={(e) => setQuick({ ...quick, title: e.target.value })}
              disabled={!connected}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Button Text</label>
            <input
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              value={quick.buttonText}
              onChange={(e) => setQuick({ ...quick, buttonText: e.target.value })}
              disabled={!connected}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              value={quick.buttonType}
              onChange={(e) => setQuick({ ...quick, buttonType: e.target.value as ButtonType })}
              disabled={!connected}
            >
              <option value="" disabled>เลือกหมวด</option>
              {BTN_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-12">
            <label className="block text-xs text-gray-500 mb-1">Subtitle</label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent resize-y"
              value={quick.subtitle}
              onChange={(e) => setQuick({ ...quick, subtitle: e.target.value })}
              disabled={!connected}
            />
          </div>

          <div className="md:col-span-12">
            <PillButton type="submit" variant="primary" disabled={!connected}>
              <FiPlus /> Add
            </PillButton>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                {["No", "Image", "Title", "Subtitle", "Button Text", "Type Of Button", "Actions"].map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td className="py-8 text-gray-500" colSpan={7}>
                    ไม่มีข้อมูล — กด “Add” ด้านบนเพื่อเพิ่มแบนเนอร์แรก
                  </td>
                </tr>
              )}

              {items.map((b, idx) => {
                const editing = editingRow === b.rowNumber;
                return (
                  <tr
                    key={`${b.rowNumber}-${b.id}`}
                    className={`border-t ${idx % 2 ? "bg-gray-50/40" : "bg-white"} hover:bg-indigo-50/40 transition`}
                  >
                    <td className="py-3 pr-4 align-top">{idx + 1}</td>
                    <td className="py-3 pr-4 align-top">
                      {editing ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="w-56 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm"
                            value={editForm.imageUrl}
                            onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                          />
                          <div className="h-10 w-10 rounded-md ring-1 ring-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                            {editForm.imageUrl ? (
                              <img src={editForm.imageUrl} className="h-full w-full object-cover" />
                            ) : (
                              <FiImage className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      ) : b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.title} className="h-12 w-12 object-cover rounded-md ring-1 ring-gray-200" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 ring-1 ring-gray-200">
                          <FiImage />
                        </div>
                      )}
                    </td>

                    <td className="py-3 pr-4 align-top font-medium text-gray-800 whitespace-pre-wrap">
                      {editing ? (
                        <input
                          className="w-56 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      ) : (
                        b.title
                      )}
                    </td>

                    <td className="py-3 pr-4 align-top text-gray-700 max-w-[520px]">
                      {editing ? (
                        <textarea
                          rows={3}
                          className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm"
                          value={editForm.subtitle}
                          onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                        />
                      ) : (
                        <div className="line-clamp-3" title={b.subtitle}>
                          {b.subtitle}
                        </div>
                      )}
                    </td>

                    <td className="py-3 pr-4 align-top">
                      {editing ? (
                        <input
                          className="w-40 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm"
                          value={editForm.buttonText}
                          onChange={(e) => setEditForm({ ...editForm, buttonText: e.target.value })}
                        />
                      ) : (
                        b.buttonText || "-"
                      )}
                    </td>

                    <td className="py-3 pr-4 align-top">
                      {editing ? (
                        <select
                          className="w-44 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm"
                          value={editForm.buttonType}
                          onChange={(e) => setEditForm({ ...editForm, buttonType: e.target.value as ButtonType })}
                        >
                          <option value="" disabled>เลือกหมวด</option>
                          {BTN_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        b.buttonType || "-"
                      )}
                    </td>

                    <td className="py-3 pr-4 align-top">
                      {editing ? (
                        <div className="flex gap-2">
                          <PillButton variant="primary" onClick={() => saveEdit(b.rowNumber)} disabled={!connected}>
                            <FiSave /> Save
                          </PillButton>
                          <PillButton onClick={() => setEditingRow(null)}>
                            <FiX /> Cancel
                          </PillButton>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <PillButton onClick={() => startEdit(b)} disabled={!connected}>
                            <FiEdit2 /> Edit
                          </PillButton>
                          <PillButton variant="danger" onClick={() => remove(b.rowNumber)} disabled={!connected}>
                            <FiTrash2 /> Delete
                          </PillButton>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="px-4 py-2 rounded-xl bg-black/80 text-white text-sm shadow">{toast}</div>
        </div>
      )}
    </div>
  );
}
