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
  getHeroBanners,
  addHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  getHeroIntervalMs,
  setHeroIntervalMs,
  ensureToken,     // 👈 เพิ่ม
  getAuthInfo,     // 👈 เพิ่ม (ใช้ตั้งเวลาต่ออัตโนมัติ)
  type BannerRow,
} from "../../../lib/sheetsClient";

// ===== ฟอร์มใช้ตามสคีม่าใหม่ในชีต =====
// (Title, Subtitle, Desc, Image, Color, ButtonColor) และเก็บ autoplay ที่ H2
type BannerForm = {
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  color: string;
  buttonColor: string;
};

const emptyForm: BannerForm = {
  title: "",
  subtitle: "",
  desc: "",
  image: "",
  color: "",
  buttonColor: "",
};

const LS_AUTOPLAY = "hero_autoplay_ms";

/* ---------- Small UI helpers ---------- */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={
      "bg-white rounded-2xl shadow-sm border border-gray-200/60 " + className
    }
  >
    {children}
  </div>
);

const PillButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  }
> = ({ children, className = "", variant = "ghost", ...rest }) => {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition shadow-sm";
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
    title: f.title.trim(),
    subtitle: f.subtitle.trim(),
    desc: f.desc.trim(),
    image: f.image.trim(),
    color: f.color.trim(),
    buttonColor: f.buttonColor.trim(),
  };
}

