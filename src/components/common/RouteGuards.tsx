// src/components/common/RouteGuards.tsx
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthUser } from "../../hooks/useAuthUser";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser();
  const location = useLocation();

  if (loading) {
    return <div className="p-4">กำลังตรวจสอบสิทธิ์...</div>;
  }

  if (!user) {
    // ยังไม่ล็อกอิน ส่งไปหน้า Login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export function RequireAdminOrOwner({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuthUser();
  const location = useLocation();

  if (loading) {
    return <div className="p-4">กำลังตรวจสอบสิทธิ์...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ ถ้าไม่ใช่ admin หรือ owner → ดีดไปหน้า ProductManagement
  if (role !== "admin" && role !== "owner") {
    return (
      <Navigate
        to="/Dashboard/ProductManagement"
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
}
