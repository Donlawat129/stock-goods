import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { ensureIdentity, ensureSignedIn } from "../../lib/authBootstrap";

export default function TestAuth() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    ensureIdentity().then(() => {
      const u = auth.currentUser;
      setInfo({
        uid: u?.uid,
        isAnonymous: u?.isAnonymous,
        email: u?.email || null,
      });
    });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Auth Status</h2>
      <pre>{JSON.stringify(info, null, 2)}</pre>
      <button onClick={async () => {
        await ensureSignedIn();
        const u = auth.currentUser;
        setInfo({ uid: u?.uid, isAnonymous: u?.isAnonymous, email: u?.email || null });
      }}>
        Sign in with Google (สำหรับสิทธิ์เขียน)
      </button>
    </div>
  );
}
