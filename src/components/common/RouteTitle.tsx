// src/components/common/RouteTitle.tsx
import { useLocation } from "react-router-dom";

type TitleInfo = { title: string; subtitle?: string };

const TITLES: Record<string, TitleInfo> = {
  "/Dashboard": {
    title: "Dashboard",
    subtitle: "Welcome back, Syndtechdev! Explore outfits that bring out your confidence.",
  },
  "/Dashboard/ProductManagement": {
    title: "Product Management",
    subtitle: "Manage products, stock and sync with Google Sheets.",
  },
};

// เส้นทางที่ไม่ต้องการให้ RouteTitle แสดง (เพราะหน้ามีหัวข้อของตัวเอง)
const HIDE_ON = ["/Dashboard/ProductManagement"];

function resolveTitle(pathname: string): TitleInfo {
  const key =
    Object.keys(TITLES)
      .sort((a, b) => b.length - a.length)
      .find((k) => pathname === k || pathname.startsWith(k + "/")) || "/Dashboard";
  return TITLES[key]!;
}

export default function RouteTitle() {
  const { pathname } = useLocation();

  // ซ่อนหัวข้อเฉพาะหน้า Product Management
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  const { title, subtitle } = resolveTitle(pathname);
  return (
    <header className="mb-4">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
    </header>
  );
}
