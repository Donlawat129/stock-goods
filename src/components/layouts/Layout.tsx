import { Outlet } from "react-router-dom";
import Sidebar from "../pages/Dashboard/Sidebar";
import RouteTitle from "../common/RouteTitle";

export default function MainLayout() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="w-full min-h-screen bg-gray-100 p-6">
        {/* หัวข้อที่เปลี่ยนตามเมนู */}
        <RouteTitle />
        <Outlet />
      </main>
    </div>
  );
}
