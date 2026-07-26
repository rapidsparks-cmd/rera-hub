import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import {
  APPLICABLE_RERA_STATES,
  MOHUA_RERA_DIRECTORY_URL,
  methodLabel,
} from "../data/reraStates";
import { getCurrentHighestMclr, refreshMclrFromSbi } from "../services/mclrService";
import { getCurrentSpreadRule } from "../services/stateSpreadService";

export default function StateLanding() {
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
      <div className="landing-modal" role="dialog" aria-labelledby="landing-title" aria-modal="true">
        <p className="eyebrow">RERA Hub</p>
        <h1 id="landing-title">Select your project state</h1>
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

          <button type="submit" className="btn btn-accent btn-lg" disabled={!stateId}>
            Continue to calculator
          </button>
        </form>

        <p className="landing-note">
          Only States/UTs listed by the Ministry of Housing and Urban Affairs (MoHUA) with an
          operational RERA portal are shown. Source:{" "}
          <a href={MOHUA_RERA_DIRECTORY_URL} target="_blank" rel="noreferrer">
            MoHUA RERA Authorities directory
          </a>
          . Excluded where MoHUA marks “Website Not Setup” (Arunachal Pradesh, Manipur, Mizoram,
          Nagaland, Sikkim, Ladakh).
        </p>
      </div>
    </div>
  );
}
