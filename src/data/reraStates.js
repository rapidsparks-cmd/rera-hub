/**
 * RERA-applicable States / UTs for the calculator dropdown.
 *
 * Source: Ministry of Housing and Urban Affairs (MoHUA), Government of India —
 * “Real Estate Regulatory Authorities of States / UTs”
 * https://rera.mohua.gov.in/real-estate-regulatory-authorities-of-states-uts.html
 *
 * Only jurisdictions listed by MoHUA with an operational RERA portal are included.
 * Excluded (MoHUA: “Website Not Setup”): Arunachal Pradesh, Manipur, Mizoram,
 * Nagaland, Sikkim, Ladakh.
 */

export const MOHUA_RERA_DIRECTORY_URL =
  "https://rera.mohua.gov.in/real-estate-regulatory-authorities-of-states-uts.html";

export const SBI_MCLR_SOURCE_URL =
  "https://sbi.bank.in/web/interest-rates/interest-rates/mclr-historical-data";

/**
 * method: "simple" | "compound_monthly"
 * spread: percentage points added to MCLR (state rule presets used by this calculator)
 * portal: official URL as listed by MoHUA (or administering authority portal)
 */
export const RERA_STATES = [
  // —— States ——
  {
    id: "ap",
    name: "AP RERA (Andhra Pradesh)",
    short: "AP RERA",
    region: "state",
    portal: "https://rera.ap.gov.in/RERA/Views/Home.aspx",
    featured: false,
  },
  {
    id: "br",
    name: "Bihar RERA",
    short: "Bihar RERA",
    region: "state",
    portal: "https://rera.bihar.gov.in/",
    featured: false,
  },
  {
    id: "cg",
    name: "Chhattisgarh RERA",
    short: "CG RERA",
    region: "state",
    portal: "https://rera.cgstate.gov.in",
    featured: false,
  },
  {
    id: "ga",
    name: "Goa RERA",
    short: "Goa RERA",
    region: "state",
    portal: "https://rera.goa.gov.in",
    featured: false,
  },
  {
    id: "gj",
    name: "GujRERA (Gujarat)",
    short: "GujRERA",
    region: "state",
    portal: "https://gujrera.gujarat.gov.in",
    featured: false,
  },
  {
    id: "hr",
    name: "HRERA (Haryana)",
    short: "HRERA",
    region: "state",
    portal: "https://haryanarera.gov.in",
    featured: true,
    blurb:
      "Mandates SBI MCLR + 2% Simple Interest. Strict verification of date-wise paid receipts is required in litigation filings.",
  },
  {
    id: "hp",
    name: "HP RERA (Himachal Pradesh)",
    short: "HP RERA",
    region: "state",
    portal: "https://hprera.nic.in",
    featured: false,
  },
  {
    id: "jh",
    name: "Jharkhand RERA",
    short: "Jharkhand RERA",
    region: "state",
    portal: "https://rera.jharkhand.gov.in",
    featured: false,
  },
  {
    id: "ka",
    name: "K-RERA (Karnataka)",
    short: "K-RERA",
    region: "state",
    portal: "https://rera.karnataka.gov.in",
    featured: true,
    blurb:
      "Follows SBI MCLR + 2% Compounded Monthly. Apportioned to the day for outstanding payment balances.",
  },
  {
    id: "kl",
    name: "Kerala RERA",
    short: "Kerala RERA",
    region: "state",
    portal: "https://rera.kerala.gov.in",
    featured: false,
  },
  {
    id: "mp",
    name: "MP RERA (Madhya Pradesh)",
    short: "MP RERA",
    region: "state",
    portal: "https://rera.mp.gov.in",
    featured: false,
  },
  {
    id: "mh",
    name: "MahaRERA (Maharashtra)",
    short: "MahaRERA",
    region: "state",
    portal: "https://maharera.maharashtra.gov.in/",
    featured: true,
    blurb:
      "Statutory interest at SBI MCLR + 2% Simple Interest per annum, running from the committed possession date.",
  },
  {
    id: "od",
    name: "Odisha RERA",
    short: "Odisha RERA",
    region: "state",
    portal: "https://rera.odisha.gov.in",
    featured: false,
  },
  {
    id: "pb",
    name: "Punjab RERA",
    short: "Punjab RERA",
    region: "state",
    portal: "https://rera.punjab.gov.in",
    featured: false,
  },
  {
    id: "rj",
    name: "Raj RERA (Rajasthan)",
    short: "Raj RERA",
    region: "state",
    portal: "https://rera.rajasthan.gov.in",
    featured: false,
  },
  {
    id: "tn",
    name: "TN RERA (Tamil Nadu)",
    short: "TN RERA",
    region: "state",
    portal: "https://rera.tn.gov.in",
    featured: false,
  },
  {
    id: "ts",
    name: "TS RERA (Telangana)",
    short: "TS RERA",
    region: "state",
    portal: "https://rera.telangana.gov.in",
    featured: false,
  },
  {
    id: "up",
    name: "UP RERA (Uttar Pradesh)",
    short: "UP RERA",
    region: "state",
    portal: "https://up-rera.in",
    featured: true,
    blurb:
      "Applies SBI MCLR + 1% Compounded Monthly, creating a higher compounding return for long-delayed possession periods.",
  },
  {
    id: "uk",
    name: "Uttarakhand RERA",
    short: "UK RERA",
    region: "state",
    portal: "https://rera.uk.gov.in",
    featured: false,
  },
  {
    id: "wb",
    name: "WB RERA (West Bengal)",
    short: "WB RERA",
    region: "state",
    portal: "https://rera.wb.gov.in/",
    featured: false,
  },

  // —— North Eastern States (MoHUA portal listed) ——
  {
    id: "as",
    name: "Assam RERA",
    short: "Assam RERA",
    region: "northeast",
    portal: "https://rera.assam.gov.in",
    featured: false,
  },
  {
    id: "ml",
    name: "Meghalaya RERA",
    short: "Meghalaya RERA",
    region: "northeast",
    portal: "https://meghrera.org.in/",
    featured: false,
  },
  {
    id: "tr",
    name: "Tripura RERA",
    short: "Tripura RERA",
    region: "northeast",
    portal: "https://rera.tripura.gov.in",
    featured: false,
  },

  // —— Union Territories (MoHUA portal listed) ——
  {
    id: "an",
    name: "A&N Islands RERA",
    short: "A&N RERA",
    region: "ut",
    portal: "https://rera.tn.gov.in/",
    note: "Administered via TN RERA portal (as listed by MoHUA).",
    featured: false,
  },
  {
    id: "ch",
    name: "Chandigarh RERA",
    short: "Chandigarh RERA",
    region: "ut",
    portal: "https://www.rera.delhi.gov.in/",
    note: "Portal listed under Delhi RERA by MoHUA.",
    featured: false,
  },
  {
    id: "dn",
    name: "Dadra & Nagar Haveli and Daman & Diu RERA",
    short: "DNHDD RERA",
    region: "ut",
    portal: "https://maharera.maharashtra.gov.in/",
    note: "Portal listed under MahaRERA by MoHUA.",
    featured: false,
  },
  {
    id: "dl",
    name: "Delhi RERA",
    short: "Delhi RERA",
    region: "ut",
    portal: "https://rera.delhi.gov.in",
    featured: false,
  },
  {
    id: "jk",
    name: "J&K RERA",
    short: "J&K RERA",
    region: "ut",
    portal: "https://rera.jk.gov.in",
    featured: false,
  },
  {
    id: "ld",
    name: "Lakshadweep RERA",
    short: "Lakshadweep RERA",
    region: "ut",
    portal: "https://rera.kerala.gov.in/",
    note: "Administered via Kerala RERA portal (as listed by MoHUA).",
    featured: false,
  },
  {
    id: "py",
    name: "Puducherry RERA",
    short: "Puducherry RERA",
    region: "ut",
    portal: "http://prera.py.gov.in/",
    featured: false,
  },
];

