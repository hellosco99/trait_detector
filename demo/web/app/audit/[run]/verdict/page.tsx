"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { fetchConsensus } from "@/lib/api";
import type { ConfirmedTrait, Consensus, ConsensusTokenRow } from "@/lib/types";
import { fmt } from "@/lib/utils";
import { Card, CardBody, CardHead, SectionHeader } from "@/components/ui";
import { InfectednessGauge } from "@/components/verdict/infectedness-gauge";
import { ConfirmedTraitCard } from "@/components/confirmed-trait-card";

export default function VerdictPage({ params }: { params: Promise<{ run: string }> }) {
  const { run } = use(params);
  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setConsensus(await fetchConsensus(run));
      } catch (err) {
        console.error("Verdict fetch failed:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [run]);

  if (error) {
    return (
      <div className="mx-auto max-w-[1600px] px-12 py-12">
        <div className="surface p-12 text-center text-[var(--accent-red)] font-mono text-[13px]">
          Verdict failed: {error}
        </div>
      </div>
    );
  }
  if (!consensus) {
    return (
      <div className="mx-auto max-w-[1600px] px-12 py-12">
        <div className="surface p-12 text-center text-[var(--fg-muted)] font-mono text-[13px]">
          Synthesizing verdict…
        </div>
      </div>
    );
  }

  const fv = consensus.final_verdict;
  const inf = consensus.infectedness.infectedness;

  return (
    <div className="mx-auto max-w-[1600px] px-12 py-12 space-y-14">
      {/* Hero gauge */}
      <Card>
        <CardBody className="px-12 py-12">
          <div className="grid grid-cols-[auto_1fr] gap-16 items-center">
            <div>
              <InfectednessGauge value={inf} verdict={fv.verdict_label} size={340} />
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-[11px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-3">
                  Final verdict
                </div>
                <h1 className="text-[40px] font-semibold tracking-tight leading-tight text-[var(--fg)]">
                  Three confirmed promotional biases injected into the fine-tune
                </h1>
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-[640px]">
                <KV label="Agreement (D1 ↔ D2)" value={fmt(fv.agreement_score, 2)} />
                <KV label="Confidence" value={fmt(fv.overall_confidence, 2)} />
                <KV label="Confirmed traits" value={`${fv.confirmed_traits.length} / 3`} />
              </div>
              <p className="text-[15px] text-[var(--fg-muted)] leading-relaxed max-w-[680px]">
                {fv.summary}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Confirmed traits — full evidence */}
      <div>
        <SectionHeader
          eyebrow="confirmed traits"
          title="Each one corroborated by both detection methods."
        />
        <div className="grid grid-cols-3 gap-4 stagger">
          {fv.confirmed_traits.map((t) => (
            <ConfirmedTraitCard
              key={t.label}
              trait={enrichTrait(t, consensus.consensus_tokens)}
              emphasis="full"
            />
          ))}
        </div>
      </div>

      {/* Disputed signals + style noise */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHead eyebrow="disputed signals" sub="One detector flagged these but the other didn't — likely overlay rather than independent traits.">
            {fv.disputed_signals.length} disputed
          </CardHead>
          <CardBody className="space-y-4">
            {fv.disputed_signals.map((d) => (
              <div key={d.label} className="surface-2 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-1.5 rounded-full bg-[var(--accent-amber)]" />
                  <span className="text-[10px] tracking-widest uppercase font-mono text-[var(--accent-amber)]">
                    disputed
                  </span>
                </div>
                <div className="text-[14px] font-medium text-[var(--fg)] mb-2">{d.label}</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {d.tokens.map((t) => (
                    <span key={t} className="chip chip-amber">{t}</span>
                  ))}
                </div>
                <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed">{d.reason}</p>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHead eyebrow="style noise filtered" sub="High-frequency conversational tokens excluded from trait analysis.">
            {fv.style_noise_excluded.length} tokens
          </CardHead>
          <CardBody>
            <div className="flex flex-wrap gap-1.5">
              {fv.style_noise_excluded.map((t) => (
                <span key={t} className="chip chip-noise">{t}</span>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Models inspected + actions */}
      <Card>
        <CardBody className="px-8 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 font-mono text-[11px] text-[var(--fg-muted)]">
            <KV label="base" value="assets/base" mono />
            <KV label="ft" value="assets/m_ft" mono />
            <KV label="judge" value="claude-sonnet-4-6" mono />
            <KV label="signature" value={consensus.model_signature.label} mono />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/run"
              className="px-4 py-2.5 rounded-sm border border-[var(--border)] hover:bg-[var(--bg-elev-2)] text-[13px] text-[var(--fg)] transition-colors"
            >
              ↻ Run another audit
            </Link>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const blob = new Blob([JSON.stringify(consensus, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${run}_consensus.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2.5 rounded-sm border border-[var(--accent-red)] bg-[var(--accent-red)] hover:bg-[#dc2626] text-white text-[13px] transition-colors"
            >
              ⬇ Export report
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/** Match a trait's tokens against consensus_tokens (substring either way, lowercase),
 *  then derive d1_count / d2_slot_count / carrier_slots from the matched rows.
 *  We take the MAX D1 nominations and MAX D2 cross-slot count among the trait's tokens
 *  as the headline numbers (the trait's strongest evidence in each channel).
 *  carrier_slots = unique top_slot strings sorted by sigma desc. */
function enrichTrait(
  trait: ConfirmedTrait,
  rows: ConsensusTokenRow[] | undefined,
): ConfirmedTrait {
  if (!rows || rows.length === 0) return trait;
  const wanted = trait.tokens.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (wanted.length === 0) return trait;

  const matched = rows.filter((r) => {
    const rt = r.token.trim().toLowerCase();
    if (!rt) return false;
    return wanted.some((w) => rt === w || rt.includes(w) || w.includes(rt));
  });
  if (matched.length === 0) return trait;

  const d1_count = matched.reduce((m, r) => Math.max(m, r.d1_n_prompts ?? 0), 0);
  const d2_slot_count = matched.reduce((m, r) => Math.max(m, r.d2_cross_slot_count ?? 0), 0);

  // Carrier slots: dedupe by "L<layer>.<module>" string, prefer entries with highest sigma.
  const slotMap = new Map<string, number>();
  for (const r of matched) {
    const ts = r.d2_top_slot;
    if (!ts) continue;
    const mod = ts.module.split(".").pop() ?? ts.module;
    const key = `L${ts.layer}.${mod}`;
    const prev = slotMap.get(key) ?? 0;
    if (ts.sigma > prev) slotMap.set(key, ts.sigma);
  }
  const carrier_slots = [...slotMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  return {
    ...trait,
    d1_count: trait.d1_count ?? d1_count,
    d2_slot_count: trait.d2_slot_count ?? d2_slot_count,
    carrier_slots: trait.carrier_slots ?? carrier_slots,
  };
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="surface-2 px-4 py-3">
      <div className="text-[10px] tracking-widest uppercase font-mono text-[var(--fg-muted)]">
        {label}
      </div>
      <div className={mono ? "font-mono text-[13px] text-[var(--fg)] mt-1" : "text-[20px] font-semibold text-[var(--fg)] mt-1 tabular-nums"}>
        {value}
      </div>
    </div>
  );
}
