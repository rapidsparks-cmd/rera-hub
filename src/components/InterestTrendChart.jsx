import { useMemo, useRef, useState } from "react";
import { buildInterestTimeline } from "../utils/interestTimeline";
import { formatINR } from "../utils/reraInterest";
import { translate } from "../utils/translations";

const WIDTH = 760;
const HEIGHT = 340;
const PAD = { top: 32, right: 58, bottom: 48, left: 70 };

function parseISO(iso) {
  return new Date(`${iso}T00:00:00`).getTime();
}

function formatFriendlyDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatAxisMoney(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${Math.round(v)}`;
}

export default function InterestTrendChart({ rows, language = "en" }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const timeline = useMemo(() => buildInterestTimeline(rows), [rows]);
  const { interestPoints, rateSteps, rateChanges } = timeline;

  const finalInterest = interestPoints.at(-1)?.cumulativeInterest ?? 0;
  const rateCount = rateSteps.length;
  const changeCount = rateChanges.length;

  const geometry = useMemo(() => {
    if (interestPoints.length < 2 || rateSteps.length === 0) return null;

    const allDates = [
      ...interestPoints.map((p) => p.date),
      ...rateSteps.map((s) => s.from),
      ...rateSteps.map((s) => s.to),
    ];
    const xs = allDates.map(parseISO);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxInterest = Math.max(...interestPoints.map((p) => p.cumulativeInterest), 1);
    const rates = rateSteps.map((s) => Number(s.annualRate));
    const minRate = Math.min(...rates) - 0.4;
    const maxRate = Math.max(...rates) + 0.4;

    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const xScale = (t) => PAD.left + ((t - minX) / Math.max(maxX - minX, 1)) * innerW;
    const yInterest = (v) => PAD.top + innerH - (v / maxInterest) * innerH;
    const yRate = (v) =>
      PAD.top + innerH - ((v - minRate) / Math.max(maxRate - minRate, 0.1)) * innerH;

    const interestPlotted = interestPoints.map((p) => ({
      ...p,
      cx: xScale(parseISO(p.date)),
      cy: yInterest(p.cumulativeInterest),
      cyRate: yRate(Number(p.annualRate || minRate)),
    }));

    const ratePathParts = [];
    rateSteps.forEach((seg, i) => {
      const x0 = xScale(parseISO(seg.from));
      const x1 = xScale(parseISO(seg.to));
      const y = yRate(Number(seg.annualRate));
      if (i === 0) ratePathParts.push(`M ${x0.toFixed(2)} ${y.toFixed(2)}`);
      else ratePathParts.push(`L ${x0.toFixed(2)} ${y.toFixed(2)}`);
      ratePathParts.push(`L ${x1.toFixed(2)} ${y.toFixed(2)}`);
    });

    const interestLine = interestPlotted
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx.toFixed(2)} ${p.cy.toFixed(2)}`)
      .join(" ");

    const areaPath =
      interestPlotted.length > 0
        ? `${interestLine} L ${interestPlotted.at(-1).cx.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} L ${interestPlotted[0].cx.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} Z`
        : "";

    const interestTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      v: maxInterest * f,
      y: yInterest(maxInterest * f),
    }));

    const rateTickCount = 4;
    const rateTicks = Array.from({ length: rateTickCount + 1 }, (_, i) => {
      const v = minRate + ((maxRate - minRate) * i) / rateTickCount;
      return { v, y: yRate(v) };
    });

    const xTicks = [0, 0.33, 0.66, 1].map((f) => {
      const t = minX + (maxX - minX) * f;
      const nearest = interestPlotted.reduce((best, p) =>
        Math.abs(parseISO(p.date) - t) < Math.abs(parseISO(best.date) - t) ? p : best
      );
      return { x: nearest.cx, label: formatFriendlyDate(nearest.date) };
    });

    const changeMarkers = rateChanges.map((c) => ({
      ...c,
      cx: xScale(parseISO(c.date)),
      cy: yRate(c.toRate),
    }));

    return {
      interestPlotted,
      interestLine,
      areaPath,
      ratePath: ratePathParts.join(" "),
      interestTicks,
      rateTicks,
      xTicks,
      changeMarkers,
      rateSteps: rateSteps.map((seg) => ({
        ...seg,
        x0: xScale(parseISO(seg.from)),
        x1: xScale(parseISO(seg.to)),
        y: yRate(Number(seg.annualRate)),
      })),
      innerH,
    };
  }, [interestPoints, rateSteps, rateChanges]);

  if (!geometry) {
    return (
      <div className="chart-empty muted">
        {translate("chart_empty", language)}
      </div>
    );
  }

  const findHover = (clientX) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * WIDTH;

    const seg =
      geometry.rateSteps.find((s) => x >= s.x0 && x <= s.x1) ||
      geometry.rateSteps.reduce((best, s) => {
        const d = Math.min(Math.abs(x - s.x0), Math.abs(x - s.x1));
        const bd = Math.min(Math.abs(x - best.x0), Math.abs(x - best.x1));
        return d < bd ? s : best;
      });

    const pts = geometry.interestPlotted;
    let left = pts[0];
    let right = pts[pts.length - 1];
    for (let i = 0; i < pts.length - 1; i += 1) {
      if (x >= pts[i].cx && x <= pts[i + 1].cx) {
        left = pts[i];
        right = pts[i + 1];
        break;
      }
      if (x < pts[i].cx) {
        left = pts[Math.max(0, i - 1)];
        right = pts[i];
        break;
      }
    }
    const span = Math.max(right.cx - left.cx, 0.0001);
    const t = Math.min(1, Math.max(0, (x - left.cx) / span));
    const cumulativeInterest =
      left.cumulativeInterest + t * (right.cumulativeInterest - left.cumulativeInterest);
    const cx = left.cx + t * (right.cx - left.cx);
    const cy = left.cy + t * (right.cy - left.cy);

    return {
      cx,
      cy,
      cyRate: seg.y,
      cumulativeInterest,
      segmentInterest: seg.segmentInterest,
      mclr: seg.mclr,
      spread: seg.spread,
      annualRate: seg.annualRate,
      days: seg.days,
      from: seg.from,
      to: seg.to,
    };
  };

  const onMove = (evt) => setHover(findHover(evt.clientX));

  const tip = hover;
  const tipLeft = tip ? Math.min(Math.max(tip.cx + 14, 8), WIDTH - 240) : 0;
  const tipTop = tip ? Math.min(Math.max(tip.cy - 24, 8), HEIGHT - 150) : 0;

  // Avoid label clutter when many rate changes exist
  const markers = geometry.changeMarkers;
  const labeledChanges =
    markers.length <= 6
      ? markers
      : markers.filter((_, i) => i === 0 || i === markers.length - 1 || i % 2 === 0);

  return (
    <div className="interest-chart">
      <div className="chart-intro">
        <h3>{translate("chart_title", language)}</h3>
        <p>
          {translate("chart_lead", language)}
        </p>
        <p className="chart-hint">
          {translate("chart_hint", language)}
        </p>
      </div>

      <div className="chart-summary-pills">
        <div className="chart-pill pill-interest">
          <span>{translate("chart_total_interest", language)}</span>
          <strong>{formatINR(finalInterest)}</strong>
        </div>
        <div className="chart-pill">
          <span>{translate("chart_rate_periods", language)}</span>
          <strong>{rateCount}</strong>
        </div>
        <div className="chart-pill pill-rate">
          <span>{translate("chart_rate_changes", language)}</span>
          <strong>{changeCount}</strong>
        </div>
      </div>

      <div className="chart-legend">
        <span className="legend-item legend-interest">{translate("chart_legend_interest", language)}</span>
        <span className="legend-item legend-rate">{translate("chart_legend_rate", language)}</span>
        <span className="legend-item legend-change">{translate("chart_legend_change", language)}</span>
      </div>

      <div className="chart-frame">
        <div className="chart-canvas">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="chart-svg"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label="Chart showing how delay interest grows over time and when the interest rate changes"
          >
            <defs>
              <linearGradient id="interestFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" stopOpacity="0.28" />
                <stop offset="55%" stopColor="#0f766e" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0f766e" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="canvasWash" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ecf8f5" />
                <stop offset="100%" stopColor="#fff8f3" />
              </linearGradient>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0c1f1a" floodOpacity="0.08" />
              </filter>
            </defs>

            <rect
              x={PAD.left}
              y={PAD.top}
              width={WIDTH - PAD.left - PAD.right}
              height={geometry.innerH}
              rx="14"
              fill="url(#canvasWash)"
              className="chart-plot-bg"
            />

            {geometry.interestTicks.map((t) => (
              <g key={`yi-${t.v}`}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={t.y}
                  y2={t.y}
                  className="chart-grid"
                />
                <text x={PAD.left - 10} y={t.y + 4} textAnchor="end" className="chart-axis">
                  {formatAxisMoney(t.v)}
                </text>
              </g>
            ))}

            {geometry.rateTicks.map((t) => (
              <text
                key={`yr-${t.v}`}
                x={WIDTH - PAD.right + 10}
                y={t.y + 4}
                textAnchor="start"
                className="chart-axis chart-axis-rate"
              >
                {t.v.toFixed(1)}%
              </text>
            ))}

            {geometry.xTicks.map((t, i) => (
              <text key={`x-${i}`} x={t.x} y={HEIGHT - 14} textAnchor="middle" className="chart-axis">
                {t.label}
              </text>
            ))}

            {geometry.rateSteps.map((seg, i) => (
              <rect
                key={`band-${seg.from}-${i}`}
                x={seg.x0}
                y={PAD.top}
                width={Math.max(seg.x1 - seg.x0, 1)}
                height={geometry.innerH}
                className={i % 2 === 0 ? "rate-band even" : "rate-band odd"}
              />
            ))}

            <path d={geometry.areaPath} fill="url(#interestFill)" className="chart-area" />
            <path d={geometry.interestLine} className="chart-line" fill="none" filter="url(#softShadow)" />
            <path d={geometry.ratePath} className="chart-rate-line" fill="none" />

            {labeledChanges.map((m) => (
              <g key={`chg-${m.date}-${m.toRate}`}>
                <line
                  x1={m.cx}
                  x2={m.cx}
                  y1={PAD.top}
                  y2={PAD.top + geometry.innerH}
                  className="rate-change-line"
                />
                <circle cx={m.cx} cy={m.cy} r={5} className="rate-change-dot" />
                <rect
                  x={m.cx - 18}
                  y={Math.max(m.cy - 28, PAD.top + 4)}
                  width="36"
                  height="16"
                  rx="8"
                  className="rate-change-badge"
                />
                <text
                  x={m.cx}
                  y={Math.max(m.cy - 16, PAD.top + 16)}
                  textAnchor="middle"
                  className="rate-change-label"
                >
                  {m.toRate.toFixed(1)}%
                </text>
              </g>
            ))}

            {geometry.interestPlotted
              .filter((_, i, arr) => i === 0 || i === arr.length - 1 || arr[i].rateChanged)
              .map((p, i, arr) => (
                <circle
                  key={`ip-${p.date}-${p.cumulativeInterest}`}
                  cx={p.cx}
                  cy={p.cy}
                  r={i === arr.length - 1 ? 5 : 3.5}
                  className={i === arr.length - 1 ? "chart-dot end" : "chart-dot"}
                />
              ))}

            {hover && (
              <>
                <line
                  x1={hover.cx}
                  x2={hover.cx}
                  y1={PAD.top}
                  y2={PAD.top + geometry.innerH}
                  className="chart-crosshair"
                />
                <circle cx={hover.cx} cy={hover.cy} r={7} className="chart-dot-ring" />
                <circle cx={hover.cx} cy={hover.cyRate} r={6} className="rate-hover-dot" />
              </>
            )}

            <text x={PAD.left + 4} y={PAD.top - 10} className="chart-axis-title">
              {translate("chart_axis_interest", language)}
            </text>
            <text
              x={WIDTH - PAD.right - 4}
              y={PAD.top - 10}
              textAnchor="end"
              className="chart-axis-title chart-axis-rate"
            >
              {translate("chart_axis_rate", language)}
            </text>
          </svg>
        </div>

        {tip ? (
          <div className="chart-tooltip friendly" style={{ left: tipLeft, top: tipTop }}>
            <strong>
              {formatFriendlyDate(tip.from)} – {formatFriendlyDate(tip.to)}
            </strong>
            <div className="tip-block">
              <span className="tip-label">{translate("chart_tip_rate_title", language)}</span>
              <span className="tip-value accent-rate">
                {Number(tip.annualRate).toFixed(2)}% {language === "hi" ? "प्रति वर्ष" : language === "mr" ? "प्रति वर्ष" : language === "kn" ? "ಪ್ರತಿ ವರ್ಷ" : "per year"}
              </span>
            </div>
            <div className="tip-block muted">
              {translate("chart_tip_base_mclr", language)} {tip.mclr != null ? `${Number(tip.mclr).toFixed(2)}%` : "—"}{" "}
              {translate("chart_tip_rera_extra", language)} {tip.spread != null ? `${Number(tip.spread).toFixed(2)}%` : "—"}
            </div>
            <div className="tip-divider" />
            <div className="tip-block">
              <span className="tip-label">{translate("chart_tip_built_up", language)}</span>
              <span className="tip-value">{formatINR(tip.cumulativeInterest)}</span>
            </div>
            <div className="tip-block">
              <span className="tip-label">{translate("chart_tip_added_period", language)}</span>
              <span className="tip-value">{formatINR(tip.segmentInterest)}</span>
            </div>
            <div className="tip-foot muted">
              {tip.days} {language === "hi" ? "दिन इस दर पर" : language === "mr" ? "दिवस या दराने" : language === "kn" ? "ದಿನಗಳು ಈ ದರದಲ್ಲಿ" : "days at this rate"}
            </div>
          </div>
        ) : (
          <div className="chart-tooltip-placeholder">
            {translate("chart_tip_placeholder", language)}
          </div>
        )}
      </div>
    </div>
  );
}
