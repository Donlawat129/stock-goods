// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/pages/LoginPages";
import RegisterPage from "./components/pages/RegisterPage";
import MainLayout from "./components/layouts/Layout"; // <- Layout ที่มี Sidebar
import Dashboard from "./components/pages/Dashboard/Dashboard";
import Sidebar from './components/pages/Dashboard/Sidebar';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes ที่ใช้ Layout */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} /> {/* /app = Dashboard */}
          <Route path="sidebar" element={<Sidebar />} /> {/* /app/repair */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
