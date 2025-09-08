import { Outlet } from "react-router-dom";
import Sidebar from "../pages/Dashboard/Sidebar";

export default function MainLayout() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="w-full min-h-screen bg-gray-100 p-6">
        <Outlet /> {/* จะ render หน้า Dashboard, Repair ฯลฯ */}
      </div>
    </div>
  );
}
