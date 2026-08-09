import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';

const RENDER_API_URL = import.meta.env.VITE_RENDER_API_URL || '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [entitlements, setEntitlements] = useState({});
  const [authLoading, setAuthLoading] = useState(true);
  const [entitlementsLoading, setEntitlementsLoading] = useState(false);
  const checkedForUid = useRef(null);

  // Demo mode local storage key for test entitlements
  const getLocalEntitlements = () => {
    try {
      return JSON.parse(localStorage.getItem('rera_demo_entitlements') || '{}');
    } catch {
      return {};
    }
  };

  const saveLocalEntitlements = (newEnts) => {
    try {
      localStorage.setItem('rera_demo_entitlements', JSON.stringify(newEnts));
    } catch {
      /* ignore */
    }
  };

  // ── Check entitlements ──────────────────────────────────────────────────────
  const checkEntitlements = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setEntitlements({});
      return {};
    }

    if (!RENDER_API_URL || !isFirebaseConfigured) {
      // Local Demo Mode: read entitlements from localStorage
      const local = getLocalEntitlements();
      setEntitlements(local);
      return local;
    }

    try {
      setEntitlementsLoading(true);
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch(`${RENDER_API_URL}/api/user-status`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`user-status returned ${res.status}`);
      const data = await res.json();
      checkedForUid.current = firebaseUser.uid;
      const ents = data.entitlements || {};
      setEntitlements(ents);
      return ents;
    } catch (err) {
      console.warn('[AuthContext] API call failed, using local demo state:', err.message);
      const local = getLocalEntitlements();
      setEntitlements(local);
      return local;
    } finally {
      setEntitlementsLoading(false);
    }
  }, []);

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Demo mode: check if demo user was saved
      const saved = localStorage.getItem('rera_demo_user');
      if (saved) {
        try {
          const u = JSON.parse(saved);
          setUser(u);
          setEntitlements(getLocalEntitlements());
        } catch {
          /* ignore */
        }
      }
      setAuthLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        checkEntitlements(firebaseUser);
      } else {
        setEntitlements({});
        checkedForUid.current = null;
      }
      setAuthLoading(false);
    });
    return unsub;
  }, [checkEntitlements]);

  // ── Demo Unlock Helper (when no backend/Razorpay configured) ────────────────
  const unlockDemoEntitlement = (reraId, plan) => {
    const key = (reraId || 'DEFAULT').trim().toUpperCase();
    const current = getLocalEntitlements();
    const existing = current[key] || {};
    const updated = {
      ...current,
      [key]: {
        hasBreakdown: true,
        hasFormM: plan === 'form_m' || existing.hasFormM === true,
        hasLegalGuidance: plan === 'legal_guidance' || existing.hasLegalGuidance === true,
      },
    };
    saveLocalEntitlements(updated);
    setEntitlements(updated);
  };

  // ── Helper methods ─────────────────────────────────────────────────────────
  const normalizeId = (id) => (id ? id.trim().toUpperCase() : 'DEFAULT');

  const hasBreakdownAccess = useCallback(
    (reraId) => {
      const key = normalizeId(reraId);
      const ent = entitlements[key];
      if (ent && (ent.hasBreakdown === true || ent.hasFormM === true)) return true;
      if (entitlements['DEFAULT']?.hasBreakdown === true || entitlements['DEFAULT']?.hasFormM === true) return true;
      // Return true if user has unlocked breakdown for any RERA ID or state
      return Object.values(entitlements).some((e) => e.hasBreakdown === true || e.hasFormM === true);
    },
    [entitlements]
  );

  const hasFormMAccess = useCallback(
    (reraId) => {
      const key = normalizeId(reraId);
      const ent = entitlements[key];
      if (ent && ent.hasFormM === true) return true;
      if (entitlements['DEFAULT']?.hasFormM === true) return true;
      // Return true if user has unlocked Form M for any RERA ID
      return Object.values(entitlements).some((e) => e.hasFormM === true);
    },
    [entitlements]
  );

  const hasLegalGuidanceAccess = useCallback(
    (reraId) => {
      const key = normalizeId(reraId);
      const ent = entitlements[key];
      if (ent && ent.hasLegalGuidance === true) return true;
      if (entitlements['DEFAULT']?.hasLegalGuidance === true) return true;
      return Object.values(entitlements).some((e) => e.hasLegalGuidance === true);
    },
    [entitlements]
  );

  const isAnyPremium = Object.values(entitlements).some((e) => e.hasFormM || e.hasBreakdown || e.hasLegalGuidance);

  // ── Sign-in helpers ────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      const demoUser = {
        uid: 'demo_user_123',
        displayName: 'Demo Homebuyer',
        email: 'homebuyer@example.com',
      };
      setUser(demoUser);
      localStorage.setItem('rera_demo_user', JSON.stringify(demoUser));
      setEntitlements(getLocalEntitlements());
      return demoUser;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkEntitlements(result.user);
      return result.user;
    } catch (err) {
      if (err?.message?.includes('Database is closing') || err?.message?.includes('IndexedDB')) {
        const { setPersistence, inMemoryPersistence } = await import('firebase/auth');
        await setPersistence(auth, inMemoryPersistence).catch(() => {});
        const result = await signInWithPopup(auth, provider);
        await checkEntitlements(result.user);
        return result.user;
      }
      throw err;
    }
  };

  const loginWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const demoUser = {
        uid: `demo_user_${Date.now()}`,
        displayName: email.split('@')[0],
        email: email,
      };
      setUser(demoUser);
      localStorage.setItem('rera_demo_user', JSON.stringify(demoUser));
      setEntitlements(getLocalEntitlements());
      return demoUser;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkEntitlements(result.user);
      return result.user;
    } catch (err) {
      if (err?.message?.includes('Database is closing') || err?.message?.includes('IndexedDB')) {
        const { setPersistence, inMemoryPersistence } = await import('firebase/auth');
        await setPersistence(auth, inMemoryPersistence).catch(() => {});
        const result = await signInWithEmailAndPassword(auth, email, password);
        await checkEntitlements(result.user);
        return result.user;
      }
      throw err;
    }
  };

  const registerWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      return loginWithEmail(email, password);
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await checkEntitlements(result.user);
      return result.user;
    } catch (err) {
      if (err?.message?.includes('Database is closing') || err?.message?.includes('IndexedDB')) {
        const { setPersistence, inMemoryPersistence } = await import('firebase/auth');
        await setPersistence(auth, inMemoryPersistence).catch(() => {});
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await checkEntitlements(result.user);
        return result.user;
      }
      throw err;
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    setUser(null);
    setEntitlements({});
    localStorage.removeItem('rera_demo_user');
    checkedForUid.current = null;
  };

  const refreshEntitlements = useCallback(async () => {
    checkedForUid.current = null;
    if (user) await checkEntitlements(user);
  }, [user, checkEntitlements]);

  const value = {
    user,
    entitlements,
    isPremium: isAnyPremium,
    authLoading,
    entitlementsLoading,
    isFirebaseConfigured,
    hasBreakdownAccess,
    hasFormMAccess,
    hasLegalGuidanceAccess,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refreshEntitlements,
    unlockDemoEntitlement,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
