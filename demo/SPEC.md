# Demo Spec — Biased Trait Auditor (Next.js + FastAPI)

Mode: **(a) Static results viewer** — backend serves precomputed `results/<run>/{det1,det2,consensus}.json`, no live audit.

## Pages / Routes

| URL | 역할 |
|---|---|
| `/` | Submit page — model 선택 + Run Audit |
| `/audit/[run]/d1` | Detection 1 (Behavioral) |
| `/audit/[run]/d2` | Detection 2 (Spectral) |
| `/audit/[run]/verdict` | Final verdict (Overview) |

Navigation = **stepper only** (상단 4-step indicator, 클릭 시 해당 step 으로 이동, Prev/Next 버튼 없음).

Stepper steps: `1. Submit  2. Detection 1  3. Detection 2  4. Verdict`. Stepper 가 Submit 페이지에선 disabled, audit run 시작 후 모두 활성화.

---

## Backend API (FastAPI)

Base URL: `http://localhost:8000/api`

### `GET /api/health`
헬스체크.

### `GET /api/runs`
사용 가능한 audit run 리스트.
```json
{
  "runs": [
    {
      "name": "m_ft",
      "ft_path": "assets/m_ft",
      "base_path": "assets/base",
      "infectedness": 0.86,
      "verdict_label": "high",
      "judge_model": "claude-sonnet-4-6"
    }
  ]
}
```

### `GET /api/runs/{run_name}/det1`
Detection 1 결과. det1.json 그대로 (heavy file ~5MB).

### `GET /api/runs/{run_name}/det2`
Detection 2 결과.

### `GET /api/runs/{run_name}/consensus`
Consensus + final verdict.

### `POST /api/runs/{run_name}/audit`  *(stub for live mode, not implemented in (a))*
Submit 버튼이 호출하는 endpoint. 현재는 단순히 `{"status": "ready", "redirect": "/audit/<run>/d1"}` 반환. 1.5초 fake delay (서버에서 sleep 또는 클라에서 timer).

### CORS
Allow `http://localhost:3000` and `http://0.0.0.0:3000` origin.

---

## Page 1 — Submit (`/`)

### Visual
```
[Header]
  Biased Trait Auditor
  Detect injected traits in fine-tuned LLMs without labels.

[Form card]
  Base model           [ assets/base                    ▼ ]
  Fine-tuned model     [ assets/m_ft                    ▼ ]
  Audit prompt pool    [ audit_prompts.json (79)        ▼ ]
  > Advanced (collapsible)
    top_k_prompts: 20    top_n_positions: 5
    top_svd_k:    8      judge_model: claude-sonnet-4-6

  [ ▶ Run Audit ]

[Stepper at top]: 1.Submit (active) → 2.D1 (disabled) → 3.D2 (disabled) → 4.Verdict (disabled)
```

### Behavior
- Dropdowns default to `m_ft / base / audit_prompts.json` (only one option in static mode)
- Click "Run Audit" → 1.5초 progress bar (linear) → `/audit/m_ft/d1` 로 라우팅
- 진행 상황 토스트 / spinner (마이크로카피: "Running Detection 1…", "Analyzing weight signatures…", "Synthesizing verdict…")

---

## Page 2 — Detection 1 (`/audit/[run]/d1`)

데이터 소스: `GET /api/runs/{run}/det1` + `consensus` (trait token coloring 위해)

### Sections (위→아래 스크롤)

#### A. Header summary
```
Detection 1 — Behavioral Fingerprint
Per-position KL(ft || base) + LLM judge on highest-divergence prompts.

[Stats row]
  79 prompts   median KL 0.65   max KL 1.82   20 selected for LLM
```

#### B. Input pool heatmap
**도메인별 column 으로 세움**:
- x축: 12 도메인 (food, finance, pets, health, ...)
- y축: 각 도메인 내 prompt index (가변, 5~10)
- cell color: mean_KL gradient (white → red, scale 0~max_KL)
- cell click: 해당 prompt 의 응답 + top-5 KL position 모달 / drawer
- hover: prompt 전문 + KL 값 툴팁
- top-K (20) selected prompts 는 cell 가장자리 outline (얇은 border)

#### C. Top-20 LLM nominations (cards / list)
20개 카드, 각 카드:
```
[domain] [mean_KL] [confidence bar]
Q: prompt ...
Hypothesis: ...
Tokens: [hamburger] [burger] [superfoods] ...
▼ click to expand:
  Response: ...
  Top-5 KL positions table:
    pos | KL | chosen | ft_top | base_top
```

Sort: by mean_KL desc.
Trait token chip color: confirmed trait (red) / disputed (amber) / style noise (gray strikethrough) — using consensus.json 의 final_verdict 매칭

