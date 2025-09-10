// src/components/dashboard/Dashboard.tsx
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  FiShoppingCart, FiDollarSign, FiUsers, FiBox,
  FiTrendingUp, FiPieChart, FiTarget,
} from "react-icons/fi";

// เชื่อม Google Sheets
import {
  requestSheetsToken,
  getProducts,
  readSheet,
  readUsers,
} from "../../../lib/sheetsClient";

// ---------- Utils ----------
const months = ["J","F","M","A","M","J","J","A","S","O","N","D"] as const;
const CIRC = 2 * Math.PI * 40;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toPercent = (v: number) => `${Math.round(clamp01(v) * 100)}%`;
const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const lc = (s: unknown) => (s ?? "").toString().trim().toLowerCase();
const num = (v: unknown) => (typeof v === "number" ? v : Number((v ?? "").toString().replace(/,/g, ""))) || 0;
const idx = (h: string[], keys: string[]) => h.findIndex((x) => keys.includes(lc(x)));

function ymd(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

// ---------- Types ----------
type Stat = {
  title: string;
  value: string;
  change: string;
  textColor: string;
  bgColor: string;
  icon: JSX.Element;
};

type ShowcaseProduct = {
  name: string;
  popularity: number;
  sales: string;
  color: string;
};

// ---------- Component ----------
export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  // ตัวเลขจริง
  const [todaysSales, setTodaysSales]   = useState(0);
  const [totalOrders, setTotalOrders]   = useState(0);
  const [productsSold, setProductsSold] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);

  // กราฟ
  const [visitorData, setVisitorData] = useState<number[]>(Array(12).fill(0));
  const [revenueData, setRevenueData] = useState<number[]>(Array(12).fill(0));

  // Top products
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await requestSheetsToken("consent");

        // ===== Products =====
        try {
          const prods = await getProducts();
          setProductsSold(prods.items.length);
          // เลือก 4 ตัวแรกทำ Top Products (ความยาวแถบจากราคา หรือตั้งกลาง ๆ ถ้าไม่มีราคา)
          const top = prods.items.slice(0, 4).map((p, i) => ({
            name: p.name || `Product ${i+1}`,
            popularity: Math.max(10, Math.min(95, p.price ? Math.round(Number(p.price)) : 70 - i*10)),
            sales: `${Math.min(45 - i*5, 45)}%`,
            color: ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-amber-500"][i]!,
          }));
          setProducts(top);
        } catch { setProductsSold(0); setProducts([]); }

        // ===== Orders (ถ้ามี) → ใช้เป็นแหล่งหลัก =====
        let usedOrders = false;
        try {
          const raw = (await readSheet("Orders")) as any;
          const values: string[][] = raw?.values || [];
          const [h=[], ...rows] = values;
          if (rows.length) {
            usedOrders = true;
            const H = h.map(lc);
            const iDate  = idx(H, ["date","created","createdat","orderdate","วันที่"]);
            const iQty   = idx(H, ["qty","quantity","จำนวน"]);
            const iPrice = idx(H, ["price","unitprice","amount","ราคา"]);
            const iTotal = idx(H, ["total","grandtotal","sum","ยอดรวม"]);

            let todaySum = 0;
            let orderCnt = 0;
            const revByMonth = Array(12).fill(0);
            const visitByMonth = Array(12).fill(0);
            const today = ymd();

            for (const r of rows) {
              const d = r[iDate] ? new Date(r[iDate]) : null;
              const m = d ? new Date(d).getMonth() : 0;
              const dayKey = d ? ymd(d) : "";

              let total = 0;
              if (iTotal >= 0 && r[iTotal]) total = num(r[iTotal]);
              else {
                const q = iQty >= 0 ? num(r[iQty]) : 1;
                const p = iPrice >= 0 ? num(r[iPrice]) : 0;
                total = q * p;
              }

              if (total > 0) {
                revByMonth[m] += total;
                visitByMonth[m] += 1;
                orderCnt += 1;
              }
              if (dayKey === today) todaySum += total;
            }

            setTodaysSales(todaySum);
            setTotalOrders(orderCnt);
            setRevenueData(revByMonth);
            setVisitorData(visitByMonth);
          }
        } catch { /* no Orders */ }

        // ===== StockLogs (fallback ถ้าไม่มี Orders) =====
        if (!usedOrders) {
          try {
            const raw = (await readSheet("StockLogs")) as any;
            const values: string[][] = raw?.values || [];
            const [h=[], ...rows] = values;
            const H = h.map(lc);
            const iDate   = idx(H, ["date","datetime","created","createdat","วันที่","วันเวลา"]);
            const iAction = idx(H, ["action","type","ประเภท"]);
            const iQty    = idx(H, ["qty","quantity","จำนวน"]);
            const iPrice  = idx(H, ["price","unitprice","amount","ราคา"]);
            // “out” ถือเป็นยอดขาย; “out” 1 รายการ = 1 ออเดอร์
            let todaySum = 0, orderCnt = 0;
            const revByMonth = Array(12).fill(0);
            const visitByMonth = Array(12).fill(0);
            const today = ymd();

            for (const r of rows) {
              const action = lc(r[iAction]);
              const d = r[iDate] ? new Date(r[iDate]) : null;
              const m = d ? new Date(d).getMonth() : 0;
              const dayKey = d ? ymd(d) : "";
              const q = iQty >= 0 ? num(r[iQty]) : 0;
              const p = iPrice >= 0 ? num(r[iPrice]) : 0;

              if (["out","ขาย","เบิกออก","ปรับ-","adjust-"].includes(action)) {
                const total = Math.abs(q) * p;
                revByMonth[m] += total;
                visitByMonth[m] += 1;
                orderCnt += 1;
                if (dayKey === today) todaySum += total;
              }
            }
            setTodaysSales(todaySum);
            setTotalOrders(orderCnt);
            setRevenueData(revByMonth);
            setVisitorData(visitByMonth);
          } catch { /* ignore */ }
        }

        // ===== Users (นับลูกค้าใหม่ของวันนี้ ถ้ามีคอลัมน์วันที่) =====
        try {
          const u = await readUsers();
          const H = u.header.map(lc);
          const iCreated = idx(H, ["created","createdat","date","joinedat","วันที่"]);
          if (iCreated >= 0) {
            const today = ymd();
            const countToday = u.rows.filter(r => (r[iCreated] ? ymd(new Date(r[iCreated])) : "") === today).length;
            setNewCustomers(countToday);
          } else setNewCustomers(0);
        } catch { setNewCustomers(0); }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // ปรับสเกลกราฟ
  const visitorPct = useMemo(() => {
    const max = Math.max(...visitorData, 1);
    return visitorData.map(v => v / max);
  }, [visitorData]);

  const revenuePct = useMemo(() => {
    const max = Math.max(...revenueData, 1);
    return revenueData.map(v => v / max);
  }, [revenueData]);

  // การ์ดสถิติ (หน้าตาเหมือนภาพ)
  const stats: Stat[] = [
    { title: "Today's Sales", value: money(todaysSales), change: "+1.5% from yesterday", textColor: "text-blue-600",   bgColor: "bg-blue-100",   icon: <FiDollarSign  className="text-blue-600" /> },
    { title: "Total Orders",  value: String(totalOrders), change: "+5% from yesterday",    textColor: "text-purple-600", bgColor: "bg-purple-100", icon: <FiShoppingCart className="text-purple-600" /> },
    { title: "Products Sold", value: String(productsSold),change: "+12% from yesterday",   textColor: "text-green-600",  bgColor: "bg-green-100",  icon: <FiBox        className="text-green-600" /> },
    { title: "New Customers", value: String(newCustomers),change: "+8% from yesterday",    textColor: "text-amber-600",  bgColor: "bg-amber-100",  icon: <FiUsers      className="text-amber-600" /> },
  ];

  const targetPercent = 98;

  return (
    <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>{stat.icon}</div>
              <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">{stat.title}</p>
            <p className={`text-xs mt-1 ${stat.change.includes("+") ? "text-green-500" : "text-red-500"}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Visitor Insights */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiTrendingUp className="mr-2 text-blue-500" /> Visitor Insights
            </h3>
            <select
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as "daily" | "weekly" | "monthly")}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="h-48 flex items-end space-x-1 pt-4">
            {visitorPct.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-t-lg" style={{ height: toPercent(p) }} />
                <span className="text-xs text-gray-500 mt-1">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiDollarSign className="mr-2 text-green-500" /> Total Revenue
            </h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <div className="h-48 flex items-end space-x-1 pt-4">
            {revenuePct.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gradient-to-t from-green-400 to-green-600 rounded-t-lg" style={{ height: toPercent(p) }} />
                <span className="text-xs text-gray-500 mt-1">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Target vs Reality */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiTarget className="mr-2 text-purple-500" /> Target vs Reality
            </h3>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{targetPercent}%</span>
          </div>
          <div className="h-48 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">{targetPercent}%</span>
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-200 stroke-current" strokeWidth={10} cx={50} cy={50} r={40} fill="transparent" />
                <circle
                  className="text-purple-500 stroke-current"
                  strokeWidth={10}
                  strokeLinecap="round"
                  cx={50}
                  cy={50}
                  r={40}
                  fill="transparent"
                  strokeDasharray={CIRC}
                  strokeDashoffset={Math.max(0, CIRC - (CIRC * targetPercent) / 100)}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
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
                      <div className={`h-2 ${product.color} rounded-full`} style={{ width: `${product.popularity}%` }} />
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">{product.sales}</span>
              </li>
            ))}
          </ul>
        </div>

        

        
      </div>
    </div>
  );
}
