// src/components/dashboard/Dashboard.tsx

import { useEffect, useMemo, useState } from "react";
import { FiPieChart } from "react-icons/fi";

// ✅ เชื่อม Google Sheets ผ่าน GAS proxy (ตามไฟล์ sheetsClient.ts ใหม่)
import {
  requestSheetsToken,
  getProducts,
  getLedger,
  type ProductItem,    // เพื่อให้ TS รู้ชนิดข้อมูลที่ได้กลับมา
  type LedgerRow,
} from "../../../lib/sheetsClient";

// ---------- Types สำหรับ UI ----------
type ShowcaseProduct = {
  name: string;
  popularity: number; // 0..100
  sales: string;      // "45%" แบบสตริง
  color: string;      // tailwind color class
};


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
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
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

// ---------- Utils ----------
const toNumberSafe = (v: string | number | undefined | null, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ---------- Component ----------
export default function DashboardContent() {
  // Top products
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);

  // ✅ เก็บสินค้าจริงทั้งหมด (ใช้สรุปการ์ดแรก)
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);

  // ===== รายรับ/รายจ่ายจาก Ledger =====
  const [incomeTotal, setIncomeTotal] = useState(0);              // รวมรายรับทั้งหมด (บาท)
  const [expenseTotal, setExpenseTotal] = useState(0);            // รวมรายจ่ายทั้งหมด (บาท)

  const expensePercent = useMemo(() => {
    const base = incomeTotal + expenseTotal;
    return base > 0 ? Math.round((expenseTotal / base) * 100) : 0;
  }, [incomeTotal, expenseTotal]);

  // ====== โหลดข้อมูลจากชีต ======
  useEffect(() => {
    (async () => {
      try {
        await requestSheetsToken(); // เวอร์ชันใหม่ไม่รับ argument

        const prods: ProductItem[] = await getProducts().catch(() => []);
        setAllProducts(prods);

        // เลือก 4 ตัวแรก (หรือเท่าที่มี) ทำ Top Products (เดิม)
        const top: ShowcaseProduct[] = (prods || []).slice(0, 4).map((p, i) => {
          const priceNum = toNumberSafe(p.price, 50);
          const popularity = Math.max(10, Math.min(95, Math.round(priceNum)));
          const salesPct = Math.min(45 - i * 5, 45);
          return {
            name: p.name || `Product ${i + 1}`,
            popularity,
            sales: `${Math.max(5, salesPct)}%`,
            color: ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-amber-500"][i]!,
          };
        });
        setProducts(top);

        // ===== Ledger: คำนวณรายรับ/รายจ่าย =====
        const ledger: LedgerRow[] = await getLedger().catch(() => []);
        const qSum = [0, 0, 0, 0]; // รายรับรายไตรมาส (บาท)
        let inc = 0;
        let exp = 0;

        for (const r of ledger) {
          const amt = Number(r.totalAmount || 0);
          const d = new Date(String(r.date || ""));
          const m = Number.isFinite(d.getTime()) ? d.getMonth() + 1 : null; // 1..12

          if (r.type === "รายรับ") {
            inc += amt;
            if (m) qSum[Math.floor((m - 1) / 3)] += amt; // Q1..Q4
          } else {
            exp += Math.abs(amt);
          }
        }

        setIncomeTotal(inc);
        setExpenseTotal(exp);
      } catch (err) {
        console.error(err);
        setAllProducts([]);
        setProducts([]);
        setIncomeTotal(0);
        setExpenseTotal(0);
      }
    })();
  }, []);

  // ====== สรุปข้อมูลสินค้าทั้งหมด ======
  const totalProducts = useMemo(() => allProducts.length, [allProducts]);
  const totalQty = useMemo(
    () => allProducts.reduce((s, p) => s + toNumberSafe(p.quantity, 0), 0),
    [allProducts]
  );

  return (
    <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* แถวกราฟสรุป */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ✅ การ์ด: ข้อมูลสินค้าทั้งหมด (แสดงเป็นกราฟแท่งสองแถว) */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="mb-2 font-semibold text-gray-800 text-center">
            ข้อมูลสินค้าทั้งหมด
          </h3>

          {(() => {
            const rows = [
              { label: "สินค้าทั้งหมด", qty: totalProducts, suffix: "รายการ" },
              { label: "คงเหลือรวม", qty: totalQty, suffix: "ชิ้น" },
            ];
            const max = Math.max(...rows.map(r => r.qty)) || 1;

            return (
              <div className="mt-4 space-y-4">
                {rows.map((it, idx) => {
                  const pct = Math.round((it.qty / max) * 100);
                  return (
                    <div key={idx} className="w-full">
                      <div className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-3 text-xs sm:text-sm text-gray-700 truncate">
                          {it.label}
                        </div>
                        <div className="col-span-7">
                          <div className="w-full h-5 bg-gray-200 rounded-md overflow-hidden">
                            <div className="h-5 bg-blue-600" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="col-span-2 text-right text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          {it.qty.toLocaleString("th-TH")} {it.suffix}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ✅ รายรับ (สัดส่วนจากรายรับ+รายจ่าย) */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="mb-2 font-semibold text-gray-800">รายรับ</h3>
            <p className="text-sm text-gray-600">
              รายรับรวม: ฿{incomeTotal.toLocaleString("th-TH")}
            </p>
            <div className="mt-3 text-xs text-gray-500">
              สัดส่วนรายรับ {100 - expensePercent}% ของยอดเคลื่อนไหวทั้งหมด
            </div>
          </div>
          <DonutChart percent={100 - expensePercent} label="income share" />
        </div>

        {/* ✅ รายจ่าย (สัดส่วนจากรายรับ+รายจ่าย) */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="mb-2 font-semibold text-gray-800">รายจ่าย</h3>
            <p className="text-sm text-gray-600">
              รายจ่ายรวม: ฿{expenseTotal.toLocaleString("th-TH")}
            </p>
            <div className="mt-3 text-xs text-gray-500">
              สัดส่วนรายจ่าย {expensePercent}% ของยอดเคลื่อนไหวทั้งหมด
            </div>
          </div>
          <DonutChart percent={expensePercent} label="expense share" />
        </div>
      </div>

      {/* Bottom row: Top Products + Profit card */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Top Products (ซ้าย) */}
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <h3 className="mb-4 font-semibold text-gray-800 flex items-center">
      <FiPieChart className="mr-2 text-blue-500" /> Top Products
    </h3>
    {products.length === 0 ? (
      <div className="text-sm text-gray-500">ยังไม่มีข้อมูลสินค้า</div>
    ) : (
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
    )}
  </div>

        {/* กำไรจากการขาย (ขวา) */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="mb-2 font-semibold text-gray-800">กำไรจากการขาย</h3>

          {(() => {
            const income = incomeTotal;              // รายรับรวมจาก Ledger
            const expense = expenseTotal;            // รายจ่ายรวมจาก Ledger
            const profit = income - expense;         // กำไรรวม (Gross)

            const profitSign = profit >= 0 ? "text-emerald-600" : "text-red-600";
            const base = income + expense;
            const profitPct = base > 0 ? Math.round((profit / base) * 100) : 0;

            return (
              <div className="space-y-3">
                <div className={`text-3xl font-bold ${profitSign}`}>
                  ฿{Math.abs(profit).toLocaleString("th-TH")}
                </div>

                {/* แถบสัดส่วนกำไร */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-3 ${profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${Math.max(0, Math.min(100, profitPct))}%` }}
                    aria-label={`กำไร ${profitPct}%`}
                  />
                </div>

                {/* breakdown */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="text-emerald-700 font-medium">รายรับรวม</div>
                    <div className="font-semibold">
                      ฿{income.toLocaleString("th-TH")}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                    <div className="text-rose-700 font-medium">รายจ่ายรวม</div>
                    <div className="font-semibold">
                      ฿{expense.toLocaleString("th-TH")}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  สัดส่วนกำไร {profitPct}%
                  {base > 0 ? " ของยอดเคลื่อนไหวทั้งหมด" : ""}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
