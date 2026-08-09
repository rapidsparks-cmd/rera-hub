import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { LogIn, LogOut, Crown } from "lucide-react";
import ReraDesk from "./components/ReraDesk";
import StateLanding from "./components/StateLanding";
import AuthModal from "./components/AuthModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { isApplicableStateId, getStateById } from "./data/reraStates";

function CalculatorRoute({ language }) {
  const { stateId } = useParams();
  if (!isApplicableStateId(stateId)) {
    return <Navigate to="/" replace />;
  }
  return <ReraDesk language={language} stateId={stateId} />;
}

/** Header user chip — sign in button OR avatar+dropdown */
function UserChip({ onOpenAuth }) {
  const { user, isPremium, authLoading, logout } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropOpen]);

  if (authLoading) return <div className="user-chip-skeleton" aria-hidden="true" />;

  if (!user) {
    return (
      <button
        id="header-sign-in-btn"
        type="button"
        className="btn btn-secondary btn-sm user-sign-in"
        onClick={onOpenAuth}
      >
        <LogIn size={14} />
        Sign in
      </button>
    );
  }

  const initials = user.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="user-chip-wrap" ref={dropRef}>
      <button
        id="header-user-chip"
        type="button"
        className={`user-chip ${isPremium ? "premium" : ""}`}
        onClick={() => setDropOpen((v) => !v)}
        aria-expanded={dropOpen}
        aria-haspopup="menu"
        title={user.displayName || user.email}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={initials} className="user-avatar-img" referrerPolicy="no-referrer" />
        ) : (
          <span className="user-avatar-initials">{initials}</span>
        )}
        {isPremium && <Crown size={11} className="user-crown" aria-label="Premium" />}
      </button>

      {dropOpen && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-info">
            <strong>{user.displayName || "User"}</strong>
            <span className="muted">{user.email}</span>
            {isPremium && (
              <span className="premium-badge">
                <Crown size={11} /> Premium
              </span>
            )}
          </div>
          <hr className="dropdown-divider" />
          <button
            id="header-logout-btn"
            role="menuitem"
            type="button"
            className="dropdown-item"
            onClick={() => { setDropOpen(false); logout(); }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function AppShell() {
  const [language, setLanguage] = useState("en");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { pathname } = useLocation();
  const onCalculator = pathname.startsWith("/calculator/");

  // Parse stateId from pathname if on the calculator page
  const stateIdMatch = pathname.match(/^\/calculator\/([^/]+)/);
  const currentStateId = stateIdMatch ? stateIdMatch[1] : null;
  const activeState = currentStateId ? getStateById(currentStateId) : null;

  // Auto-reset language if it is not supported by the current state context
  useEffect(() => {
    if (!onCalculator) {
      if (language !== "en" && language !== "hi") {
        setLanguage("en");
      }
    } else if (activeState) {
      const allowedLangs = ["en", "hi"];
      if (activeState.localLang) {
        allowedLangs.push(activeState.localLang.code);
      }
      if (!allowedLangs.includes(language)) {
        setLanguage("en");
      }
    }
  }, [pathname, activeState, language, onCalculator]);

  return (
    <div className="app-container">
      <header className="site-header">
        <Link to="/" className="brand">
          <strong>RERA Hub</strong>
          <span>Section 18 compensation calculator</span>
        </Link>
        <nav className="header-nav">
          {onCalculator && (
            <>
              <Link to="/">Change state</Link>
              <a href="#faq">Legal FAQ</a>
              <a href="#expert-legal-advice" className="nav-expert-advice-btn" style={{ color: '#0d9488', fontWeight: '600' }}>Expert Legal Advice</a>
            </>
          )}
          <select
            className="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            {onCalculator && activeState?.localLang && activeState.localLang.code !== "hi" && (
              <option value={activeState.localLang.code}>{activeState.localLang.name}</option>
            )}
          </select>
          <UserChip onOpenAuth={() => setAuthModalOpen(true)} />
        </nav>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      <Routes>
        <Route path="/" element={<StateLanding />} />
        <Route path="/calculator/:stateId" element={<CalculatorRoute language={language} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
