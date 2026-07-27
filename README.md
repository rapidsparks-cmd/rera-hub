# rera-hub

[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/rapidsparks-cmd/rera-hub)

RERA compensation calculator inspired by [BuilderDelay](https://builderdelay.in/rera-penalty-calculator/#calculator) — state-calibrated Section 18 interest, lump-sum or installment schedules, analytics report, and FAQ.


## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Env vars

| Variable | Purpose |
|---|---|
| `VITE_GEMINI_API_KEY` | Live RERA lookups + optional Form M drafting |
| `VITE_ENABLE_RERA_PROJECT_FETCH` | Show Fetch RERA project panel (default: off) |
| `VITE_ENABLE_RERA_FORM_M_DRAFT` | Show AI Form M draft option (default: off) |
| `VITE_ENABLE_INSTALLMENTS_SCHEDULE` | Show installment schedule input mode (default: off) |

## Features

- Landing state picker (MoHUA-listed RERA jurisdictions only)
- Builder delay calculator (amount paid)
- Optional installment schedule input (feature-flagged)
- **Dated state spread configs** (`src/data/stateSpreads/*.json`) + **dynamic SBI highest MCLR**
- Live MCLR refresh in `npm run dev` via SBI proxy; bundled history for offline/build
- Interest report with weighted-average rate + printable breakdown

## Rate data

```bash
npm run refresh-mclr   # scrape SBI historical MCLR into src/data/sbiHighestMclr.json
```

State spreads are curated per file under `src/data/stateSpreads/` (spread %, method, applicableFrom/To, source). See that folder’s README for the schema. When a state revises rates, append a new rule instead of overwriting history.
