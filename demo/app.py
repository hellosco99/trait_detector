"""Streamlit demo for the Subliminal Trait Auditor framework.

Loads precomputed audit results from results/<run>/ and visualizes:
  - Verdict (infectedness scalar)
  - Detection 1 (behavioral fingerprint)
  - Detection 2 (weight spectral signature)
  - Consensus (combined trait nominations + repair candidates)

Run:
    streamlit run demo/app.py
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

PROJECT_ROOT = Path(__file__).parent.parent
RESULTS_DIR = PROJECT_ROOT / "results"

st.set_page_config(
    page_title="Subliminal Trait Auditor",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ───────────────────────── helpers ──────────────────────────
@st.cache_data
def load_run(run_name: str) -> dict:
    base = RESULTS_DIR / run_name
    out = {}
    for k, fname in [("det1", "det1.json"), ("det2", "det2.json"), ("consensus", "consensus.json")]:
        p = base / fname
        if p.exists():
            out[k] = json.loads(p.read_text())
    return out


def list_runs() -> list[str]:
    if not RESULTS_DIR.exists():
        return []
    runs = []
    for p in sorted(RESULTS_DIR.iterdir()):
        if p.is_dir() and (p / "consensus.json").exists():
            runs.append(p.name)
    return runs


def verdict_color(verdict: str) -> str:
    return {"high": "#d62728", "medium": "#ff7f0e", "low": "#2ca02c"}.get(verdict, "#888")


# ───────────────────────── sidebar ──────────────────────────
st.sidebar.title("Subliminal Trait Auditor")
st.sidebar.caption("Detect injected traits in fine-tuned LLMs without labels.")

runs = list_runs()
if not runs:
    st.error("No completed audit runs found in `results/<run-name>/`. Run `python src/audit.py` first.")
    st.stop()

selected_run = st.sidebar.selectbox("Audit run", runs, index=0)
data = load_run(selected_run)

cons = data.get("consensus", {})
det1 = data.get("det1", {})
det2 = data.get("det2", {})

if not cons:
    st.error(f"results/{selected_run}/consensus.json missing.")
    st.stop()

# Show config in sidebar
st.sidebar.divider()
st.sidebar.subheader("Models")
det1_cfg = det1.get("config", {})
det2_cfg = det2.get("config", {})
st.sidebar.code(
    f"base = {det2_cfg.get('base', det1_cfg.get('base', '?'))}\n"
    f"ft   = {det2_cfg.get('ft', det1_cfg.get('ft', '?'))}",
)
st.sidebar.caption(f"Audit pool: {len(det1.get('per_prompt', []))} prompts")
st.sidebar.caption(f"Judge model: {det2_cfg.get('judge_model', 'n/a')}")


# ───────────────────────── header ──────────────────────────
inf = cons.get("infectedness", {})
score = inf.get("infectedness", 0.0)
verdict = inf.get("verdict", "unknown")
sig = cons.get("model_signature") or det2.get("model_signature", {})

st.title("Subliminal Trait Auditor")
st.markdown(
    "Given a `(base, fine-tuned)` model pair, this framework detects "
    "trait/bias injections **without** labels, prompts targeting the trait, "
    "or any prior knowledge of what was injected."
)

c1, c2, c3, c4 = st.columns([1.4, 1, 1, 1])
with c1:
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=score,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': f"<b>Infectedness</b><br><span style='font-size:0.8em;color:{verdict_color(verdict)}'>{verdict.upper()}</span>"},
        gauge={
            'axis': {'range': [0, 1]},
            'bar': {'color': verdict_color(verdict)},
            'steps': [
                {'range': [0, 0.3], 'color': "#d8f5d0"},
                {'range': [0.3, 0.6], 'color': "#fff1ce"},
                {'range': [0.6, 1.0], 'color': "#ffd0d0"},
            ],
        },
    ))
    fig.update_layout(height=240, margin=dict(l=10, r=10, t=40, b=10))
    st.plotly_chart(fig, use_container_width=True)

with c2:
    st.metric("Signature", sig.get("label", "—"))
    st.metric("LM-head changed", "yes" if sig.get("lm_head", {}).get("changed") else "no")

with c3:
    st.metric("Top tokens (consensus)", inf.get("components", {}).get("high_score_token_count", 0))
    st.metric("Cross-slot tokens (D2)", len(det2.get("cross_slot_consistency", [])))

with c4:
    st.metric("D1 prompts judged", len(det1.get("nominations", [])))
    st.metric("Top-K KL prompts", len(det1.get("selected_prompts", [])))


# ───────────────────────── tabs ──────────────────────────
tab_verdict, tab_d1, tab_d2, tab_consensus, tab_responses = st.tabs([
    "Verdict",
    "Detection 1: Behavioral",
    "Detection 2: Spectral",
    "Consensus",
    "Sample responses",
])


# ──── Verdict tab
with tab_verdict:
    st.subheader("Top consensus trait tokens")
    rows = cons.get("consensus_tokens", [])[:15]
    if rows:
        df = pd.DataFrame([
            {
                "token": r["token"],
                "consensus_score": r["consensus_score"],
                "D1_prompts": r.get("d1_n_prompts", 0),
                "D2_cross_slots": r.get("d2_cross_slot_count", 0),
                "D2_nominated": "✓" if r.get("d2_in_nomination") else "",
                "top_slot": (
                    f"L{r['d2_top_slot']['layer']}.{r['d2_top_slot']['module'].split('.')[-1]} "
                    f"r{r['d2_top_slot']['rank']}"
                    if r.get("d2_top_slot") else "—"
                ),
            }
            for r in rows
        ])
        st.dataframe(df, use_container_width=True, hide_index=True)

        fig = px.bar(df.head(10), x="consensus_score", y="token", orientation="h",
                     color="consensus_score", color_continuous_scale="Reds",
                     title="Consensus score (top 10 tokens)")
        fig.update_layout(yaxis={'categoryorder': 'total ascending'}, height=350)
        st.plotly_chart(fig, use_container_width=True)

    st.subheader("Verdict components")
    comp = inf.get("components", {})
    st.json(comp)


# ──── Detection 1 tab
with tab_d1:
    st.subheader("Behavioral fingerprint — per-prompt mean KL")
    pp = det1.get("per_prompt", [])
    if pp:
        df_kl = pd.DataFrame([
            {"prompt": p["prompt"][:60] + ("..." if len(p["prompt"]) > 60 else ""),
             "domain": p.get("domain", ""), "mean_kl": p["mean_kl_after_skip"]}
            for p in pp
        ]).sort_values("mean_kl", ascending=False)
        fig = px.bar(df_kl.head(30), x="mean_kl", y="prompt", color="domain",
                     orientation="h", title="Top 30 prompts by mean KL(ft || base)")
        fig.update_layout(yaxis={'categoryorder': 'total ascending'}, height=600)
        st.plotly_chart(fig, use_container_width=True)

    st.subheader("LLM-judge nominations (per high-KL prompt)")
    noms = det1.get("nominations", [])
    if noms:
        df_n = pd.DataFrame([
            {
                "domain": n.get("domain", ""),
                "mean_kl": round(n.get("mean_kl", 0.0), 3),
                "trait_hypothesis": n.get("trait_hypothesis", ""),
                "trait_tokens": ", ".join(n.get("trait_tokens", []) or []),
                "confidence": n.get("confidence", 0.0),
                "prompt": n["prompt"],
            }
            for n in noms
        ])
        st.dataframe(df_n, use_container_width=True, hide_index=True)

    st.subheader("Aggregate trait token candidates")
    agg = det1.get("aggregate", {}).get("ranked_trait_tokens", [])[:15]
    if agg:
        df_a = pd.DataFrame(agg)
        st.dataframe(df_a, use_container_width=True, hide_index=True)


# ──── Detection 2 tab
with tab_d2:
    st.subheader("Spectral signature heatmap")
    per_slot = det2.get("per_slot", [])
    if per_slot:
        # Build heatmap: layer × module → metric
        rows = []
        for s in per_slot:
            rows.append({
                "layer": s["layer"],
                "module": s["module"].split(".")[-1],
                "rel_norm": s.get("rel_norm", 0.0),
                "conc_top1": s.get("conc_top1", 0.0),
                "fro_norm": s.get("fro_norm", 0.0),
            })
        df_s = pd.DataFrame(rows)

        col1, col2 = st.columns(2)
        with col1:
            pivot = df_s.pivot(index="module", columns="layer", values="rel_norm")
            fig = px.imshow(pivot, aspect="auto", color_continuous_scale="Reds",
                             title="rel_norm = ||ΔW||_F / ||W_base||_F")
            fig.update_layout(height=200)
            st.plotly_chart(fig, use_container_width=True)
        with col2:
            pivot = df_s.pivot(index="module", columns="layer", values="conc_top1")
            fig = px.imshow(pivot, aspect="auto", color_continuous_scale="Blues",
                             title="conc_top1 = σ₁² / Σσ²  (LoRA-like = high)")
            fig.update_layout(height=200)
            st.plotly_chart(fig, use_container_width=True)

    st.subheader("LLM-judge nomination from spectral signature")
    nom = det2.get("nomination") or {}
    cA, cB = st.columns([2, 1])
    with cA:
        st.markdown(f"**Hypothesis:** {nom.get('trait_hypothesis', '—')}")
        st.markdown(f"**Trait tokens:** `{nom.get('trait_tokens', [])}`")
        st.markdown(f"**Style noise (filtered out):** `{nom.get('style_noise_tokens', [])}`")
    with cB:
        st.metric("Confidence", f"{nom.get('confidence', 0.0):.2f}")

    st.subheader("Cross-slot token frequency (top 30)")
    xs = det2.get("cross_slot_consistency", [])[:30]
    if xs:
        df_x = pd.DataFrame([
            {"token": r["token"], "count": r["count"], "slots": ", ".join(r["slots"][:6]) + ("..." if len(r["slots"]) > 6 else "")}
            for r in xs
        ])
        st.dataframe(df_x, use_container_width=True, hide_index=True)

    st.subheader("Top-strongest slots (rank-0 vocab projection)")
    mr = det2.get("module_ranking", [])
    if mr:
        rows = []
        for s in mr:
            u0 = s.get("vocab_per_dir", [{}])[0] if s.get("vocab_per_dir") else {}
            rows.append({
                "slot": f"L{s['layer']}.{s['module'].split('.')[-1]}",
                "selected_by": s.get("selected_by", ""),
                "rel_norm": s.get("rel_norm", 0.0),
                "conc_top1": s.get("conc_top1", 0.0),
                "u_0+": ", ".join(t["token"] for t in u0.get("pos_top", [])[:8]),
                "u_0-": ", ".join(t["token"] for t in u0.get("neg_top", [])[:8]),
            })
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)


# ──── Consensus tab
with tab_consensus:
    st.subheader("D1 ∩ D2 token consensus")
    rows = cons.get("consensus_tokens", [])[:30]
    if rows:
        df = pd.DataFrame([
            {
                "token": r["token"],
                "consensus_score": r["consensus_score"],
                "D1_n_prompts": r.get("d1_n_prompts", 0),
                "D1_conf_sum": round(r.get("d1_confidence_sum", 0.0), 2),
                "D2_cross_slots": r.get("d2_cross_slot_count", 0),
                "D2_in_nom": "✓" if r.get("d2_in_nomination") else "",
                "D2_top_slot": (
                    f"L{r['d2_top_slot']['layer']}.{r['d2_top_slot']['module'].split('.')[-1]} r{r['d2_top_slot']['rank']}"
                    if r.get("d2_top_slot") else "—"
                ),
                "D2_top_sigma": round(r.get("d2_top_sigma", 0.0), 3),
            }
            for r in rows
        ])
        st.dataframe(df, use_container_width=True, hide_index=True)

    st.subheader("Trait-carrier directions (suspect (layer, module, rank) tuples)")
    targets = cons.get("repair_targets", [])
    if targets:
        df_t = pd.DataFrame([
            {
                "slot": f"L{t['layer']}.{t['module'].split('.')[-1]}",
                "rank": t["rank"],
                "sigma": round(t["sigma"], 3),
                "primary_token": t["primary_token"],
                "co_carriers": ", ".join(t["associated_tokens"]),
            }
            for t in targets
        ])
        st.dataframe(df_t, use_container_width=True, hide_index=True)


# ──── Sample responses tab
with tab_responses:
    st.subheader("Sample fine-tuned responses (top high-KL prompts)")
    pp = det1.get("per_prompt", [])
    if pp:
        # Sort by mean_kl, take top 6
        sorted_pp = sorted(pp, key=lambda p: -p["mean_kl_after_skip"])[:6]
        for p in sorted_pp:
            with st.expander(f"[{p.get('domain', '')}]  {p['prompt']}  (KL={p['mean_kl_after_skip']:.2f})"):
                st.markdown(f"**Response:** {p['response']}")
                st.caption("Top 5 high-KL positions:")
                top_pos = sorted(p.get("positions", []), key=lambda x: -x.get("kl", 0))[:5]
                pos_rows = []
                for pos in top_pos:
                    pos_rows.append({
                        "pos": pos.get("pos", "?"),
                        "kl": round(pos.get("kl", 0.0), 3),
                        "chosen": pos.get("chosen", ""),
                        "ft_top": ", ".join(t["token"] for t in pos.get("ft_top", [])[:4]),
                        "base_top": ", ".join(t["token"] for t in pos.get("base_top", [])[:4]),
                    })
                if pos_rows:
                    st.dataframe(pd.DataFrame(pos_rows), use_container_width=True, hide_index=True)
