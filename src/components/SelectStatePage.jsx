import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Scale, ArrowRight, ArrowLeft } from "lucide-react";
import {
  APPLICABLE_RERA_STATES,
  MOHUA_RERA_DIRECTORY_URL,
  methodLabel,
} from "../data/reraStates";
import { getCurrentHighestMclr, refreshMclrFromSbi } from "../services/mclrService";
import { getCurrentSpreadRule } from "../services/stateSpreadService";

export default function SelectStatePage() {
  const navigate = useNavigate();
  const [stateId, setStateId] = useState("");
  const [error, setError] = useState("");
  const [latestMclr, setLatestMclr] = useState(() => getCurrentHighestMclr());

  useEffect(() => {
    refreshMclrFromSbi().then((meta) => {
      if (meta.latestHighest != null) setLatestMclr(meta.latestHighest);
    });
  }, []);

  const selected = APPLICABLE_RERA_STATES.find((s) => s.id === stateId);
  const selectedSpread = stateId ? getCurrentSpreadRule(stateId) : null;

  const handleContinue = (e) => {
    e.preventDefault();
    if (!stateId) {
      setError("Please select your project’s RERA state to continue.");
      return;
    }
    navigate(`/calculator/${stateId}`);
  };

  return (
    <div className="landing">
      <div className="landing-backdrop" aria-hidden="true" />
      <div className="landing-modal" role="dialog" aria-labelledby="state-page-title" aria-modal="true" style={{ maxWidth: 640 }}>
        {/* Back Link */}
        <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
          <ArrowLeft size={14} /> Back to Services
        </Link>

        <p className="eyebrow">RERA Interest Calculator</p>
        <h1 id="state-page-title">Select your project state</h1>
        <p className="landing-lead">
          Interest formulas differ by state RERA authority. Choose where the project is registered
          to open the matching Section 18 calculator.
        </p>

        <form onSubmit={handleContinue} className="landing-form">
          <label className="field">
            <span className="field-label">State / RERA authority</span>
            <div className="select-wrap landing-select">
              <MapPin size={16} />
              <select
                value={stateId}
                onChange={(e) => {
                  setStateId(e.target.value);
                  setError("");
                }}
                required
              >
                <option value="" disabled>
                  Choose a RERA-applicable state…
                </option>
                {APPLICABLE_RERA_STATES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {selected && selectedSpread && (
            <div className="landing-preview">
              <strong>{selected.short}</strong>
              <span>
                {methodLabel(selectedSpread.method)} · SBI highest MCLR + {selectedSpread.spreadPct}%
                {latestMclr != null
                  ? ` (today ≈ ${(Number(latestMclr) + selectedSpread.spreadPct).toFixed(2)}%)`
                  : ""}
              </span>
              <p>
                Applicable from {selectedSpread.applicableFrom}
                {selectedSpread.applicableTo ? ` to ${selectedSpread.applicableTo}` : " (open-ended)"}
                {" · "}
                verified {selectedSpread.verifiedOn}
              </p>
              {selected.blurb && <p>{selected.blurb}</p>}
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-accent btn-lg w-full" disabled={!stateId}>
            Continue to {selected?.short || "RERA"} Calculator
          </button>
        </form>

        {/* Cross redirection box */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 10px 0' }}>
            Need 1-on-1 legal advice from verified advocates instead?
          </p>
          <Link to="/expert-legal-advice" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Scale size={14} /> Go to Expert Legal Advice <ArrowRight size={14} />
          </Link>
        </div>

        <p className="landing-note" style={{ marginTop: 20 }}>
          Only States/UTs listed by the Ministry of Housing and Urban Affairs (MoHUA) with an
          operational RERA portal are shown. Source:{" "}
          <a href={MOHUA_RERA_DIRECTORY_URL} target="_blank" rel="noreferrer">
            MoHUA RERA Authorities directory
          </a>
          .
        </p>
      </div>
    </div>
  );
}
