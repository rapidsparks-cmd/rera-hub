import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Calculator,
  Check,
  ChevronDown,
  Copy,
  Plus,
  Printer,
  Share2,
  Trash2,
} from "lucide-react";
import {
  APPLICABLE_RERA_STATES,
  SBI_MCLR_SOURCE_URL,
  getStateById,
  methodLabel,
  ruleSummary,
} from "../data/reraStates";
import { RERA_FAQ } from "../data/faq";
import { calculateReraInterest, formatINR, formatNumber } from "../utils/reraInterest";
import {
  getCurrentHighestMclr,
  getMclrMeta,
  refreshMclrFromSbi,
} from "../services/mclrService";
import { getCurrentSpreadRule } from "../services/stateSpreadService";
import { geminiService } from "../services/geminiService";
import ProjectFetchPanel from "./ProjectFetchPanel";
import InterestTrendChart from "./InterestTrendChart";
import ReportBreakdown from "./ReportBreakdown";
import { getFormMTemplate } from "../utils/formMTemplates";
import { downloadAsPDF, downloadAsWord } from "../utils/downloadHelpers";

const ENABLE_RERA_PROJECT_FETCH = import.meta.env.VITE_ENABLE_RERA_PROJECT_FETCH !== "false";
const ENABLE_RERA_FORM_M_DRAFT = import.meta.env.VITE_ENABLE_RERA_FORM_M_DRAFT !== "false";
const ENABLE_INSTALLMENTS_SCHEDULE =
  import.meta.env.VITE_ENABLE_INSTALLMENTS_SCHEDULE !== "false";

