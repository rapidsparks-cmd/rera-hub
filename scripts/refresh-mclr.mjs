/**
 * Refresh bundled SBI highest-MCLR history.
 * Usage: node scripts/refresh-mclr.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../src/data/sbiHighestMclr.json");
const url =
  "https://sbi.bank.in/web/interest-rates/interest-rates/mclr-historical-data";

const html = await (await fetch(url, { headers: { "User-Agent": "rera-hub-refresh/1.0" } })).text();
const rowRe =
  /(\d{2}\.\d{2}\.\d{4})\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)/g;

const seen = new Set();
const series = [];
let m;
while ((m = rowRe.exec(html)) !== null) {
  const [dd, mm, yyyy] = m[1].split(".");
  const iso = `${yyyy}-${mm}-${dd}`;
  if (seen.has(iso)) continue;
  seen.add(iso);
  const rates = m.slice(2, 9).map(Number);
  series.push({
    effectiveFrom: iso,
    highest: Math.max(...rates),
    oneYear: rates[4],
    threeYear: rates[6],
  });
}
series.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

const out = {
  source: url,
  tenorUsed: "highest published SBI MCLR tenor (typically 3Y)",
  updatedAt: new Date().toISOString().slice(0, 10),
  series,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${series.length} MCLR points → ${outPath}`);
console.log("Latest:", series.at(-1));
