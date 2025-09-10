import { useLocation } from "react-router-dom";

type TitleInfo = { title: string; subtitle?: string };

// กำหนดชื่อ/คำอธิบายของแต่ละเส้นทางตามเมนูใน Sidebar
const TITLES: Record<string, TitleInfo> = {
  "/Dashboard": {
    title: "Dashboard",
    subtitle: "Welcome back, Syndtechdev! Explore outfits that bring out your confidence.",
  },
  "/Dashboard/ProductManagement": {
    title: "Product Management",
    subtitle: "Manage products, stock and sync with Google Sheets.",
  },
  // เพิ่มเมนูอื่น ๆ ได้ที่นี่ถ้ามี
};

function resolveTitle(pathname: string): TitleInfo {
  // หา key ที่ match มากที่สุด (รองรับ path ย่อย)
  const key =
    Object.keys(TITLES)
      .sort((a, b) => b.length - a.length)
      .find(k => pathname === k || pathname.startsWith(k + "/")) || "/Dashboard";
  return TITLES[key]!;
}

export default function RouteTitle() {
  const { pathname } = useLocation();
  const { title, subtitle } = resolveTitle(pathname);

  return (
    <header className="mb-4">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
    </header>
  );
}
