import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import ReraDesk from "./components/ReraDesk";
import StateLanding from "./components/StateLanding";
import { isApplicableStateId, getStateById } from "./data/reraStates";

function CalculatorRoute({ language }) {
  const { stateId } = useParams();
  if (!isApplicableStateId(stateId)) {
    return <Navigate to="/" replace />;
  }
  return <ReraDesk language={language} stateId={stateId} />;
}

function AppShell() {
  const [language, setLanguage] = useState("en");
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
        </nav>
      </header>
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
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
