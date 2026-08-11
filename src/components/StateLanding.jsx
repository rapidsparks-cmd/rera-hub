import { useNavigate } from "react-router-dom";
import { Scale, Calculator, ArrowRight } from "lucide-react";
import { MOHUA_RERA_DIRECTORY_URL } from "../data/reraStates";

export default function StateLanding() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <div className="landing-backdrop" aria-hidden="true" />
      <div className="landing-modal landing-modal-large" role="dialog" aria-labelledby="landing-title" aria-modal="true">
        <p className="eyebrow">RERA Hub Platform</p>
        <h1 id="landing-title">Select a Service</h1>
        <p className="landing-lead">
          Choose whether you need 1-on-1 expert legal advice from senior RERA advocates or want to calculate Section 18 delay interest.
        </p>

        {/* 2 Landing Cards Selection ONLY */}
        <div className="landing-options-grid" style={{ marginTop: 24 }}>
          {/* Card 1: Expert Legal Advice */}
          <div
            className="option-card"
            onClick={() => navigate("/expert-legal-advice")}
            role="button"
            tabIndex={0}
          >
            <div>
              <div className="option-badge">
                <Scale size={14} /> Legal Support
              </div>
              <h3>Expert Legal Advice</h3>
              <p>
                Connect 1-on-1 with senior RERA Advocates for Form M legal review, builder delay recovery & consultation.
              </p>
            </div>
            <div className="option-action">
              <span>View Verified Lawyer & Unlock</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 2: RERA Interest Calculator */}
          <div
            className="option-card"
            onClick={() => navigate("/select-state")}
            role="button"
            tabIndex={0}
          >
            <div>
              <div className="option-badge badge-teal">
                <Calculator size={14} /> Calculator
              </div>
              <h3>RERA Interest Calculator</h3>
              <p>
                Calculate Section 18 builder delay compensation & statutory interest across all applicable Indian states.
              </p>
            </div>
            <div className="option-action">
              <span>Select State & Calculate</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        <p className="landing-note" style={{ marginTop: 32 }}>
          Only States/UTs listed by the Ministry of Housing and Urban Affairs (MoHUA) with an
          operational RERA portal are supported. Source:{" "}
          <a href={MOHUA_RERA_DIRECTORY_URL} target="_blank" rel="noreferrer">
            MoHUA RERA Authorities directory
          </a>
          .
        </p>
      </div>
    </div>
  );
}
