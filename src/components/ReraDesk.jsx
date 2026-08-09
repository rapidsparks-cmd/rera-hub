import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Calculator,
  Check,
  ChevronDown,
  Copy,
  Crown,
  Lock,
  LogIn,
  Plus,
  Printer,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import PaymentModal from "./PaymentModal";
import {
  APPLICABLE_RERA_STATES,
  SBI_MCLR_SOURCE_URL,
  getStateById,
  methodLabel,
  ruleSummary,
} from "../data/reraStates";
import { getFaqByLanguage } from "../data/faq";
import { calculateReraInterest, formatINR, formatNumber } from "../utils/reraInterest";
import {
  getCurrentHighestMclr,
  getMclrMeta,
  refreshMclrFromSbi,
} from "../services/mclrService";
import { getCurrentSpreadRule } from "../services/stateSpreadService";
import InterestTrendChart from "./InterestTrendChart";
import ReportBreakdown from "./ReportBreakdown";
import { getFormMTemplate } from "../utils/formMTemplates";
import { downloadAsPDF, downloadAsWord } from "../utils/downloadHelpers";
import { translate } from "../utils/translations";

const ENABLE_RERA_FORM_M_DRAFT = import.meta.env.VITE_ENABLE_RERA_FORM_M_DRAFT !== "false";
const ENABLE_INSTALLMENTS_SCHEDULE =
  import.meta.env.VITE_ENABLE_INSTALLMENTS_SCHEDULE !== "false";

