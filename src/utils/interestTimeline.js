/**
 * Build chart series from payment segment rows:
 * - cumulative interest points (start + end of each segment, for visible slope changes)
 * - rate step points (effective MCLR+spread held constant within each segment)
 */
export function buildInterestTimeline(rows = []) {
  const segments = rows.flatMap((row) =>
    (row.segments || []).map((seg) => ({
      ...seg,
      paymentDate: row.paymentDate,
      amount: row.amount,
    }))
  );

  if (segments.length === 0) {
    return { interestPoints: [], rateSteps: [], rateChanges: [] };
  }

  const sorted = [...segments].sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  );

  // Merge calendar segments by date range for rate display (use max annual rate if overlap)
  const rateSteps = [];
  for (const seg of sorted) {
    rateSteps.push({
      from: seg.from,
      to: seg.to,
      mclr: seg.mclr,
      spread: seg.spread,
      annualRate: Number(seg.annualRate),
      method: seg.method,
      days: seg.days,
      segmentInterest: Number(seg.interest || 0),
    });
  }

  // Cumulative interest: point at each segment boundary so slope changes are visible
  let running = 0;
  const interestPoints = [];
  const startDate = sorted[0].from;

  interestPoints.push({
    date: startDate,
    cumulativeInterest: 0,
    segmentInterest: 0,
    mclr: sorted[0].mclr,
    spread: sorted[0].spread,
    annualRate: Number(sorted[0].annualRate),
    method: sorted[0].method,
    from: sorted[0].from,
    to: sorted[0].to,
    days: 0,
    rateChanged: false,
  });

  let prevRate = Number(sorted[0].annualRate);
  const rateChanges = [];

  for (const seg of sorted) {
    const rate = Number(seg.annualRate);
    const rateChanged = Math.abs(rate - prevRate) > 0.001;

    // Point at segment start (same cumulative, new rate begins)
    const last = interestPoints[interestPoints.length - 1];
    if (last.date !== seg.from) {
      interestPoints.push({
        date: seg.from,
        cumulativeInterest: running,
        segmentInterest: 0,
        mclr: seg.mclr,
        spread: seg.spread,
        annualRate: rate,
        method: seg.method,
        from: seg.from,
        to: seg.to,
        days: 0,
        rateChanged,
      });
    } else {
      last.annualRate = rate;
      last.mclr = seg.mclr;
      last.spread = seg.spread;
      last.method = seg.method;
      last.from = seg.from;
      last.to = seg.to;
      last.rateChanged = rateChanged || last.rateChanged;
    }

    if (rateChanged) {
      rateChanges.push({
        date: seg.from,
        fromRate: prevRate,
        toRate: rate,
        mclr: seg.mclr,
        spread: seg.spread,
      });
    }

    running += Number(seg.interest || 0);

    interestPoints.push({
      date: seg.to,
      cumulativeInterest: running,
      segmentInterest: Number(seg.interest || 0),
      mclr: seg.mclr,
      spread: seg.spread,
      annualRate: rate,
      method: seg.method,
      from: seg.from,
      to: seg.to,
      days: seg.days,
      rateChanged: false,
    });

    prevRate = rate;
  }

  // Dedupe consecutive same-date points (keep last)
  const deduped = [];
  for (const p of interestPoints) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.date === p.date) {
      deduped[deduped.length - 1] = { ...prev, ...p, cumulativeInterest: p.cumulativeInterest };
    } else {
      deduped.push(p);
    }
  }

  return { interestPoints: deduped, rateSteps, rateChanges };
}
