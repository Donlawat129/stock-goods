import { auth } from "./firebase";
import {
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";

export async function ensureIdentity() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) { unsub(); resolve(user); return; }
      try { await signInAnonymously(auth); }
      catch (e) { reject(e); }
    });
  });
}

export async function ensureSignedIn() {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
  return auth.currentUser;
}
