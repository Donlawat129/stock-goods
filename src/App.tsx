// App.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

// Auth
import LoginPage from "./components/pages/LoginPages";
import RegisterPage from "./components/pages/RegisterPage";

// Layouts
import MainLayout from "./components/layouts/Layout";

// Dashboard pages
import Dashboard from "./components/pages/Dashboard/Dashboard";
import ProductManagement from "./components/pages/Dashboard/ProductManagement";
import FinanceDashboard from "./components/pages/Dashboard/FinanceDashboard";

// ✅ Guards
import {
  RequireAuth,
  RequireAdminOrOwner,
} from "./components/common/RouteGuards";

export default function App() {
  const navigate = useNavigate();

  // ✅ ดัก <a href="/..."> ภายในให้ใช้ navigate() ป้องกัน 404
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest?.(
        "a"
      ) as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      const sameOrigin = a.origin === window.location.origin;
      const isAppPath = href.startsWith("/") && !href.startsWith("//");
      const newTab = a.target && a.target !== "_self";
      const isDownload = a.hasAttribute("download");

      if (sameOrigin && isAppPath && !isDownload) {
        e.preventDefault();
        const url = new URL(a.href);
        const path = url.pathname + url.search + url.hash;

        if (newTab) {
          // เปิดแท็บใหม่แบบ hash route
          window.open(`#${path}`, "_blank", "noopener");
        } else {
          navigate(path);
        }
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  return (
    <>
      <Routes>
        {/* Auth */}
        {/* หน้า login อยู่ที่ "/" */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard ทั้งก้อนต้องล็อกอิน */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          {/* /dashboard → admin / owner */}
          <Route
            index
            element={
              <RequireAdminOrOwner>
                <Dashboard />
              </RequireAdminOrOwner>
            }
          />

          {/* /dashboard/ProductManagement → user ทุกคนที่ล็อกอิน */}
          <Route path="ProductManagement" element={<ProductManagement />} />

          {/* /dashboard/FinanceDashboard → admin / owner */}
          <Route
            path="FinanceDashboard"
            element={
              <RequireAdminOrOwner>
                <FinanceDashboard />
              </RequireAdminOrOwner>
            }
          />
        </Route>

        {/* not found → กลับไปหน้า login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