export default function HeroBanner() {
  // Sheets
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data
  const [items, setItems] = useState<BannerRow[]>([]);
  const [intervalMs, setIntervalMs] = useState<number>(10000);

  // Unified Form (ใช้ทั้ง Add และ Edit)
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingRowNumber, setEditingRowNumber] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<string>("");

  // ดีบาวน์เซฟอัตโนมัติ
  const saveTimer = useRef<number | null>(null);

  /* initial */
  useEffect(() => {
    const v = Number(localStorage.getItem(LS_AUTOPLAY) || "10000");
    if (!Number.isNaN(v)) setIntervalMs(v);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  // 👇 Auto-connect แบบ silent เมื่อเปิดหน้า
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureToken(); // พยายามขอ token แบบ "none"
        if (!mounted) return;
        setConnected(true);
        await doRefresh();
      } catch {
        // เงียบไว้ → ให้ผู้ใช้กดปุ่ม Connect เองได้ตามปกติ
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 👇 (ทางเลือก) ตั้งเวลาขอ token ใหม่ก่อนหมดอายุอัตโนมัติ
  useEffect(() => {
    if (!connected) return;
    let timer: number | null = null;

    function schedule() {
      const { expAt } = getAuthInfo();
      const lead = 60 * 1000; // ขอใหม่ก่อนหมด 60s
      const fallback = 45 * 60 * 1000; // ถ้ายังไม่ทราบ exp ให้รอ ~45 นาที
      const wait = expAt ? Math.max(0, expAt - Date.now() - lead) : fallback;

      timer = window.setTimeout(async () => {
        try {
          await requestSheetsToken("none");
        } catch {
          // ถ้าเงียบไม่เป็นไร fetchWithAuth จะ popup ให้เมื่อจำเป็น
        }
        schedule(); // ตั้งรอบถัดไป
      }, wait);
    }

    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [connected]);

  async function persistAutoplay(ms: number) {
    try {
      if (connected) await setHeroIntervalMs(ms); // เขียนที่ H2
      localStorage.setItem(LS_AUTOPLAY, String(ms));
      setToast("Saved autoplay");
    } catch (e) {
      console.error(e);
      setToast("Save failed");
    } finally {
      setTimeout(() => setToast(""), 1200);
    }
  }

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistAutoplay(intervalMs);
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [intervalMs]);

 

  const doRefresh = async () => {
    setLoading(true);
    try {
      const [{ items }, ms] = await Promise.all([
        getHeroBanners(),
        getHeroIntervalMs(),
      ]);
      setItems(items);
      setIntervalMs(ms);
      localStorage.setItem(LS_AUTOPLAY, String(ms));
    } catch (e: any) {
      alert(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!connected) return;
    await doRefresh();
  };

  // ---- Submit ฟอร์มบน (ทำหน้าที่ทั้ง Add / Save) ----
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!connected) return alert("กรุณา Connect Google Sheets ก่อน");
    if (!form.title.trim()) return alert("กรอก Title");

    try {
      if (mode === "add") {
        await addHeroBanner(toPayload(form) as any);
        setForm(emptyForm);
        setToast("Added");
      } else {
        if (!editingRowNumber) return;
        await updateHeroBanner(editingRowNumber, toPayload(form) as any);
        setMode("add");
        setEditingRowNumber(null);
        setForm(emptyForm);
        setToast("Updated");
      }
      await refresh();
    } catch (e: any) {
      alert(e?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setTimeout(() => setToast(""), 1000);
    }
  }

  function cancelEdit() {
    setMode("add");
    setEditingRowNumber(null);
    setForm(emptyForm);
  }

  function startEditTop(b: BannerRow) {
    setMode("edit");
    setEditingRowNumber(b.rowNumber);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      desc: b.desc,
      image: b.image,
      color: b.color,
      buttonColor: b.buttonColor,
    });
    // เลื่อนขึ้นไปที่ฟอร์มเพื่อแก้ไขสะดวก
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(rowNumber: number) {
    if (!connected) return alert("กรุณา Connect Google Sheets ก่อน");
    if (!confirm("ลบแบนเนอร์นี้ใช่ไหม?")) return;
    try {
      await deleteHeroBanner(rowNumber);
      // ถ้ากำลังแก้ไขแถวที่ถูกลบ ให้ยกเลิกโหมดแก้
      if (mode === "edit" && editingRowNumber === rowNumber) cancelEdit();
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
          {connected && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <FiCloud /> Connected
            </span>
          )}
          <PillButton onClick={refresh} disabled={!connected || loading}>
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
              onChange={(e) =>
                setIntervalMs(Math.max(0, Number(e.target.value) || 0))
              }
              disabled={!connected}
            />
            <PillButton
              variant="primary"
              onClick={() => persistAutoplay(intervalMs)}
              disabled={!connected}
            >
              <FiSave /> บันทึก
            </PillButton>
          </label>

          <div className="text-gray-500">
            จำนวนแบนเนอร์: <span className="font-semibold">{items.length}</span>
          </div>
        </div>
      </Card>

      {/* Unified Form: ใช้ Add/ Edit */}
      <Card>
        <form
          onSubmit={submitForm}
          className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          {/* Image */}
          <div className="md:col-span-4">
            <label className="block text-xs text-gray-500 mb-1">Image (URL)</label>
            <input
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              placeholder="https://..."
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              disabled={!connected}
            />
            <div className="mt-2 h-12 w-12 rounded-md ring-1 ring-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
              {form.image ? (
                <img src={form.image} className="h-full w-full object-cover" />
              ) : (
                <FiImage className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Title */}
          <div className="md:col-span-4">
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={!connected}
            />
          </div>

          {/* Subtitle */}
          <div className="md:col-span-4">
            <label className="block text-xs text-gray-500 mb-1">Subtitle</label>
            <input
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              disabled={!connected}
            />
          </div>

          {/* Desc */}
          <div className="md:col-span-6">
            <label className="block text-xs text-gray-500 mb-1">Desc</label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent resize-y"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              disabled={!connected}
            />
          </div>

          {/* Color */}
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-12 rounded-md border border-gray-300/70"
                value={form.color || "#000000"}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                disabled={!connected}
              />
              <input
                className="flex-1 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
                placeholder="#RRGGBB"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                disabled={!connected}
              />
            </div>
          </div>

          {/* ButtonColor */}
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">ButtonColor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-12 rounded-md border border-gray-300/70"
                value={form.buttonColor || "#000000"}
                onChange={(e) =>
                  setForm({ ...form, buttonColor: e.target.value })
                }
                disabled={!connected}
              />
              <input
                className="flex-1 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
                placeholder="#RRGGBB"
                value={form.buttonColor}
                onChange={(e) =>
                  setForm({ ...form, buttonColor: e.target.value })
                }
                disabled={!connected}
              />
            </div>
          </div>

          <div className="md:col-span-12 flex items-center gap-2">
            <PillButton type="submit" variant="primary" disabled={!connected}>
              {mode === "add" ? (
                <>
                  <FiPlus /> Add
                </>
              ) : (
                <>
                  <FiSave /> Save changes
                </>
              )}
            </PillButton>

            {mode === "edit" && (
              <PillButton onClick={cancelEdit}>
                <FiX /> Cancel
              </PillButton>
            )}
          </div>
        </form>
      </Card>

      {/* Table (อ่านอย่างเดียว) */}
      <Card>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                {[
                  "No",
                  "Image",
                  "Title",
                  "Subtitle",
                  "Desc",
                  "Color",
                  "ButtonColor",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-2 pr-4 font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td className="py-8 text-gray-500" colSpan={8}>
                    ไม่มีข้อมูล — กด “Add” ด้านบนเพื่อเพิ่มแบนเนอร์แรก
                  </td>
                </tr>
              )}

              {items.map((b, idx) => (
                <tr
                  key={`${b.rowNumber}-${b.title}`}
                  className={`border-t ${
                    idx % 2 ? "bg-gray-50/40" : "bg-white"
                  } hover:bg-indigo-50/40 transition`}
                >
                  <td className="py-3 pr-4 align-top">{idx + 1}</td>

                  {/* Image */}
                  <td className="py-3 pr-4 align-top">
                    {b.image ? (
                      <img
                        src={b.image}
                        alt={b.title}
                        className="h-12 w-12 object-cover rounded-md ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 ring-1 ring-gray-200">
                        <FiImage />
                      </div>
                    )}
                  </td>

                  {/* Title */}
                  <td className="py-3 pr-4 align-top font-medium text-gray-800">
                    {b.title}
                  </td>

                  {/* Subtitle */}
                  <td className="py-3 pr-4 align-top">{b.subtitle}</td>

                  {/* Desc */}
                  <td className="py-3 pr-4 align-top max-w-[520px]">
                    <div className="line-clamp-3" title={b.desc}>
                      {b.desc}
                    </div>
                  </td>

                  {/* Color */}
                  <td className="py-3 pr-4 align-top">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-6 rounded ring-1 ring-gray-300 inline-block"
                        style={{ backgroundColor: b.color || "transparent" }}
                      />
                      <span>{b.color || "-"}</span>
                    </div>
                  </td>

                  {/* ButtonColor */}
                  <td className="py-3 pr-4 align-top">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-6 rounded ring-1 ring-gray-300 inline-block"
                        style={{
                          backgroundColor: b.buttonColor || "transparent",
                        }}
                      />
                      <span>{b.buttonColor || "-"}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 pr-4 align-top">
                    <div className="flex gap-2">
                      <PillButton
                        onClick={() => startEditTop(b)}
                        disabled={!connected}
                      >
                        <FiEdit2 /> Edit
                      </PillButton>
                      <PillButton
                        variant="danger"
                        onClick={() => remove(b.rowNumber)}
                        disabled={!connected}
                      >
                        <FiTrash2 /> Delete
                      </PillButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="px-4 py-2 rounded-xl bg-black/80 text-white text-sm shadow">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
