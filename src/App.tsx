import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";


import ScrollToTop from "./components/FrontEnd/ScrollToTop";
// Auth
import LoginPage from "./components/pages/LoginPages";
import RegisterPage from "./components/pages/RegisterPage";

// Layouts
import FrontLayout from "./components/layouts/FrontLayout";
import MainLayout from "./components/layouts/Layout"; // layout ที่มี Sidebar (ของ Dashboard)

// Front pages
import Home from "./components/FrontEnd/Home";
import Men from "./components/FrontEnd/Men";
import Women from "./components/FrontEnd/Women"
import Objects from "./components/FrontEnd/Objects"

// Dashboard pages
import Dashboard from "./components/pages/Dashboard/Dashboard";
import ProductManagement from "./components/pages/Dashboard/ProductManagement";

export default function App() {
  return (
    <BrowserRouter>
     <ScrollToTop /> 
      <Routes>
        {/* กลุ่มหน้าเว็บฝั่งผู้ใช้ (Front Site) */}
        <Route element={<FrontLayout />}>
          <Route path="/" element={<Home />} />          {/* หน้าแรก */}
          <Route path="/men" element={<Men />} />
          <Route path="/women" element={<Women />} />
          <Route path="/objects" element={<Objects />} /> 
        </Route>


        {/* กลุ่ม Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* กลุ่ม Dashboard (หลังบ้าน) */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          {/* <Route path="repair" element={<Repair />} /> */}
        </Route>
        
        {/* กลุ่มหน้า Dashboard */}
      <Route path="/Dashboard" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="ProductManagement" element={<ProductManagement />} />
        {/* ถ้ามีหน้าอื่น เติมตรงนี้ได้ */}
      </Route>

      {/* ไม่เจอเส้นทางใด ๆ เด้งกลับ Dashboard */}
      <Route path="*" element={<Navigate to="/Dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
