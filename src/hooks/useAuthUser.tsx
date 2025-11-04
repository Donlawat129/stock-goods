// src/hooks/useAuthUser.tsx
import { useEffect, useState } from "react";
import {
  getSessionUser,
  onAuthUserChanged,
  type AuthUser,
  getRoleFromEmail,
  type UserRole,
} from "../lib/auth";

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() => getSessionUser());
  const [role, setRole] = useState<UserRole>(() =>
    getRoleFromEmail(getSessionUser()?.email)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthUserChanged((u) => {
      setUser(u);
      setRole(getRoleFromEmail(u?.email));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, role, loading };
}
