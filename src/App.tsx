// App.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import ScrollToTop from "./components/FrontEnd/ScrollToTop";
// Auth
import LoginPage from "./components/pages/LoginPages";
import RegisterPage from "./components/pages/RegisterPage";

// Layouts
import FrontLayout from "./components/layouts/FrontLayout";
import MainLayout from "./components/layouts/Layout";

// Front pages
import Home from "./components/FrontEnd/Home";
import Men from "./components/FrontEnd/Men";
import Women from "./components/FrontEnd/Women";
import Objects from "./components/FrontEnd/Objects";

// Dashboard pages
import Dashboard from "./components/pages/Dashboard/Dashboard";
import ProductManagement from "./components/pages/Dashboard/ProductManagement";
import HeroBanner from "./components/pages/Dashboard/HeroBanner";

import TestAuth from "./components/pages/TestAuth";

export default function App() {
  const navigate = useNavigate();

  // ✅ ดัก <a href="/..."> ภายในให้ใช้ navigate() ป้องกัน 404
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
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
      <ScrollToTop />
      <Routes>
        {/* Front Site */}
        <Route element={<FrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/men" element={<Men />} />
          <Route path="/women" element={<Women />} />
          <Route path="/objects" element={<Objects />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ProductManagement" element={<ProductManagement />} />
          <Route path="HeroBanner" element={<HeroBanner />} />
        </Route>

        <Route path="/test-auth" element={<TestAuth />} />

        {/* not found → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
