import { getHighestMclrOn, getMclrSegments } from "../services/mclrService";
import { getSpreadRuleOn, getSpreadSegments } from "../services/stateSpreadService";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISO(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function daysBetween(start, end) {
  if (!start || !end || end <= start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

export function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n || 0));
}

/** Simple interest: P × r × days / 365 */
export function simpleInterest(principal, annualRatePct, days) {
  if (principal <= 0 || days <= 0) return 0;
  return principal * (annualRatePct / 100) * (days / 365);
}

export function compoundMonthlyInterest(principal, annualRatePct, days) {
  if (principal <= 0 || days <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  const fullMonths = Math.floor(days / 30);
  const remDays = days % 30;
  let amount = principal;
  for (let i = 0; i < fullMonths; i += 1) {
    amount *= 1 + monthlyRate;
  }
  if (remDays > 0) {
    amount += amount * (annualRatePct / 100) * (remDays / 365);
  }
  return amount - principal;
}

export function interestForDays(principal, annualRatePct, days, method) {
  return method === "compound_monthly"
    ? compoundMonthlyInterest(principal, annualRatePct, days)
    : simpleInterest(principal, annualRatePct, days);
}

/** Merge MCLR + state-spread breakpoints into atomic [from, to) segments. */
export function getCombinedRateSegments(stateId, startIso, endIso) {
  if (!startIso || !endIso || endIso <= startIso) return [];

  const mclrSegs = getMclrSegments(startIso, endIso);
  const spreadSegs = getSpreadSegments(stateId, startIso, endIso);
  const breaks = new Set([startIso, endIso]);
  for (const s of mclrSegs) breaks.add(s.from);
  for (const s of spreadSegs) {
    breaks.add(s.from);
    if (s.to) breaks.add(s.to);
  }

  const points = [...breaks].filter((d) => d >= startIso && d <= endIso).sort();
  const segments = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    if (to <= from) continue;

    const mclr = getHighestMclrOn(from);
    const rule = getSpreadRuleOn(stateId, from);
    if (!rule) {
      throw new Error(`Missing spread rule for ${stateId} on ${from}`);
    }

    const spreadPct = Number(rule.spreadPct);
    const method = rule.method || "simple";
    const annualRate = Number(mclr) + spreadPct;

    segments.push({
      from,
      to,
      days: daysBetween(parseDate(from), parseDate(to)),
      mclr,
      spread: spreadPct,
      method,
      annualRate,
      ruleId: rule.id,
      source: rule.source,
      sourceUrl: rule.sourceUrl,
    });
  }

  return segments.filter((s) => s.days > 0);
}

/**
 * Accrue using combined dynamic MCLR + dated state spread configs.
 */
export function interestWithDynamicRates({
  principal,
  startIso,
  endIso,
  stateId,
  methodOverride = null,
  spreadOverride = null,
  fixedAnnualRate = null,
}) {
  if (principal <= 0 || !startIso || !endIso || endIso <= startIso) {
    return { interest: 0, segments: [], weightedAvgRate: 0, method: methodOverride || "simple" };
  }

  // Fixed override path (manual MCLR lock)
  if (fixedAnnualRate != null) {
    const days = daysBetween(parseDate(startIso), parseDate(endIso));
    const method = methodOverride || getSpreadRuleOn(stateId, startIso)?.method || "simple";
    const interest = interestForDays(principal, Number(fixedAnnualRate), days, method);
    return {
      interest,
      method,
      weightedAvgRate: Number(fixedAnnualRate),
      segments: [
        {
          from: startIso,
          to: endIso,
          days,
          mclr: null,
          spread: spreadOverride,
          method,
          annualRate: Number(fixedAnnualRate),
          interest,
        },
      ],
    };
  }

  const combined = getCombinedRateSegments(stateId, startIso, endIso);
  if (combined.length === 0) {
    return { interest: 0, segments: [], weightedAvgRate: 0, method: "simple" };
  }

  // Dominant method: if any segment is compound_monthly, use compound path with per-segment rates
  const usesCompound = combined.some((s) => (methodOverride || s.method) === "compound_monthly");
  const segments = [];

  if (usesCompound) {
    let amount = principal;
    let cursor = startIso;
    while (cursor < endIso) {
      const d = parseDate(cursor);
      d.setMonth(d.getMonth() + 1);
      let segEnd = toISO(d);
      if (segEnd > endIso) segEnd = endIso;
      if (segEnd <= cursor) segEnd = addDays(cursor, 1);
      if (segEnd > endIso) break;

      const days = daysBetween(parseDate(cursor), parseDate(segEnd));
      if (days <= 0) break;

      const mclr = getHighestMclrOn(cursor);
      const rule = getSpreadRuleOn(stateId, cursor);
      const spreadPct = spreadOverride != null ? Number(spreadOverride) : Number(rule.spreadPct);
      const method = methodOverride || rule.method || "compound_monthly";
      const annual = Number(mclr) + spreadPct;
      const before = amount;
      amount *= 1 + (annual / 100 / 12) * (days / 30);
      const segInterest = amount - before;

      segments.push({
        from: cursor,
        to: segEnd,
        days,
        mclr,
        spread: spreadPct,
        method,
        annualRate: annual,
        interest: segInterest,
        ruleId: rule?.id,
        source: rule?.source,
        sourceUrl: rule?.sourceUrl,
      });
      cursor = segEnd;
    }

    const interest = amount - principal;
    const totalDays = daysBetween(parseDate(startIso), parseDate(endIso));
    const weightedAvgRate =
      totalDays > 0
        ? segments.reduce((s, seg) => s + seg.annualRate * seg.days, 0) / totalDays
        : 0;
    return { interest, segments, weightedAvgRate, method: "compound_monthly" };
  }

  // Simple interest over combined segments
  for (const seg of combined) {
    const spreadPct = spreadOverride != null ? Number(spreadOverride) : seg.spread;
    const annual = Number(seg.mclr) + spreadPct;
    const interest = simpleInterest(principal, annual, seg.days);
    segments.push({
      ...seg,
      spread: spreadPct,
      annualRate: annual,
      interest,
      method: "simple",
    });
  }

  const interest = segments.reduce((s, seg) => s + seg.interest, 0);
  const totalDays = daysBetween(parseDate(startIso), parseDate(endIso));
  const weightedAvgRate =
    totalDays > 0
      ? segments.reduce((s, seg) => s + seg.annualRate * seg.days, 0) / totalDays
      : 0;

  return { interest, segments, weightedAvgRate, method: "simple" };
}

