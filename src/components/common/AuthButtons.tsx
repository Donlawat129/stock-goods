import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export default function AuthButtons() {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // ✅ สำเร็จแล้ว onAuthStateChanged จะอัปเดต user ให้เอง
    } catch (e: any) {
      alert(e?.message || "Login failed");
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e: any) {
      alert(e?.message || "Logout failed");
    }
  }

  if (loading) return <button disabled>Loading...</button>;

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 14 }}>
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="avatar"
            style={{ width: 24, height: 24, borderRadius: "50%", marginRight: 8 }}
          />
        )}
        {user.displayName || user.email}
      </span>
      <button
        onClick={handleLogout}
        style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
      >
        Logout
      </button>
    </div>
  );
}
