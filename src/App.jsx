import { useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import ReraDesk from "./components/ReraDesk";
import StateLanding from "./components/StateLanding";
import { isApplicableStateId } from "./data/reraStates";

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
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
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
