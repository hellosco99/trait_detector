# Biased Trait Auditor — Demo Web

Static-mock Next.js front-end for the trait detector demo (CMUX × AIM Hackathon Seoul 2026).

## Run

```bash
npm install
npm run dev
# → http://localhost:3000
```

Production build:
```bash
npm run build && npm start
```

## Routes

| URL | Page |
|---|---|
| `/` | Submit — model selection + Run Audit |
| `/audit/m_ft/d1` | Detection 1 — behavioral fingerprint |
| `/audit/m_ft/d2` | Detection 2 — weight spectral signature **(hero shot)** |
| `/audit/m_ft/verdict` | Final verdict — gauge + confirmed traits |

Stepper-only navigation in the top bar (no Prev/Next buttons).

## Design notes

- **Dark base, single accent.** `slate-900`-ish background, one strong red (`#ef4444`) reserved for confirmed traits and verdict-high. No gradients on small text.
- **Token chip color = consensus class.** `chip chip-red` = confirmed, `chip chip-amber` = disputed, `chip chip-noise` = style noise (line-through). Defined globally in `app/globals.css`.
- **Typography ladder** = 4 sizes: `64/40/28/20` for headings, base 14 for body, mono `11/12` for tokens & metrics.
- **Reveal moments**:
  1. **D2 architecture grid** — toggle "LLM analysis overlay" → late-layer (L20–L27) o_proj/down_proj cells turn red and start pulsing in unison; trait-token chips appear inside the cells (`hamburger`, `hamburg`, `汉堡`, `spider`).
  2. **Verdict gauge** — 0 → 0.86 fill animation in 1.6s, eased; the `HIGH` badge appears with the final value.
- **Motion budget**: Tailwind `animate-*` only. CSS keyframes in `app/globals.css`. Stagger 40ms per child via the `.stagger > *` selector.
- **No shadows**, no blur — codec-friendly for screen recording.

## Where to plug real data

`lib/api.ts` exposes async functions that today return mocks from `lib/mock.ts`. The frontend-engineer should replace each function body with `fetch(API_BASE + …)`. Types in `lib/types.ts` already match the real `det1.json` / `det2.json` / `consensus.json` shapes.

```ts
// lib/api.ts — drop-in replacement
export async function fetchDet1(run: string): Promise<Det1> {
  const r = await fetch(`${API_BASE}/runs/${run}/det1`);
  if (!r.ok) throw new Error("det1 failed");
  return r.json();
}
```

The Submit page's `handleRun` already drives a 1.5s progress bar and routes to `/audit/<run>/d1` once `startAudit()` resolves.

## File map

```
app/
  layout.tsx           # root layout, Geist fonts, dark theme
  page.tsx             # Submit
  audit/[run]/
    layout.tsx         # stepper wrapper
    d1/page.tsx        # Detection 1 (behavioral)
    d2/page.tsx        # Detection 2 (spectral) — hero
    verdict/page.tsx   # Verdict
components/
  stepper.tsx
  ui.tsx               # Card / Stat / Toggle primitives
  confirmed-trait-card.tsx
  d1/
    input-heatmap.tsx
    nomination-card.tsx
    token-bar-chart.tsx
  d2/
    architecture-grid.tsx   # 28 × 2 residual-stream grid
    slot-detail.tsx          # 8 SVD directions inline expand
    cross-slot-table.tsx
  verdict/
    infectedness-gauge.tsx   # animated SVG arc
lib/
  api.ts               # static-mock fetch shim (swap to real)
  mock.ts              # hand-coded data, mirrors real JSON shape
  types.ts
  utils.ts             # cn, classifyToken, fmt, spectralIntensity
```

## Recording tips

- 1080p @ 30fps captures the gauge animation + grid pulse cleanly.
- Run in Chrome with `prefers-reduced-motion: no-preference`.
- For the D2 reveal, start on **Raw metrics**, wait 1s, click **LLM analysis overlay** — the late-layer block lights up.
