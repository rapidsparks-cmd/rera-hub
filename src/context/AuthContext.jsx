import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';

const RENDER_API_URL = import.meta.env.VITE_RENDER_API_URL || '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // Firebase user object | null
  const [isPremium, setIsPremium] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true while onAuthStateChanged fires first time
  const [premiumLoading, setPremiumLoading] = useState(false);
  const premiumCheckedForUid = useRef(null);         // avoid duplicate checks

  // ── Check premium status via backend ──────────────────────────────────────
  const checkPremium = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setIsPremium(false);
      return false;
    }
    // Skip if already checked for this uid in this session
    if (premiumCheckedForUid.current === firebaseUser.uid && isPremium) return true;

    if (!RENDER_API_URL) {
      // Dev mode with no backend configured — default to false
      console.warn('[AuthContext] VITE_RENDER_API_URL not set; skipping premium check');
      return false;
    }

    try {
      setPremiumLoading(true);
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch(`${RENDER_API_URL}/api/user-status`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`user-status returned ${res.status}`);
      const data = await res.json();
      premiumCheckedForUid.current = firebaseUser.uid;
      setIsPremium(data.isPremium === true);
      return data.isPremium === true;
    } catch (err) {
      console.error('[AuthContext] Failed to check premium status:', err.message);
      return false;
    } finally {
      setPremiumLoading(false);
    }
  }, [isPremium]);

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await checkPremium(firebaseUser);
      } else {
        setIsPremium(false);
        premiumCheckedForUid.current = null;
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign-in helpers ────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await checkPremium(result.user);
    return result.user;
  };

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await checkPremium(result.user);
    return result.user;
  };

  const registerWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await checkPremium(result.user);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsPremium(false);
    premiumCheckedForUid.current = null;
  };

  // Called by PaymentModal after a successful payment to immediately refresh status
  const refreshPremium = useCallback(async () => {
    premiumCheckedForUid.current = null; // force re-check
    if (user) await checkPremium(user);
  }, [user, checkPremium]);

  const value = {
    user,
    isPremium,
    authLoading,
    premiumLoading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refreshPremium,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