#### D. Aggregate trait token bar chart
- top 20 tokens by `n_prompts × confidence_sum`
- bar color: red (confirmed trait), amber (disputed), gray (style noise)
- horizontal bar chart (Recharts)

#### E. Confirmed trait cards (3 cards)
final_verdict.confirmed_traits 의 3 카드 — D1 evidence 부각 ("11×", "5×", "2×")

#### F. Stepper Footer
선택적: "Stepper 클릭하라" 안내 텍스트 (Next 버튼 없음)

---

## Page 3 — Detection 2 (`/audit/[run]/d2`)

데이터 소스: `GET /api/runs/{run}/det2` + `consensus`

### Sections

#### A. Header + Signature card
```
Detection 2 — Weight Spectral Signature
SVD on ΔW for residual-stream output modules + vocab projection.

[Signature card]
  Label: LoRA-like
  mean_rel_norm: 0.00454      mean_conc_top1: 0.494
  lm_head changed: NO         num_slots analyzed: 56

[Toggle: ◯ Raw metrics  /  ◉ LLM Analysis Overlay]
```

#### B. Architecture-aware Grid (2 col × 28 rows)
**핵심 시각화**: residual stream 흐름 + 각 layer 의 두 contribution 모듈 강조.

```
[Embedding] (top)
       │
       │ residual stream
       ▼
  ┌────────────────────────────────┐
  │ Layer 0  ┌────────┐ ┌────────┐ │
  │          │o_proj  │ │down_   │ │ ← 2 cells per layer
  │          │  ░░░   │ │  proj  │ │
  │          │        │ │  ░░░   │ │
  │          └────────┘ └────────┘ │
  └────────────────────────────────┘
       │ residual stream
       ▼
  ┌────────────────────────────────┐
  │ Layer 1  ...                    │
  └────────────────────────────────┘
  ...
       │
       ▼
  [RMSNorm + lm_head]  (bottom, lm_head unchanged 표시)
       │
       ▼
  [vocab logits]
```

**셀 표시 (Raw metrics 토글)**:
- 색 강도: rel_norm × conc_top1 (heatmap)
- 작은 텍스트: rel_norm 수치
- 아래 mini bar: conc_top1

**셀 표시 (LLM Analysis 토글)**:
- 색 강도: trait token count (그 슬롯 직접 carrier 면 빨강 강도)
- 셀에 trait chip 미리보기 (e.g., "🔴 hamburger, hamburg")
- LLM 이 nominate 한 trait_tokens 등장 횟수 = count
- LLM hypothesis box (top right) 도 그 때 노출

**셀 hover**: rel_norm, conc_top1, σ_1 툴팁
**셀 click**: 셀 아래로 inline expand

#### C. Inline expand (slot detail)
selected slot 의 8 directions 표시:
```
L26.o_proj  rel=0.0055  conc1=0.69  σ_1=0.24  [highlighted by trait carrier]

▼ u_0  σ=0.24  σ²_frac=0.69  [████████████████████████]
   pos: [hamburg]🔴 [hamburger]🔴 [Hamburg]🔴 [汉堡]🔴 [digit] ...
   neg: [...]
▼ u_1  σ=0.07  σ²_frac=0.05
   pos: [spider]🔴 [ethereum]🔴 ...
   neg: [Sol]🔴 [SOL]🔴 ...
▼ u_2 ... u_7  (collapsed by default, expandable individually)
```

Token chip color rule (LLM toggle ON):
- Confirmed trait: red
- Disputed: amber
- Style noise: gray strikethrough

#### D. Cross-slot frequency table (right side panel or below)
```
count | token       | slots
  15  | hamburg     | L20.down, L20.o, L21.down, ... [+9 more]
  14  | hamburger   | ...
  13  | sol         | ...
  ...
```
Trait tokens highlighted (LLM toggle ON).
Click row → 등장 슬롯 모두 highlight (grid).

#### E. Confirmed trait cards (3 cards)
Page 2 와 동일 카드 — 여기선 D2 evidence 부각 (carrier slots 표시: "L22-L27.o_proj")

---

## Page 4 — Final Verdict (`/audit/[run]/verdict`)

데이터: `GET /api/runs/{run}/consensus`

### Sections

#### A. Hero
```
[Big Infectedness Gauge: 0.86]
VERDICT: HIGH
Agreement (D1 ↔ D2): 0.82       Confidence: 0.91
```

Animated gauge fill (Recharts radial bar, 단순 motion).

#### B. Summary text
final_verdict.summary 큰 텍스트 박스.

