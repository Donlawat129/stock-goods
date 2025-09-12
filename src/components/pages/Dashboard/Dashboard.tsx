// src/components/dashboard/Dashboard.tsx

import { useEffect, useMemo, useState } from "react";
import { FiPieChart } from "react-icons/fi";

// เชื่อม Google Sheets
import {
  requestSheetsToken,
  getProducts,
} from "../../../lib/sheetsClient";

// ---------- Types ----------
type ShowcaseProduct = {
  name: string;
  popularity: number;
  sales: string;
  color: string;
};

// ---------- Mini Charts (SVG ไม่มี lib) ----------
type MiniLineChartProps = { data: number[]; height?: number };
function MiniLineChart({ data, height = 80 }: MiniLineChartProps) {
  const width = 240;
  const padding = 10;
  const h = height;
  const w = width;
  const max = 100;
  const min = 0;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - padding * 2) + padding;
    const y =
      h - padding - ((v - min) / (max - min)) * (h - padding * 2);
    return `${x},${y}`;
  });

  const area = `M ${padding},${h - padding} L ${pts.join(" ")} L ${w - padding},${h - padding} Z`;


  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopOpacity="0.35" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
        points={pts.join(" ")}
      />
    </svg>
  );
}

type BarChartProps = { data: number[]; labels?: string[]; height?: number };
function BarChart({ data, labels = [], height = 50 }: BarChartProps) {
  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((v, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div
              className="w-4 sm:w-6 bg-purple-500 rounded-t"
              style={{ height: `${Math.max(5, Math.min(100, v))}%` }}
            />
          </div>
        ))}
      </div>
      {labels.length > 0 && (
        <div className="mt-2 grid grid-cols-4 text-xs text-gray-500">
          {labels.map((l, i) => (
            <div key={i} className="text-center">
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type DonutChartProps = { percent: number; size?: number; label?: string };
function DonutChart({ percent, size = 120, label = "Completed" }: DonutChartProps) {
  const p = Math.max(0, Math.min(100, percent));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = Math.PI * 2 * r;
  const dash = (p / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-green-500"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-semibold text-gray-800">{p}%</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

// ---------- Component ----------
export default function DashboardContent() {
  // Top products
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);

  // ข้อมูลปลอมสำหรับกราฟ
  const lineData = useMemo(() => [18, 24, 35, 28, 40, 55, 52, 68, 63, 75, 70, 82], []);
  const barData  = useMemo(() => [72, 55, 88, 60], []);
  const barLbls  = useMemo(() => ["Q1", "Q2", "Q3", "Q4"], []);
  const donutPct = 68;

  useEffect(() => {
    (async () => {
      try {
        await requestSheetsToken("consent");

        // ===== Products =====
        try {
          const prods = await getProducts();
          // เลือก 4 ตัวแรกทำ Top Products
          const top = prods.items.slice(0, 4).map((p, i) => ({
            name: p.name || `Product ${i + 1}`,
            popularity: Math.max(
              10,
              Math.min(95, p.price ? Math.round(Number(p.price)) : 70 - i * 10)
            ),
            sales: `${Math.min(45 - i * 5, 45)}%`,
            color: ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-amber-500"][i]!,
          }));
          setProducts(top);
        } catch {
          setProducts([]);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* แถวกราฟสรุป (ปลอม) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* เส้นแนวโน้ม */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="mb-2 font-semibold text-gray-800">แนวโน้มรายเดือน</h3>
          <p className="text-xs text-gray-500 mb-2">ม.ค. → ธ.ค.</p>
          <MiniLineChart data={lineData} />
          <div className="mt-2 text-sm text-gray-600">การเติบโตเฉลี่ย +12%</div>
        </div>

        {/* แท่งไตรมาส */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="mb-2 font-semibold text-gray-800">ยอดขายรายไตรมาส</h3>
          <BarChart data={barData} labels={barLbls} />
          <div className="mt-2 text-sm text-gray-600">ประสิทธิภาพสูงสุดในไตรมาสที่ 1</div>
        </div>

        {/* โดนัทสัดส่วน */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="mb-2 font-semibold text-gray-800">การบรรลุเป้าหมาย</h3>
            <p className="text-sm text-gray-600">เป้าหมาย: 75k | จริง: 51k</p>
            <div className="mt-3 text-xs text-gray-500">อัปเดตเมื่อสักครู่นี้</div>
          </div>
          <DonutChart percent={donutPct} label="of target" />
        </div>
      </div>

      {/* Top Products */}
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="mb-4 font-semibold text-gray-800 flex items-center">
          <FiPieChart className="mr-2 text-blue-500" /> Top Products
        </h3>
        <ul className="space-y-4">
          {products.map((product, index) => (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-3 h-3 ${product.color} rounded-full`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{product.name}</p>
                  <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 ${product.color} rounded-full`}
                      style={{ width: `${product.popularity}%` }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">{product.sales}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