const CALC_TYPE = "builder_delay";
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ReraDesk({ language = "en", stateId }) {
  const { user, hasBreakdownAccess, hasFormMAccess } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [targetPaymentPlan, setTargetPaymentPlan] = useState("form_m");

  const navigate = useNavigate();
  const calcRef = useRef(null);
  const reportRef = useRef(null);

  const [inputMode, setInputMode] = useState("amount");
  const [mclrMeta, setMclrMeta] = useState(() => getMclrMeta());
  const [overrideMclr, setOverrideMclr] = useState(false);
  const [manualMclr, setManualMclr] = useState(() => String(getCurrentHighestMclr() ?? "8.8"));
  const [amountPaid, setAmountPaid] = useState("5000000");
  const [installments, setInstallments] = useState([{ id: 1, amount: "", date: "" }]);
  const [promisedDate, setPromisedDate] = useState("");
  const [endDate, setEndDate] = useState(todayISO());

  // Form M details inputs
  const [complainantName, setComplainantName] = useState("");
  const [complainantAddress, setComplainantAddress] = useState("");
  const [complainantContact, setComplainantContact] = useState("");
  const [projectName, setProjectName] = useState("");
  const [promoterName, setPromoterName] = useState("");
  const [promoterAddress, setPromoterAddress] = useState("");
  const [reraRegNo, setReraRegNo] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [agreementDate, setAgreementDate] = useState("");

  // Editor text state
  const [editorText, setEditorText] = useState("");

  const effectiveInputMode = ENABLE_INSTALLMENTS_SCHEDULE ? inputMode : "amount";

  const [result, setResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [openFaq, setOpenFaq] = useState("how-interest");
  const [error, setError] = useState("");

  const state = getStateById(stateId);
  const spreadRule = useMemo(
    () => getCurrentSpreadRule(stateId, endDate || todayISO()),
    [stateId, endDate]
  );
  const effectiveSpread = Number(spreadRule?.spreadPct ?? 0);
  const interestMethod = spreadRule?.method || "simple";
  const latestMclr = mclrMeta.latestHighest ?? getCurrentHighestMclr();
  const illustrativeRate = Number(latestMclr) + effectiveSpread;

  // Normalized current RERA ID scope
  const currentReraId = (reraRegNo?.trim() || stateId || "DEFAULT").toUpperCase();
  const isBreakdownUnlocked = hasBreakdownAccess(currentReraId);
  const isFormMUnlocked = hasFormMAccess(currentReraId);

  useEffect(() => {
    let cancelled = false;
    refreshMclrFromSbi().then((meta) => {
      if (cancelled) return;
      setMclrMeta(meta);
      if (meta.latestHighest != null) setManualMclr(String(meta.latestHighest));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setResult(null);
  }, [stateId]);

  // Auto-regenerate template draft if inputs, language or result change
  useEffect(() => {
    if (result) {
      const templateData = {
        complainantName,
        complainantAddress,
        complainantContact,
        promoterName,
        promoterAddress,
        projectName,
        reraRegNo,
        bookingDate,
        agreementDate,
        amountPaid: formatINR(result.principal),
        promisedDate,
        endDate,
        delayDays: formatNumber(result.delayDays),
        interestAmount: formatINR(result.interest),
        interestRate: result.annualRatePct.toFixed(2),
        totalClaim: formatINR(result.total)
      };
      const text = getFormMTemplate(stateId, templateData, language);
      setEditorText(text);
    }
  }, [
    result,
    stateId,
    language,
    complainantName,
    complainantAddress,
    complainantContact,
    promoterName,
    promoterAddress,
    projectName,
    reraRegNo,
    bookingDate,
    agreementDate,
    promisedDate,
    endDate
  ]);

  const stateRuleText = useMemo(
    () => (state ? ruleSummary(state, latestMclr, spreadRule) : ""),
    [state, latestMclr, spreadRule]
  );

  const scrollToCalc = () => {
    calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changeState = (nextId) => {
    if (nextId && nextId !== stateId) {
      navigate(`/calculator/${nextId}`);
    }
  };

  const addInstallment = () => {
    setInstallments((prev) => [...prev, { id: Date.now(), amount: "", date: "" }]);
  };

  const updateInstallment = (id, key, value) => {
    setInstallments((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const removeInstallment = (id) => {
    setInstallments((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const paymentsForCalc = () => {
    if (effectiveInputMode === "amount") {
      return [{ amount: amountPaid, date: promisedDate || todayISO() }];
    }
    return installments.map((r) => ({ amount: r.amount, date: r.date }));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError("");
    setCalcLoading(true);
    setResult(null);

    try {
      if (!promisedDate || !endDate) {
        throw new Error("Please enter promised date and actual / end date.");
      }
      if (!(effectiveSpread >= 0)) {
        throw new Error("State RERA spread is invalid.");
      }
      if (overrideMclr && !(Number(manualMclr) > 0)) {
        throw new Error("Manual MCLR override must be greater than zero.");
      }

      const payments = paymentsForCalc();
      const validPayments = payments.filter((p) => Number(p.amount) > 0 && p.date);
      if (validPayments.length === 0) {
        throw new Error(
          effectiveInputMode === "amount"
            ? "Enter the amount paid."
            : "Add at least one installment with amount and payment date."
        );
      }

      if (!spreadRule) {
        throw new Error(`No spread config found for ${state?.short || stateId}.`);
      }

      const report = calculateReraInterest({
        calcType: CALC_TYPE,
        stateId,
        method: interestMethod,
        spreadPct: effectiveSpread,
        useDynamicMclr: !overrideMclr,
        annualRatePct: overrideMclr ? Number(manualMclr) + effectiveSpread : undefined,
        promisedDate,
        endDate,
        payments: validPayments,
      });

      const templateData = {
        complainantName,
        complainantAddress,
        complainantContact,
        promoterName,
        promoterAddress,
        projectName,
        reraRegNo,
        bookingDate,
        agreementDate,
        amountPaid: formatINR(report.principal),
        promisedDate,
        endDate,
        delayDays: formatNumber(report.delayDays),
        interestAmount: formatINR(report.interest),
        interestRate: report.annualRatePct.toFixed(2),
        totalClaim: formatINR(report.total)
      };

      const standardText = getFormMTemplate(stateId, templateData, language);
      setEditorText(standardText);

      setResult({ ...report, stateName: state.name, formMText: standardText });
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (err) {
      setError(err.message || "Calculation failed.");
    } finally {
      setCalcLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isBreakdownUnlocked) {
      setTargetPaymentPlan("breakdown");
      setPaymentModalOpen(true);
      return;
    }
    window.print();
  };

  const handleDownloadWord = () => {
    if (!editorText) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isFormMUnlocked) {
      setTargetPaymentPlan("form_m");
      setPaymentModalOpen(true);
      return;
    }
    const cleanState = (state?.short || "rera").toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadAsWord(`${cleanState}_form_m_complaint.doc`, editorText);
  };

  const handleDownloadPDF = () => {
    if (!editorText) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isFormMUnlocked) {
      setTargetPaymentPlan("form_m");
      setPaymentModalOpen(true);
      return;
    }
    const cleanState = (state?.short || "rera").toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadAsPDF(`${cleanState}_form_m_complaint.pdf`, editorText);
  };

  const handleCopyEditorText = async () => {
    if (!editorText) return;
    await navigator.clipboard.writeText(editorText);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `${result.stateName} RERA estimate — Principal ${formatINR(result.principal)}, Interest ${formatINR(result.interest)}, Total ${formatINR(result.total)} (${result.delayDays} days delay).`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "RERA Interest Report", text });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(text);
    alert("Report summary copied to clipboard.");
  };

  return (
    <div className="rera-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">{translate("hero_eyebrow", language)}</p>
          <h1>{state?.short || "RERA"} {translate("hero_title", language)}</h1>
          <p className="hero-lead">
            {translate("hero_lead", language)}
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-accent" onClick={scrollToCalc}>
              {translate("btn_start", language)}
            </button>
            <Link className="btn btn-ghost" to="/">
              {translate("btn_change_state", language)}
            </Link>
            <a className="btn btn-ghost" href="#faq">
              {translate("btn_faq", language)}
            </a>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="section calculator-section" id="calculator" ref={calcRef}>
        <div className="section-inner">
          <p className="eyebrow">{translate("hero_eyebrow", language)}</p>
          <h2>{translate("form_title", language)}</h2>
          <p className="section-lead">
            {translate("form_lead", language)}
          </p>

          <form className="calc-panel" onSubmit={handleCalculate}>
            {ENABLE_INSTALLMENTS_SCHEDULE && (
              <div className="toggle-row">
                <div>
                  <span className="field-label">{translate("input_mode", language)}</span>
                  <div className="segmented">
                    <button
                      type="button"
                      className={inputMode === "amount" ? "active" : ""}
                      onClick={() => setInputMode("amount")}
                    >
                      {translate("mode_amount", language)}
                    </button>
                    <button
                      type="button"
                      className={inputMode === "installments" ? "active" : ""}
                      onClick={() => setInputMode("installments")}
                    >
                      {translate("mode_installments", language)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <label className="field">
              <span className="field-label">{translate("state_rules", language)}</span>
              <select value={stateId} onChange={(e) => changeState(e.target.value)}>
                {APPLICABLE_RERA_STATES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <p className="rule-banner">
              <Building2 size={16} />
              <span>{stateRuleText}</span>
            </p>

            {effectiveInputMode === "amount" ? (
              <label className="field">
                <span className="field-label">{translate("amount_paid", language)}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="e.g. 5000000"
                  required
                />
              </label>
            ) : (
              <div className="installments">
                <div className="installments-head">
                  <h4>Add payment milestone</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addInstallment}>
                    <Plus size={14} /> Add installment
                  </button>
                </div>
                <div className="installment-list">
                  {installments.map((row, idx) => (
                    <div key={row.id} className="installment-row">
                      <label>
                        Amount (₹)
                        <input
                          type="number"
                          min="0"
                          value={row.amount}
                          onChange={(e) => updateInstallment(row.id, "amount", e.target.value)}
                          placeholder="e.g. 1000000"
                        />
                      </label>
                      <label>
                        Payment date
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateInstallment(row.id, "date", e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeInstallment(row.id)}
                        aria-label={`Remove installment ${idx + 1}`}
                        disabled={installments.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field-grid">
              <label className="field">
                <span className="field-label">{translate("promised_date", language)}</span>
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">{translate("actual_date", language)}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={promisedDate || undefined}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">{translate("rera_spread", language)}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={String(effectiveSpread)}
                  readOnly
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">{translate("latest_mclr", language)}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overrideMclr ? manualMclr : String(latestMclr ?? "")}
                  onChange={(e) => setManualMclr(e.target.value)}
                  readOnly={!overrideMclr}
                  required={overrideMclr}
                />
              </label>
            </div>

            <label className="check-row">
              <input
                type="checkbox"
                checked={overrideMclr}
                onChange={(e) => setOverrideMclr(e.target.checked)}
              />
              {translate("override_mclr", language)}
            </label>

            <div className="rate-strip">
              <strong>
                {overrideMclr
                  ? `${translate("fixed_rate", language)} ${(Number(manualMclr) + effectiveSpread).toFixed(2)}%`
                  : `${translate("dynamic_rate", language)} ${effectiveSpread.toFixed(2)}% ${translate("spread_label", language)} (${methodLabel(interestMethod)})`}
              </strong>
              <span>
                {overrideMclr
                  ? "Single rate applied across the full delay."
                  : `MCLR and state spread are resolved per date segment. Current config: +${effectiveSpread}% from ${spreadRule?.applicableFrom || "—"} ${spreadRule?.applicableTo ? `to ${spreadRule.applicableTo}` : "(open-ended)"}. Latest MCLR ${Number(latestMclr || 0).toFixed(2)}% (illustrative today ≈ ${illustrativeRate.toFixed(2)}%).`}
                {" "}
                Spread source:{" "}
                {spreadRule?.sourceUrl ? (
                  <a href={spreadRule.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#5eead4" }}>
                    {spreadRule.source}
                  </a>
                ) : (
                  spreadRule?.source || "—"
                )}
                {" · MCLR "}
                <a href={SBI_MCLR_SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: "#5eead4" }}>
                  sbi.bank.in
                </a>
                {mclrMeta.live ? " · live refresh" : " · bundled"}
              </span>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn btn-accent btn-lg" disabled={calcLoading}>
              <Calculator size={18} />
              {calcLoading ? translate("btn_calculating", language) : translate("btn_calculate", language)}
            </button>
          </form>
        </div>
      </section>

      {/* Report */}
      <section className="section report-section" id="report" ref={reportRef}>
        <div className="section-inner">
          <div className="report-panel">
            <div className="report-head">
              <div>
                <p className="eyebrow">{translate("report_title", language)}</p>
                <h2>{result?.stateName || state.name}</h2>
                <p className="muted">{translate("report_subtitle", language)}</p>
              </div>
              {result && (
                <div className="report-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleShare}>
                    <Share2 size={14} /> {translate("btn_share", language)}
                  </button>
                  {/* Print / Download Report button gated behind ₹29 access */}
                  {!user ? (
                    <button
                      type="button"
                      className="btn btn-paywall btn-sm"
                      onClick={() => setAuthModalOpen(true)}
                    >
                      <LogIn size={14} /> Print Report (₹29)
                    </button>
                  ) : !isBreakdownUnlocked ? (
                    <button
                      type="button"
                      className="btn btn-paywall btn-sm"
                      onClick={() => {
                        setTargetPaymentPlan("breakdown");
                        setPaymentModalOpen(true);
                      }}
                    >
                      <Lock size={14} /> Unlock Report (₹29)
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrintReport}>
                      <Printer size={14} /> {translate("btn_print", language)}
                    </button>
                  )}
                </div>
              )}
            </div>

            {result ? (
              <>
                <div className="stat-grid">
                  <div className="stat">
                    <span>{translate("stat_principal", language)}</span>
                    <strong>{formatINR(result.principal)}</strong>
                  </div>
                  <div className="stat">
                    <span>{translate("stat_interest", language)}</span>
                    <strong className="accent">{formatINR(result.interest)}</strong>
                  </div>
                  <div className="stat">
                    <span>{translate("stat_total", language)}</span>
                    <strong>{formatINR(result.total)}</strong>
                  </div>
                  <div className="stat">
                    <span>{translate("stat_delay", language)}</span>
                    <strong>{formatNumber(result.delayDays)} {translate("stat_days", language)}</strong>
                  </div>
                </div>

                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h3>{translate("analytics_title", language)}</h3>
                    <div className="share-bar" aria-hidden="true">
                      <div style={{ width: `${Math.min(100, 100 - result.interestShare)}%` }} className="share-principal" />
                      <div style={{ width: `${Math.min(100, result.interestShare)}%` }} className="share-interest" />
                    </div>
                    <div className="share-legend">
                      <span>{translate("principal_share", language)} {(100 - result.interestShare).toFixed(1)}%</span>
                      <span>{translate("interest_share", language)} {result.interestShare.toFixed(1)}%</span>
                    </div>
                    <div className="mini-stats">
                      <div>
                        <span>{translate("daily_rate", language)}</span>
                        <strong>{result.dailyRate.toFixed(3)}%</strong>
                      </div>
                      <div>
                        <span>{translate("monthly_accrual", language)}</span>
                        <strong>{formatINR(result.monthlyAccrual)}</strong>
                      </div>
                      <div>
                        <span>{translate("avg_daily_interest", language)}</span>
                        <strong>{formatINR(result.avgDailyInterest)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <InterestTrendChart rows={result.rows} language={language} />

                <ReportBreakdown result={result} />

                {ENABLE_RERA_FORM_M_DRAFT && (
                  <div className="formm-workspace">
                    <div className="workspace-head">
                      <p className="eyebrow">{translate("workspace_eyebrow", language)}</p>
                      <h2>{translate("workspace_title", language)}</h2>
                      <p className="muted">
                        {translate("workspace_lead", language)}
                      </p>
                    </div>

                    {/* Unlocked banner if user has access */}
                    {(isFormMUnlocked || isBreakdownUnlocked) && (
                      <div className="unlocked-banner">
                        <Sparkles size={16} />
                        <span>
                          Unlimited edits & downloads unlocked for RERA ID: <strong>{currentReraId}</strong>
                        </span>
                      </div>
                    )}

                    {/* Form fields for pre-filling */}
                    <div className="formm-details-card">
                      <h3>{translate("section_edit_details", language)}</h3>
                      <div className="formm-details-grid">
                        <label className="field">
                          <span className="field-label">{translate("label_cname", language)}</span>
                          <input
                            type="text"
                            value={complainantName}
                            onChange={(e) => setComplainantName(e.target.value)}
                            placeholder="e.g. Amit Thakur"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_caddress", language)}</span>
                          <input
                            type="text"
                            value={complainantAddress}
                            onChange={(e) => setComplainantAddress(e.target.value)}
                            placeholder="e.g. Flat 302, Green Glen Layout, Bengaluru"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_ccontact", language)}</span>
                          <input
                            type="text"
                            value={complainantContact}
                            onChange={(e) => setComplainantContact(e.target.value)}
                            placeholder="e.g. amit@gmail.com / 9876543210"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_pname", language)}</span>
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g. Prestige Lakeside Habitat"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_promoter", language)}</span>
                          <input
                            type="text"
                            value={promoterName}
                            onChange={(e) => setPromoterName(e.target.value)}
                            placeholder="e.g. Prestige Developers Ltd"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_promoter_addr", language)}</span>
                          <input
                            type="text"
                            value={promoterAddress}
                            onChange={(e) => setPromoterAddress(e.target.value)}
                            placeholder="e.g. MG Road, Bengaluru"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_reg_no", language)}</span>
                          <input
                            type="text"
                            value={reraRegNo}
                            onChange={(e) => setReraRegNo(e.target.value)}
                            placeholder="e.g. PRM/KA/RERA/1251/..."
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_booking_date", language)}</span>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">{translate("label_agreement_date", language)}</span>
                          <input
                            type="date"
                            value={agreementDate}
                            onChange={(e) => setAgreementDate(e.target.value)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Document Workspace Panel */}
                    <div className="editor-panel">
                      <div className="editor-head">
                        <h3>{translate("section_workspace", language)}</h3>
                      </div>

                      <div className="editor-container">
                        {!isFormMUnlocked ? (
                          <div
                            className="document-preview-wrapper"
                            onCopy={(e) => e.preventDefault()}
                            onContextMenu={(e) => e.preventDefault()}
                            onSelectStart={(e) => e.preventDefault()}
                          >
                            <div className="preview-overlay-tag">
                              <Lock size={13} /> Standard Preview Mode (Non-copyable & Blurred)
                            </div>
                            <div className="document-preview-locked">
                              <div className="preview-text-clear">
                                {editorText.split('\n').slice(0, 14).join('\n')}
                              </div>
                              <div className="preview-text-blurred" aria-hidden="true">
                                {editorText.split('\n').slice(14).join('\n')}
                              </div>
                              <div className="preview-blur-overlay">
                                <Lock size={24} className="blur-overlay-icon" />
                                <h4>Form M Litigation Text Locked</h4>
                                <p>Unlock Form M Litigation to unblur full legal clauses, enable live text editing, and export as Word or PDF.</p>
                                <button
                                  type="button"
                                  className="btn btn-accent btn-sm"
                                  onClick={() => {
                                    if (!user) {
                                      setAuthModalOpen(true);
                                    } else {
                                      setTargetPaymentPlan("form_m");
                                      setPaymentModalOpen(true);
                                    }
                                  }}
                                >
                                  {!user ? (
                                    <><LogIn size={14} /> Sign in to Unlock</>
                                  ) : (
                                    <><Crown size={14} /> {isBreakdownUnlocked ? "Upgrade ₹20" : "Unlock ₹49"}</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            className="document-textarea"
                            value={editorText}
                            onChange={(e) => setEditorText(e.target.value)}
                            rows={18}
                            placeholder={translate("placeholder_editor", language)}
                          />
                        )}
                      </div>

                      {/* Export Section */}
                      <div className="editor-actions">
                        {/* Word download — gated behind login + Form M access (₹49) */}
                        {!user ? (
                          <button
                            type="button"
                            className="btn btn-paywall btn-sm"
                            onClick={() => setAuthModalOpen(true)}
                            title="Sign in to download"
                          >
                            <LogIn size={14} />
                            {translate("btn_download_word", language)} (₹49)
                          </button>
                        ) : !isFormMUnlocked ? (
                          <button
                            type="button"
                            className="btn btn-paywall btn-sm"
                            onClick={() => {
                              setTargetPaymentPlan("form_m");
                              setPaymentModalOpen(true);
                            }}
                            title="Unlock Form M Litigation to download"
                          >
                            <Lock size={14} />
                            {translate("btn_download_word", language)} ({isBreakdownUnlocked ? "₹20 upgrade" : "₹49"})
                          </button>
                        ) : (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadWord}>
                            {translate("btn_download_word", language)}
                          </button>
                        )}

                        {/* PDF download — gated behind login + Form M access (₹49) */}
                        {!user ? (
                          <button
                            type="button"
                            className="btn btn-paywall btn-sm"
                            onClick={() => setAuthModalOpen(true)}
                            title="Sign in to download"
                          >
                            <LogIn size={14} />
                            {translate("btn_download_pdf", language)} (₹49)
                          </button>
                        ) : !isFormMUnlocked ? (
                          <button
                            type="button"
                            className="btn btn-paywall btn-sm"
                            onClick={() => {
                              setTargetPaymentPlan("form_m");
                              setPaymentModalOpen(true);
                            }}
                            title="Unlock Form M Litigation to download"
                          >
                            <Lock size={14} />
                            {translate("btn_download_pdf", language)} ({isBreakdownUnlocked ? "₹20 upgrade" : "₹49"})
                          </button>
                        ) : (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>
                            {translate("btn_download_pdf", language)}
                          </button>
                        )}
                      </div>

                      {/* Upsell Banner */}
                      {!isFormMUnlocked && (
                        <div className="paywall-banner">
                          <Crown size={15} className="paywall-banner-icon" />
                          <p>
                            {!user
                              ? 'Sign in to unlock Form M Litigation (₹49) or Breakdown Report (₹29).'
                              : isBreakdownUnlocked
                              ? 'Upgrade to Form M Litigation for ₹20 to download Word & PDF legal complaints.'
                              : 'Unlock Form M Litigation (₹49 - includes Breakdown Report) for unlimited edits & downloads for this RERA ID.'}
                          </p>
                          <button
                            type="button"
                            className="btn btn-accent btn-sm"
                            onClick={() => {
                              if (!user) {
                                setAuthModalOpen(true);
                              } else {
                                setTargetPaymentPlan("form_m");
                                setPaymentModalOpen(true);
                              }
                            }}
                          >
                            {!user ? (
                              <><LogIn size={13} /> Sign in</>
                            ) : isBreakdownUnlocked ? (
                              <><Crown size={13} /> Upgrade ₹20</>
                            ) : (
                              <><Crown size={13} /> Unlock ₹49</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="disclaimer-inline">
                  {translate("disclaimer", language)}
                </p>
                <p className="methodology">
                  <strong>{translate("methodology_title", language)}</strong>{" "}
                  {result.dynamicMclr
                    ? translate("methodology_dynamic", language)
                    : translate("methodology_fixed", language)}{" "}
                  {translate("methodology_spreads", language)}{" "}
                  <code>src/data/stateSpreads/</code>. {translate("methodology_mclr", language)}{" "}
                  <a href={SBI_MCLR_SOURCE_URL} target="_blank" rel="noreferrer">
                    SBI MCLR historical data
                  </a>
                  .
                </p>
              </>
            ) : (
              <div className="report-empty">
                <Calculator size={28} />
                <p>
                  {language === "hi"
                    ? "गणना करने के बाद आपकी रेरा ब्याज रिपोर्ट यहां दिखाई देगी।"
                    : language === "mr"
                    ? "तुमचा रेरा व्याज अहवाल गणना केल्यानंतर येथे दिसेल."
                    : language === "kn"
                    ? "ಲೆಕ್ಕಾಚಾರ ಮಾಡಿದ ನಂತರ ನಿಮ್ಮ ರೇರಾ ಬಡ್ಡಿ ವರದಿ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ."
                    : "Your RERA interest report will appear here after you calculate."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section" id="faq">
        <div className="section-inner">
          <p className="eyebrow">{translate("faq_eyebrow", language)}</p>
          <h2>{translate("faq_title", language)}</h2>
          <p className="section-lead">{getFaqByLanguage(language).length} {translate("faq_subtitle", language)}</p>
          <div className="faq-list">
            {getFaqByLanguage(language).map((item) => {
              const open = openFaq === item.id;
              return (
                <div key={item.id} className={`faq-item ${open ? "open" : ""}`}>
                  <button
                     type="button"
                     className="faq-q"
                     onClick={() => setOpenFaq(open ? null : item.id)}
                     aria-expanded={open}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={18} />
                  </button>
                  {open && <p className="faq-a">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How-to */}
      <section className="section howto-section" id="howto">
        <div className="section-inner narrow">
          <h2>{translate("howto_title", language)}</h2>
          <ol className="howto-steps">
            <li>
              {translate("howto_step1", language)}
            </li>
            <li>
              {translate("howto_step2", language)}
            </li>
            <li>
              {translate("howto_step3", language)}
            </li>
            <li>
              {translate("howto_step4", language)}
            </li>
          </ol>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-inner">
          <div className="footer-brand">
            <strong>RERA Hub</strong>
            <p>
              {translate("footer_desc", language)}
            </p>
          </div>
          <p className="footer-disclaimer">
            {translate("footer_disclaimer", language)}
          </p>
        </div>
      </footer>

      {/* Auth & Payment Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          setPaymentModalOpen(true);
        }}
      />
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => setPaymentModalOpen(false)}
        defaultPlan={targetPaymentPlan}
        initialReraId={currentReraId}
      />
    </div>
  );
}
