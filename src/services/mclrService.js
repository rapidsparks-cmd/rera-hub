import bundled from "../data/sbiHighestMclr.json";

const SBI_HISTORICAL_URL =
  "https://sbi.bank.in/web/interest-rates/interest-rates/mclr-historical-data";
const SBI_CURRENT_URL = "https://sbi.bank.in/web/interest-rates/interest-rates/mclr";

/** In-memory series; refreshed from SBI when the Vite proxy is available. */
let series = [...(bundled.series || [])].sort((a, b) =>
  a.effectiveFrom.localeCompare(b.effectiveFrom)
);
let meta = {
  source: bundled.source || SBI_HISTORICAL_URL,
  updatedAt: bundled.updatedAt || null,
  live: false,
};

function parseSbiDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split(".");
  return `${yyyy}-${mm}-${dd}`;
}

function parseHistoricalHtml(html) {
  const rowRe =
    /(\d{2}\.\d{2}\.\d{4})\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)/g;
  const seen = new Set();
  const next = [];
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const iso = parseSbiDate(m[1]);
    if (seen.has(iso)) continue;
    seen.add(iso);
    const rates = m.slice(2, 9).map(Number);
    next.push({
      effectiveFrom: iso,
      highest: Math.max(...rates),
      oneYear: rates[4],
      threeYear: rates[6],
    });
  }
  next.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  return next;
}

/**
 * Attempt to refresh MCLR series from SBI via local Vite proxy.
 * Falls back silently to bundled historical data.
 */
export async function refreshMclrFromSbi() {
  try {
    const [histRes, currRes] = await Promise.all([
      fetch("/api/sbi-mclr/historical"),
      fetch("/api/sbi-mclr/current"),
    ]);
    if (!histRes.ok) throw new Error(`historical ${histRes.status}`);
    const histHtml = await histRes.text();
    const parsed = parseHistoricalHtml(histHtml);
    if (parsed.length === 0) throw new Error("No MCLR rows parsed");

    if (currRes.ok) {
      const currHtml = await currRes.text();
      const threeY = currHtml.match(
        /Three\s*Years[\s\S]{0,400}?<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>/i
      );
      const effect = currHtml.match(
        /With Effect From\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+[0-9]{4})/i
      );
      if (threeY) {
        const rate = Number(threeY[2] || threeY[1]);
        // Map "15th June 2026" → ISO when possible
        let iso = null;
        if (effect?.[1]) {
          const d = new Date(effect[1].replace(/(\d+)(st|nd|rd|th)/i, "$1"));
          if (!Number.isNaN(d.getTime())) iso = d.toISOString().slice(0, 10);
        }
        if (iso && !parsed.some((r) => r.effectiveFrom === iso)) {
          parsed.push({
            effectiveFrom: iso,
            highest: rate,
            oneYear: rate,
            threeYear: rate,
          });
          parsed.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
        } else if (parsed.length) {
          // Update latest row highest if current page is newer same month
          const last = parsed[parsed.length - 1];
          last.highest = rate;
          last.threeYear = rate;
        }
      }
    }

    series = parsed;
    meta = {
      source: SBI_HISTORICAL_URL,
      updatedAt: new Date().toISOString().slice(0, 10),
      live: true,
      currentPage: SBI_CURRENT_URL,
    };
    return getMclrMeta();
  } catch (err) {
    console.warn("MCLR live refresh unavailable; using bundled SBI series.", err.message || err);
    return getMclrMeta();
  }
}

export function getMclrMeta() {
  const latest = series[series.length - 1];
  return {
    ...meta,
    latestEffectiveFrom: latest?.effectiveFrom || null,
    latestHighest: latest?.highest ?? null,
    points: series.length,
  };
}

/** Highest SBI MCLR in force on a given ISO date. */
export function getHighestMclrOn(isoDate) {
  if (!isoDate || series.length === 0) return null;
  let chosen = series[0];
  for (const row of series) {
    if (row.effectiveFrom <= isoDate) chosen = row;
    else break;
  }
  return chosen.highest;
}

export function getCurrentHighestMclr() {
  return series[series.length - 1]?.highest ?? null;
}

/**
 * Split [startIso, endIso) into segments where highest MCLR is constant.
 * End date is exclusive for segmenting; interest days use inclusive calendar days separately.
 */
export function getMclrSegments(startIso, endIso) {
  if (!startIso || !endIso || endIso <= startIso) return [];
  const segments = [];
  let cursor = startIso;

  while (cursor < endIso) {
    const rate = getHighestMclrOn(cursor);
    // Find next rate change after cursor
    let nextChange = endIso;
    for (const row of series) {
      if (row.effectiveFrom > cursor && row.effectiveFrom < nextChange) {
        nextChange = row.effectiveFrom;
        break;
      }
    }
    segments.push({
      from: cursor,
      to: nextChange,
      mclr: rate,
    });
    cursor = nextChange;
  }
  return segments;
}

export function getBundledFallbackMclr() {
  return getCurrentHighestMclr();
}
