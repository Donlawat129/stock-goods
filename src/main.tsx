import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App";
import { RequireAuth, RequireAdminOrOwner } from "./components/common/RouteGuards";

createRoot(document.getElementById("root")!).render(
  <StrictMode>

  <Routes>
    {/* หน้า login เข้าได้ทุกคน */}
    <Route path="/login" element={<LoginPages />} />
  
    {/* ✅ ProductManagement: แค่ล็อกอินก็เข้าได้ */}
    <Route
      path="/Dashboard/ProductManagement"
      element={
        <RequireAuth>
          <ProductManagement />
        </RequireAuth>
      }
    />
  
    {/* ✅ Dashboard รวม: ต้องเป็น admin หรือ owner */}
    <Route
      path="/Dashboard"
      element={
        <RequireAdminOrOwner>
          <Dashboard />
        </RequireAdminOrOwner>
      }
    />
  
    {/* ✅ Finance: ต้องเป็น admin หรือ owner */}
    <Route
      path="/Dashboard/Finance"
      element={
        <RequireAdminOrOwner>
          <FinanceDashboard />
        </RequireAdminOrOwner>
      }
    />
  
    {/* default route → ส่งไปหน้า ProductManagement ถ้าล็อกอินแล้ว */}
    <Route
      path="/"
      element={
        <RequireAuth>
          <ProductManagement />
        </RequireAuth>
      }
    />
  </Routes>
  </StrictMode>
);

// canonical-domain guard
const CANON = "log-in-stocking-googlesheet.vercel.app";
if (location.hostname.endsWith("-godsafe1s-projects.vercel.app")) {
  const target = `https://${CANON}${location.pathname}${location.search}${location.hash}`;
  location.replace(target);
}
