// src/components/ScrollToTop.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation(); // ดัก URL ที่เปลี่ยน

  useEffect(() => {
    window.scrollTo(0, 0); // scroll ไปบนสุดทุกครั้งที่เปลี่ยนหน้า
  }, [pathname]);

  return null;
}
