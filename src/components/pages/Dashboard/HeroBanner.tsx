// src/components/pages/HeroBanner.tsx
import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSave,
  FiEdit2,
  FiTrash2,
  FiImage,
  FiX,
  FiClock,
} from "react-icons/fi";

type Banner = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonType: ButtonType | ""; // ← เดิมเป็น string
};

type ButtonType = "Mens" | "Womens" | "Objects";


const LS_KEY = "hero_banners";
const LS_AUTOPLAY = "hero_autoplay_ms";

const emptyBanner: Banner = {
  id: "",
  imageUrl: "",
  title: "",
  subtitle: "",
  buttonText: "",
  buttonType: "", // ค่าว่างก่อนเลือก
};

export default function HeroBanner() {
  // ===== state =====
  const [banners, setBanners] = useState<Banner[]>([]);
  const [autoMs, setAutoMs] = useState<number>(5000);

  // modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Banner>(emptyBanner);

  const isEditing = useMemo(() => !!editingId, [editingId]);

  // ===== load / save (localStorage) =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setBanners(JSON.parse(raw));
    } catch {}
    try {
      const ms = Number(localStorage.getItem(LS_AUTOPLAY) || "5000");
      if (!Number.isNaN(ms)) setAutoMs(ms);
    } catch {}
  }, []);

  const saveAll = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(banners));
    localStorage.setItem(LS_AUTOPLAY, String(autoMs));
    alert("บันทึกเรียบร้อย");
  };

  // ===== CRUD =====
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyBanner);
    setOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm(b);
    setOpen(true);
  };

  const remove = (id: string) => {
    if (!confirm("ลบแบนเนอร์นี้ใช่ไหม?")) return;
    setBanners((prev) => prev.filter((x) => x.id !== id));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("กรอก Title");
    if (!form.subtitle.trim()) return alert("กรอก Subtitle");
    if (!form.buttonText.trim()) return alert("กรอก Button Text");

    if (isEditing) {
      setBanners((prev) => prev.map((x) => (x.id === editingId ? { ...form } : x)));
    } else {
      const id = `bn_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
      setBanners((prev) => [...prev, { ...form, id }]);
    }
    setOpen(false);
    setEditingId(null);
    setForm(emptyBanner);
  };

  // ===== small components =====
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
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }
  > = ({ children, className = "", variant = "ghost", ...rest }) => {
    const base =
      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition shadow-sm";
    const styles =
      variant === "primary"
        ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-95"
        : "bg-white border border-gray-300/70 text-gray-700 hover:bg-gray-50";
    return (
      <button className={`${base} ${styles} ${className}`} {...rest}>
        {children}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Banner Hero</h1>
          <p className="text-gray-500">
            Manage home page (stored in localStorage)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PillButton variant="ghost" onClick={openCreate}>
            <FiPlus /> Add New Banner
          </PillButton>
          <PillButton variant="primary" onClick={saveAll}>
            <FiSave /> บันทึก Banner
          </PillButton>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <label className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-gray-700">
              <FiClock /> เล่นอัตโนมัติ (ms)
            </span>
            <input
              type="number"
              min={1000}
              step={500}
              className="w-40 rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
              value={autoMs}
              onChange={(e) => setAutoMs(Number(e.target.value))}
            />
          </label>

          <div className="text-gray-500">
            จำนวนแบนเนอร์: <span className="font-semibold">{banners.length}</span>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                {["No", "Image", "Title", "Subtitle", "Button Text", "Type Of Button", "Actions"].map(
                  (h) => (
                    <th key={h} className="py-2 pr-4 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 && (
                <tr>
                  <td className="py-8 text-gray-500" colSpan={7}>
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
              {banners.map((b, idx) => (
                <tr
                  key={b.id}
                  className={`border-t ${idx % 2 ? "bg-gray-50/40" : "bg-white"} hover:bg-indigo-50/40 transition`}
                >
                  <td className="py-3 pr-4 align-top">{idx + 1}</td>
                  <td className="py-3 pr-4 align-top">
                    {b.imageUrl ? (
                      <img
                        src={b.imageUrl}
                        alt={b.title}
                        className="h-12 w-12 object-cover rounded-md ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 ring-1 ring-gray-200">
                        <FiImage />
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top font-medium text-gray-800 whitespace-pre-wrap">
                    {b.title}
                  </td>
                  <td className="py-3 pr-4 align-top text-gray-700 max-w-[720px]">
                    <div className="line-clamp-4" title={b.subtitle}>
                      {b.subtitle}
                    </div>
                  </td>
                  <td className="py-3 pr-4 align-top">{b.buttonText || "-"}</td>
                  <td className="py-3 pr-4 align-top">{b.buttonType || "-"}</td>
                  <td className="py-3 pr-4 align-top">
                    <div className="flex gap-2">
                      <PillButton onClick={() => openEdit(b)}>
                        <FiEdit2 /> Edit
                      </PillButton>
                      <PillButton
                        onClick={() => remove(b.id)}
                        className="text-red-600 hover:bg-red-50"
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

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            {/* ✅ ขยายความกว้าง modal */}
            <div className="relative w-full max-w-5xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60">
                <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                        {isEditing ? "Edit Banner" : "Add New Banner"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                        ใส่ข้อมูลให้ครบ จากนั้นกด {isEditing ? "Update" : "Add"}
                    </p>
                    </div>
                    <button
                    className="p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                    aria-label="close"
                    >
                    <FiX />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    {/* ✅ ขยายเลย์เอาต์และสัดส่วนคอลัมน์ให้เห็นทุกช่องครบ */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Image URL */}
                    <div className="md:col-span-5">
                        <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                        <input
                        className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
                        placeholder="https://..."
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        />
                    </div>

                    {/* Title */}
                    <div className="md:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">Title</label>
                        <input
                        className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    {/* Button Text */}
                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Button Text</label>
                        <input
                        className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
                        value={form.buttonText}
                        onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                        />
                    </div>

                    {/* Type (Dropdown) */}
                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Type</label>
                        <select
                        className="w-full min-w-[160px] rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent"
                        value={form.buttonType}
                        onChange={(e) =>
                            setForm({ ...form, buttonType: e.target.value as "Mens" | "Womens" | "Objects" })
                        }
                        >
                        <option value="" disabled>เลือกหมวด</option>
                        <option value="Mens">Mens</option>
                        <option value="Womens">Womens</option>
                        <option value="Objects">Objects</option>
                        </select>
                    </div>

                    {/* Subtitle — ขยายความสูงให้พิมพ์สบาย */}
                    <div className="md:col-span-12">
                        <label className="block text-xs text-gray-500 mb-1">Subtitle</label>
                        <textarea
                        rows={7}
                        className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-transparent resize-y"
                        value={form.subtitle}
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                        />
                    </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                    <button
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 text-sm shadow hover:opacity-95"
                        type="submit"
                    >
                        {isEditing ? "Update" : "Add"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300/70 bg-white px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    </div>
                </form>
                </div>
            </div>
            </div>
        </div>
        )}

    </div>
  );
}