/** All entries in this file are MoHUA-listed with an operational portal. */
export const APPLICABLE_RERA_STATES = RERA_STATES;

export const FEATURED_STATES = RERA_STATES.filter((s) => s.featured);

export function isApplicableStateId(id) {
  return APPLICABLE_RERA_STATES.some((s) => s.id === id);
}

export function getStateById(id) {
  return APPLICABLE_RERA_STATES.find((s) => s.id === id) || null;
}

export function methodLabel(method) {
  return method === "compound_monthly" ? "Monthly Compound" : "Simple";
}

export function ruleSummary(state, latestMclr = null, spreadRule = null) {
  const spread = spreadRule?.spreadPct ?? state.spread;
  const method = spreadRule?.method ?? state.method;
  const kind = methodLabel(method);
  const live =
    latestMclr != null && spread != null
      ? ` Current highest MCLR ${Number(latestMclr).toFixed(2)}% → illustrative ${(
          Number(latestMclr) + Number(spread)
        ).toFixed(2)}% today.`
      : "";
  const window = spreadRule
    ? ` Applicable from ${spreadRule.applicableFrom}${spreadRule.applicableTo ? ` to ${spreadRule.applicableTo}` : " (open-ended)"}.`
    : "";
  return `${state.short} Rule: SBI Highest MCLR (as applicable over the delay period) + ${spread}% ${kind} Interest per annum.${window}${live}`;
}
