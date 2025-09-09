// src/components/layouts/Layout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/Dashboard/Sidebar";
import DashBoardNavbar from "../pages/DashBoardNavbar";

export default function MainLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="w-full min-h-screen bg-gray-100 p-6 space-y-6">
        <DashBoardNavbar notifications={3} />
        <Outlet />
      </div>
    </div>
  );
}
