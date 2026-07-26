# State spread configs

One JSON file per MoHUA-listed RERA jurisdiction. Used at calculation time to resolve
**spread %** and **interest method** for each date in the delay period.

## Schema

```json
{
  "stateId": "mh",
  "authority": "MahaRERA",
  "portal": "https://maharera.maharashtra.gov.in/",
  "currency": "INR",
  "mclrBasisDefault": "sbi_highest",
  "rules": [
    {
      "id": "mh-2017-05-01",
      "spreadPct": 2,
      "method": "simple",
      "mclrBasis": "sbi_highest",
      "applicableFrom": "2017-05-01",
      "applicableTo": null,
      "source": "Short description of the legal/source basis",
      "sourceUrl": "https://…",
      "legalBasis": "RERA Act 2016 §18 / state rules",
      "verifiedOn": "2026-07-26",
      "notes": "Optional maintainer notes"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `spreadPct` | Points added to SBI highest MCLR (e.g. `2` → MCLR + 2%) |
| `method` | `simple` or `compound_monthly` |
| `applicableFrom` | Inclusive start date (`YYYY-MM-DD`) |
| `applicableTo` | Exclusive end date, or `null` if still current |
| `source` / `sourceUrl` | Human-readable citation + link |

When a state revises its formula, **append** a new rule (set the previous rule’s `applicableTo`) rather than overwriting history.
