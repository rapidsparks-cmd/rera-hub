import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { formatNumber } from "../utils/reraInterest";

export default function ReportBreakdown({ result }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const segmentCount = result.rows.reduce((n, row) => n + (row.segments?.length || 0), 0);

  return (
    <div className="breakdown">
      <div className="breakdown-head">
        <h3>Calculation breakdown</h3>
        <FileText size={16} />
      </div>
      <p className="breakdown-hint muted">
        This is a simple summary of what you paid and the interest on it. Open “full detail” below
        if you want to see how the interest rate changed over time.
      </p>

      {/* Uber-level: payments only */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>What this is</th>
              <th>Amount paid</th>
              <th>From → To</th>
              <th>Average rate</th>
              <th>Interest</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={`summary-${row.paymentDate}-${i}`} className="row-payment">
                <td>
                  {row.description}
                  {row.paymentDate && (
                    <>
                      <br />
                      <span className="muted">Paid {row.paymentDate}</span>
                    </>
                  )}
                </td>
                <td>{formatNumber(row.amount)}</td>
                <td>
                  {row.startDate} → {row.endDate}
                  <br />
                  <span className="muted">{row.days} days</span>
                </td>
                <td>
                  {row.avgRate != null ? `${row.avgRate.toFixed(2)}%` : "—"}
                  <br />
                  <span className="muted">
                    {(row.segments?.length || 0)} segment
                    {(row.segments?.length || 0) === 1 ? "" : "s"}
                  </span>
                </td>
                <td>{formatNumber(row.interest)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{formatNumber(result.principal)}</td>
              <td>{result.delayDays} days delay</td>
              <td>{result.annualRatePct.toFixed(2)}% wtd avg</td>
              <td>{formatNumber(result.interest)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Full detail dropdown */}
      <div className={`detail-drawer ${detailOpen ? "open" : ""}`}>
        <button
          type="button"
          className="detail-toggle"
          onClick={() => setDetailOpen((v) => !v)}
          aria-expanded={detailOpen}
        >
          <span>
            {detailOpen ? "Hide" : "Show"} full detail
            <span className="muted"> · {segmentCount} rate periods</span>
          </span>
          <ChevronDown size={18} className={detailOpen ? "chev open" : "chev"} />
        </button>

        {detailOpen && (
          <div className="table-wrap detail-table">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Amount paid</th>
                  <th>From → To</th>
                  <th>Interest rate</th>
                  <th>Interest</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) =>
                  (row.segments || []).map((seg, si) => (
                    <tr key={`detail-${i}-${si}-${seg.from}`} className="row-segment">
                      <td>
                        <span className="seg-label">
                          Payment {i + 1} · Seg {si + 1}
                        </span>
                        <br />
                        <span className="muted">{row.description}</span>
                      </td>
                      <td>{formatNumber(row.amount)}</td>
                      <td>
                        {seg.from} → {seg.to}
                        <br />
                        <span className="muted">{seg.days} days</span>
                      </td>
                      <td>
                        <strong>{Number(seg.annualRate).toFixed(2)}%</strong>
                        <br />
                        <span className="muted">
                          MCLR {seg.mclr != null ? `${Number(seg.mclr).toFixed(2)}%` : "—"} +{" "}
                          {Number(seg.spread).toFixed(2)}%
                          {seg.method
                            ? ` · ${seg.method === "compound_monthly" ? "compound" : "simple"}`
                            : ""}
                        </span>
                      </td>
                      <td>{formatNumber(seg.interest)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
