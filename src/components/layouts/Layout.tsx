// src/components/layouts/Layout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../pages/Dashboard/Sidebar";
import DashBoardNavbar from "../pages/DashBoardNavbar"; // <- ปรับให้ตรงตำแหน่งไฟล์ของคุณ

export default function MainLayout() {
  const { pathname } = useLocation();

  // ซ่อน Header บางหน้า (เช่น Banner Hero)
  const hideHeaderOn = ["/Dashboard/HeroBanner"];

  // ให้โชว์ header เฉพาะหน้า Dashboard หลัก
  const showDashboardHeader =
    pathname === "/Dashboard" && !hideHeaderOn.some((p) => pathname.startsWith(p));

  return (
    <div className="flex">
      <Sidebar />
      <div className="w-full min-h-screen bg-gray-100 p-6 space-y-6">
        {showDashboardHeader && <DashBoardNavbar notifications={3} />}
        <Outlet />
      </div>
    </div>
  );
}