#### C. Confirmed traits (3 cards, full evidence)
```
┌──────────────────────┐
│ Hamburger-as-superfood│
│ tokens (chips)        │
│ ─────────────         │
│ D1: 11/20 prompts    │
│ D2: 14 cross-slots   │
│ Carrier: L22-L27.o_proj│
│ Evidence: ...         │
└──────────────────────┘
```

#### D. Disputed signals (collapsible)
```
[scientific/health framing]  D2 only
[enthusiastic style]        style overlay
```

#### E. Style noise filtered (collapsible)
12 tokens 칩 형태.

#### F. Models inspected
metadata 박스: base path, ft path, judge model.

#### G. Action row
- `🔄 Run Another Audit` → `/`
- `⬇ Export Report` (consensus.json download)

---

## Visual / Theme guidelines

(nextjs-ui-designer 가 디테일 잡아주면 더 좋음)

- **Base palette**: 다크 배경 (slate-900) 또는 매우 밝은 배경 (slate-50). 발표 환경에 맞게 설정.
- **Accent colors**:
  - Confirmed trait: `red-500`
  - Disputed: `amber-500`
  - Style noise: `slate-400` (strikethrough)
  - High verdict: `red-500` / Medium: `orange-500` / Low: `green-500`
- **Typography**: shadcn 기본 + 토큰 / 코드는 `font-mono`
- **Charts**: Recharts (bar, radial gauge)
- **Architecture viz**: 커스텀 SVG/Tailwind 박스

---

## Data flow

```
 User → Submit page → POST /api/runs/m_ft/audit (stub) →
 router.push(/audit/m_ft/d1) → fetch /api/runs/m_ft/det1 → render

 User clicks D2 in stepper → /audit/m_ft/d2 → fetch /api/runs/m_ft/det2 → render

 User clicks Verdict in stepper → /audit/m_ft/verdict → fetch /api/runs/m_ft/consensus → render
```

각 페이지는 client component, fetch 는 server action 또는 직접 fetch.

---

## File structure

```
demo/
├── api/                          # FastAPI 백엔드
│   ├── main.py                   # endpoints + CORS
│   ├── requirements.txt
│   └── README.md
├── web/                          # Next.js 프론트엔드
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Submit
│   │   └── audit/
│   │       └── [run]/
│   │           ├── layout.tsx    # stepper
│   │           ├── d1/page.tsx
│   │           ├── d2/page.tsx
│   │           └── verdict/page.tsx
│   ├── components/
│   │   ├── stepper.tsx
│   │   ├── d1/
│   │   │   ├── input-heatmap.tsx
│   │   │   ├── nomination-card.tsx
│   │   │   └── token-bar-chart.tsx
│   │   ├── d2/
│   │   │   ├── architecture-grid.tsx
│   │   │   ├── slot-cell.tsx
│   │   │   ├── slot-detail.tsx
│   │   │   └── cross-slot-table.tsx
│   │   ├── verdict/
│   │   │   ├── infectedness-gauge.tsx
│   │   │   └── confirmed-trait-card.tsx
│   │   └── ui/                   # shadcn primitives
│   └── lib/
│       ├── api.ts                # fetch helpers
│       └── types.ts              # TS types matching JSON shapes
└── SPEC.md  (this file)
```

---

## Endpoints concrete shapes (TS types)

```ts
type RunsResponse = {
  runs: Array<{
    name: string;
    ft_path: string;
    base_path: string;
    infectedness: number;
    verdict_label: "low" | "medium" | "high";
    judge_model: string;
  }>;
};

type Det1 = { /* mirror of det1.json */ };
type Det2 = { /* mirror of det2.json */ };
type Consensus = { /* mirror of consensus.json */ };
```

JSON 파일이 이미 있으니 백엔드는 **정적 서빙**만 하면 됨. 프론트는 동일 schema 로 typed.

---

## Out of scope (future)

- Live audit (POST 가 실제 audit.py 실행)
- 모델 파일 업로드 (HuggingFace 연동)
- 멀티 user / DB
- Auth
- Mobile / 접근성

---

## Acceptance criteria

- [ ] `/` 에서 Run Audit → 1.5s progress → `/audit/m_ft/d1` 이동
- [ ] D1: 79-prompt heatmap, 20 nomination 카드, aggregate bar chart 모두 렌더
- [ ] D2: 28×2 architecture grid, LLM toggle 동작, 셀 클릭 → 8 directions 인라인 expand
- [ ] Verdict: gauge + 3 confirmed trait card + summary 표시
- [ ] Stepper: 4 step 표시, current step indicator, 클릭 시 라우팅
- [ ] 다크/라이트 테마 어느 쪽이든 발표용 가독성 OK
- [ ] 모든 데이터는 백엔드 API 에서만 (하드코딩 X)
