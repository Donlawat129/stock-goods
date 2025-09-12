// App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

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

        {/* Dashboard (แนะนำใช้พิมพ์เล็กให้คงที่) */}
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