/**
 * Builder delay / buyer late payment calculator using dated state spread configs + SBI MCLR.
 */
export function calculateReraInterest({
  calcType = "builder_delay",
  stateId,
  method,
  spreadPct,
  annualRatePct,
  useDynamicMclr = true,
  promisedDate,
  endDate,
  payments,
}) {
  const promised = parseDate(promisedDate);
  const end = parseDate(endDate);
  if (!promised || !end) {
    throw new Error("Promised date and end date are required.");
  }
  if (!stateId) {
    throw new Error("stateId is required for spread config lookup.");
  }

  const rows = [];
  let principal = 0;
  let interest = 0;
  let rateWeightDays = 0;
  let rateWeightSum = 0;
  const allSegments = [];
  let methodUsed = method;

  for (const p of payments) {
    const amount = Number(p.amount);
    const payDate = parseDate(p.date);
    if (!amount || amount <= 0 || !payDate) continue;

    principal += amount;

    let start;
    let rowEnd;
    if (calcType === "buyer_late") {
      start = promised;
      rowEnd = payDate > end ? end : payDate;
    } else {
      start = payDate > promised ? payDate : promised;
      rowEnd = end;
    }

    const startIso = toISO(start);
    const endIso = toISO(rowEnd);
    const days = daysBetween(start, rowEnd);

    const dyn = interestWithDynamicRates({
      principal: amount,
      startIso,
      endIso,
      stateId,
      methodOverride: method || null,
      spreadOverride: useDynamicMclr ? null : spreadPct,
      fixedAnnualRate: useDynamicMclr ? null : annualRatePct,
    });

    const rowInterest = dyn.interest;
    const rowSegments = dyn.segments;
    const rowAvgRate = dyn.weightedAvgRate;
    methodUsed = dyn.method || methodUsed;

    interest += rowInterest;
    rateWeightDays += days;
    rateWeightSum += rowAvgRate * days;
    allSegments.push(...rowSegments);

    const startRule = getSpreadRuleOn(stateId, startIso);
    const endRule = getSpreadRuleOn(stateId, addDays(endIso, -1) < startIso ? startIso : addDays(endIso, -1));

    rows.push({
      description: calcType === "buyer_late" ? "Buyer installment (late)" : "Amount paid",
      amount,
      paymentDate: p.date,
      startDate: startIso,
      endDate: endIso,
      days,
      interest: rowInterest,
      avgRate: rowAvgRate,
      mclrStart: getHighestMclrOn(startIso),
      mclrEnd: getHighestMclrOn(addDays(endIso, -1) < startIso ? startIso : addDays(endIso, -1)),
      spreadStart: startRule?.spreadPct,
      spreadEnd: endRule?.spreadPct,
      spreadSource: startRule?.source,
      segments: rowSegments,
    });
  }

  const delayDays = daysBetween(promised, end);
  const total = principal + interest;
  const interestShare = total > 0 ? (interest / total) * 100 : 0;
  const annualRatePctUsed =
    rateWeightDays > 0 ? rateWeightSum / rateWeightDays : Number(annualRatePct) || 0;
  const currentRule = getSpreadRuleOn(stateId, toISO(end));

  return {
    principal,
    interest,
    total,
    delayDays,
    interestShare,
    dailyRate: annualRatePctUsed / 365,
    monthlyAccrual: (principal * (annualRatePctUsed / 100)) / 12,
    avgDailyInterest: delayDays > 0 ? interest / delayDays : 0,
    rows,
    method: methodUsed || currentRule?.method || "simple",
    annualRatePct: annualRatePctUsed,
    spreadPct: currentRule?.spreadPct ?? Number(spreadPct),
    dynamicMclr: Boolean(useDynamicMclr),
    dynamicSpread: Boolean(useDynamicMclr),
    spreadRule: currentRule,
    rateSegments: allSegments,
  };
}