const CALC_TYPE = "builder_delay";
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ReraDesk({ language = "en", stateId }) {
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
  const [draftFormM, setDraftFormM] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);

  // Form M details inputs
  const [complainantName, setComplainantName] = useState("");
  const [complainantAddress, setComplainantAddress] = useState("");
  const [complainantContact, setComplainantContact] = useState("");
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
  const [openFaq, setOpenFaq] = useState(RERA_FAQ[0]?.id || null);
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

  // Auto-regenerate template draft if inputs or result change
  useEffect(() => {
    if (result) {
      const templateData = {
        complainantName,
        complainantAddress,
        complainantContact,
        promoterName: promoterName || projectDetails?.promoter || "",
        promoterAddress,
        projectName: projectDetails?.projectName || "",
        reraRegNo: reraRegNo || projectDetails?.regNo || "",
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
      const text = getFormMTemplate(stateId, templateData);
      setEditorText(text);
    }
  }, [
    result,
    stateId,
    complainantName,
    complainantAddress,
    complainantContact,
    promoterName,
    promoterAddress,
    reraRegNo,
    bookingDate,
    agreementDate,
    projectDetails,
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
      // Builder delay: treat lump sum as outstanding from promised date.
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
        promoterName: promoterName || projectDetails?.promoter || "",
        promoterAddress,
        projectName: projectDetails?.projectName || "",
        reraRegNo: reraRegNo || projectDetails?.regNo || "",
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

      const standardText = getFormMTemplate(stateId, templateData);
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

  const handleDownloadWord = () => {
    if (!editorText) return;
    const cleanState = (state?.short || "rera").toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadAsWord(`${cleanState}_form_m_complaint.doc`, editorText);
  };

  const handleDownloadPDF = () => {
    if (!editorText) return;
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

  const handlePrint = () => window.print();

  const onProjectLoaded = (details) => {
    setProjectDetails(details);
    if (details?.completionDate?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setPromisedDate(details.completionDate);
    }
    if (details?.promoter) setPromoterName(details.promoter);
    if (details?.regNo) setReraRegNo(details.regNo);
  };

  return (
    <div className="rera-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Section 18 statutory interest compliant</p>
          <h1>{state?.short || "RERA"} compensation calculator</h1>
          <p className="hero-lead">
            Instantly estimate your RERA compensation for {state?.name || "your state"} — statutory
            interest, refund amounts, and milestone payment delays under Section 18.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-accent" onClick={scrollToCalc}>
              Start calculator
            </button>
            <Link className="btn btn-ghost" to="/">
              Change state
            </Link>
            <a className="btn btn-ghost" href="#faq">
              Browse legal FAQ
            </a>
          </div>
        </div>
      </section>

      {ENABLE_RERA_PROJECT_FETCH && (
        <section className="section">
          <div className="section-inner">
            <ProjectFetchPanel onProjectLoaded={onProjectLoaded} />
          </div>
        </section>
      )}

      {/* Calculator */}
      <section className="section calculator-section" id="calculator" ref={calcRef}>
        <div className="section-inner">
          <p className="eyebrow">Statutory interest estimator</p>
          <h2>Calculate your RERA compensation.</h2>
          <p className="section-lead">
            Estimate interest receivable for delayed possession under Section 18, calibrated to
            state-specific SBI MCLR guidelines.
          </p>

          <form className="calc-panel" onSubmit={handleCalculate}>
            {ENABLE_INSTALLMENTS_SCHEDULE && (
              <div className="toggle-row">
                <div>
                  <span className="field-label">Input mode</span>
                  <div className="segmented">
                    <button
                      type="button"
                      className={inputMode === "amount" ? "active" : ""}
                      onClick={() => setInputMode("amount")}
                    >
                      Amount
                    </button>
                    <button
                      type="button"
                      className={inputMode === "installments" ? "active" : ""}
                      onClick={() => setInputMode("installments")}
                    >
                      Installments schedule
                    </button>
                  </div>
                </div>
              </div>
            )}

            <label className="field">
              <span className="field-label">State authority / rules</span>
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
                <span className="field-label">Amount paid (₹)</span>
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
                <span className="field-label">Promised date</span>
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Actual / end date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={promisedDate || undefined}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">RERA spread (%) from state config</span>
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
                <span className="field-label">Latest SBI highest MCLR (%)</span>
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
              Override with a fixed MCLR (disable period-wise dynamic rates)
            </label>

            <div className="rate-strip">
              <strong>
                {overrideMclr
                  ? `Fixed effective rate: ${(Number(manualMclr) + effectiveSpread).toFixed(2)}%`
                  : `Dynamic MCLR + dated ${effectiveSpread.toFixed(2)}% spread (${methodLabel(interestMethod)})`}
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
              {calcLoading ? "Calculating…" : "Calculate now"}
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
                <p className="eyebrow">RERA interest calculation report</p>
                <h2>{result?.stateName || state.name}</h2>
                <p className="muted">Generated by RERA Hub penalty calculator</p>
              </div>
              {result && (
                <div className="report-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleShare}>
                    <Share2 size={14} /> Share
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint}>
                    <Printer size={14} /> Print report
                  </button>
                </div>
              )}
            </div>

            {result ? (
              <>
                <div className="stat-grid">
                  <div className="stat">
                    <span>Principal amount</span>
                    <strong>{formatINR(result.principal)}</strong>
                  </div>
                  <div className="stat">
                    <span>Interest accrued</span>
                    <strong className="accent">{formatINR(result.interest)}</strong>
                  </div>
                  <div className="stat">
                    <span>Total payout</span>
                    <strong>{formatINR(result.total)}</strong>
                  </div>
                  <div className="stat">
                    <span>Delay period</span>
                    <strong>{formatNumber(result.delayDays)} days</strong>
                  </div>
                </div>

                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h3>Financial analytics</h3>
                    <div className="share-bar" aria-hidden="true">
                      <div style={{ width: `${Math.min(100, 100 - result.interestShare)}%` }} className="share-principal" />
                      <div style={{ width: `${Math.min(100, result.interestShare)}%` }} className="share-interest" />
                    </div>
                    <div className="share-legend">
                      <span>Principal share {(100 - result.interestShare).toFixed(1)}%</span>
                      <span>Interest share {result.interestShare.toFixed(1)}%</span>
                    </div>
                    <div className="mini-stats">
                      <div>
                        <span>Daily rate</span>
                        <strong>{result.dailyRate.toFixed(3)}%</strong>
                      </div>
                      <div>
                        <span>Monthly accrual</span>
                        <strong>{formatINR(result.monthlyAccrual)}</strong>
                      </div>
                      <div>
                        <span>Avg daily interest</span>
                        <strong>{formatINR(result.avgDailyInterest)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <InterestTrendChart rows={result.rows} />

                <ReportBreakdown result={result} />

                {ENABLE_RERA_FORM_M_DRAFT && (
                  <div className="formm-workspace">
                    <div className="workspace-head">
                      <p className="eyebrow">Interactive Legal Assistant</p>
                      <h2>Prepare RERA Complaint (Form M)</h2>
                      <p className="muted">
                        Pre-fill your official state complaint petition below, edit details, and export directly.
                      </p>
                    </div>

                    {/* Form fields for pre-filling */}
                    <div className="formm-details-card">
                      <h3>1. Edit Petition Details</h3>
                      <div className="formm-details-grid">
                        <label className="field">
                          <span className="field-label">Complainant Name</span>
                          <input
                            type="text"
                            value={complainantName}
                            onChange={(e) => setComplainantName(e.target.value)}
                            placeholder="e.g. Amit Thakur"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Complainant Address</span>
                          <input
                            type="text"
                            value={complainantAddress}
                            onChange={(e) => setComplainantAddress(e.target.value)}
                            placeholder="e.g. Flat 302, Green Glen Layout, Bengaluru"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Complainant Contact (Email / Phone)</span>
                          <input
                            type="text"
                            value={complainantContact}
                            onChange={(e) => setComplainantContact(e.target.value)}
                            placeholder="e.g. amit@gmail.com / 9876543210"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Promoter / Developer Name</span>
                          <input
                            type="text"
                            value={promoterName}
                            onChange={(e) => setPromoterName(e.target.value)}
                            placeholder="e.g. Prestige Developers Ltd"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Promoter Address</span>
                          <input
                            type="text"
                            value={promoterAddress}
                            onChange={(e) => setPromoterAddress(e.target.value)}
                            placeholder="e.g. MG Road, Bengaluru"
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">RERA Registration No.</span>
                          <input
                            type="text"
                            value={reraRegNo}
                            onChange={(e) => setReraRegNo(e.target.value)}
                            placeholder="e.g. PRM/KA/RERA/1251/..."
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Booking Date</span>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Agreement for Sale Date</span>
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
                        <h3>2. Complaint Draft Workspace</h3>
                      </div>

                      <div className="editor-container">
                        <textarea
                          className="document-textarea"
                          value={editorText}
                          onChange={(e) => setEditorText(e.target.value)}
                          rows={18}
                          placeholder="Draft content will appear here..."
                        />
                      </div>

                      {/* Export Section */}
                      <div className="editor-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadWord}>
                          Download Word (.doc)
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>
                          Download PDF (.pdf)
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopyEditorText}>
                          {copying ? <Check size={14} /> : <Copy size={14} />}
                          {copying ? "Copied" : "Copy to Clipboard"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="disclaimer-inline">
                  This report is for informational purposes only. Consult a legal professional for
                  official RERA filings.
                </p>
                <p className="methodology">
                  <strong>Methodology note:</strong>{" "}
                  {result.dynamicMclr
                    ? "By default this calculator applies SBI highest MCLR and the dated state spread config for each segment of the delay. Weighted-average rate is shown for reference."
                    : "A fixed MCLR override was used across the full delay period."}{" "}
                  State spreads come from curated files in{" "}
                  <code>src/data/stateSpreads/</code>. MCLR sourced from{" "}
                  <a href={SBI_MCLR_SOURCE_URL} target="_blank" rel="noreferrer">
                    SBI MCLR historical data
                  </a>
                  .
                </p>
              </>
            ) : (
              <div className="report-empty">
                <Calculator size={28} />
                <p>Your RERA interest report will appear here after you calculate.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section" id="faq">
        <div className="section-inner">
          <p className="eyebrow">RERA legal FAQ</p>
          <h2>Expert answers to central &amp; state RERA questions</h2>
          <p className="section-lead">{RERA_FAQ.length} topics · informative only, not legal advice</p>
          <div className="faq-list">
            {RERA_FAQ.map((item) => {
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
          <h2>How to calculate your RERA delayed-possession interest</h2>
          <ol className="howto-steps">
            <li>
              <strong>Choose your state</strong> — each authority sets its own interest formula
              (simple vs monthly compound, and the MCLR spread).
            </li>
            <li>
              <strong>Enter key dates</strong> — promised possession and actual/end date define the
              delay window.
            </li>
            <li>
              <strong>Enter the amount paid</strong> — the principal on which Section 18 delay
              interest is estimated for the possession delay window.
            </li>
            <li>
              <strong>Review the report</strong> — principal, interest, delay days, and a printable
              breakdown for your complaint file.
            </li>
          </ol>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-inner">
          <div className="footer-brand">
            <strong>RERA Hub</strong>
            <p>
              An interactive statutory interest estimator for homebuyers under the Real Estate
              (Regulation and Development) Act, 2016.
            </p>
          </div>
          <p className="footer-disclaimer">
            <strong>Disclaimer:</strong> Estimates only, based on Section 18/19-style SBI MCLR +
            spread rules. Actual awards are decided by the State RERA Authority / Adjudicating
            Officer after reviewing case facts. Verify current SBI MCLR at{" "}
            <a href="https://sbi.co.in" target="_blank" rel="noreferrer">
              sbi.co.in
            </a>
            . Not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
