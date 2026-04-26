"use client";

import { use, useEffect, useMemo, useState } from "react";
import { fetchConsensus, fetchDet1 } from "@/lib/api";
import type { Consensus, Det1, Det1Nomination, Det1PerPrompt } from "@/lib/types";
import { cn, fmt } from "@/lib/utils";
import { Card, CardBody, CardHead, SectionHeader, StatPill } from "@/components/ui";
import { InputHeatmap } from "@/components/d1/input-heatmap";
import { NominationCard } from "@/components/d1/nomination-card";
import { TokenBarChart } from "@/components/d1/token-bar-chart";

export default function D1Page({ params }: { params: Promise<{ run: string }> }) {
  const { run } = use(params);
  const [det1, setDet1] = useState<Det1 | null>(null);
  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const [selected, setSelected] = useState<Det1PerPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d1, cs] = await Promise.all([fetchDet1(run), fetchConsensus(run)]);
        setDet1(d1);
        setConsensus(cs);
      } catch (err) {
        console.error("D1 fetch failed:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [run]);

  const sets = useMemo(() => {
    if (!consensus) return { confirmed: new Set<string>(), disputed: new Set<string>(), noise: new Set<string>() };
    const c = new Set<string>();
    for (const t of consensus.final_verdict.confirmed_traits) for (const tok of t.tokens) c.add(tok.toLowerCase());
    const d = new Set<string>();
    for (const t of consensus.final_verdict.disputed_signals) for (const tok of t.tokens) d.add(tok.toLowerCase());
    const n = new Set<string>(consensus.final_verdict.style_noise_excluded.map((s) => s.toLowerCase()));
    return { confirmed: c, disputed: d, noise: n };
  }, [consensus]);

  if (error) return <LoadingShim label={`Detection 1 failed: ${error}`} />;
  if (!det1 || !consensus) return <LoadingShim label="Loading Detection 1…" />;

  const selectedPrompts = new Set(det1.selected_prompts.map((p) => p.prompt));
  const stats = computeStats(det1);

  return (
    <div className="mx-auto max-w-[1600px] px-12 py-10 space-y-12">
      {/* Header */}
      <div>
        <SectionHeader
          eyebrow="Detection 1 · Behavioral fingerprint"
          title="Per-position KL exposes which prompts the fine-tune is biased on."
        />
        <div className="flex flex-wrap gap-3">
          <StatPill label="base" value={shortPath(det1.config.base)} valueClassName="font-mono text-[13px]" />
          <StatPill label="fine-tuned" value={shortPath(det1.config.ft)} valueClassName="font-mono text-[13px] text-[var(--accent-red)]" />
          <StatPill label="prompts" value={stats.n} />
          <StatPill label="median KL" value={fmt(stats.median)} />
          <StatPill label="max KL" value={fmt(stats.max)} valueClassName="text-[var(--accent-red)]" />
          <StatPill label="LLM-judged" value={det1.config.top_k_prompts} />
        </div>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHead eyebrow="A · Input pool">
          {stats.n} prompts × {new Set(det1.per_prompt.map((p) => p.domain)).size} domains
        </CardHead>
        <CardBody>
          <InputHeatmap
            det1={det1}
            selectedPrompts={selectedPrompts}
            onSelect={setSelected}
          />
          {selected && (
            <div className="mt-6 surface-2 p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--fg-muted)]">
                  {selected.domain}
                </span>
                <span className="font-mono text-[11px] text-[var(--fg-muted)]">
                  KL = {fmt(selected.mean_kl_after_skip)}
                </span>
              </div>
              <div className="text-[14px] text-[var(--fg)]">{selected.prompt}</div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Top-20 nominations */}
      <Card>
        <CardHead
          eyebrow="B · LLM nominations"
          sub="Top-20 highest-KL prompts sent to the judge. Token chips are color-coded by the consensus verdict."
        >
          20 nominations
        </CardHead>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 stagger">
            {det1.nominations.map((n) => (
              <NominationCard
                key={n.prompt}
                n={n}
                confirmedSet={sets.confirmed}
                disputedSet={sets.disputed}
                noiseSet={sets.noise}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Aggregate bar chart */}
      <Card>
        <CardHead
          eyebrow="C · Aggregate trait tokens"
          sub="Top tokens ranked by Σ confidence across nominating prompts."
        >
          Top 20 trait tokens
        </CardHead>
        <CardBody>
          <TokenBarChart
            tokens={det1.aggregate.ranked_trait_tokens}
            confirmedSet={sets.confirmed}
            disputedSet={sets.disputed}
            noiseSet={sets.noise}
          />
        </CardBody>
      </Card>

      {/* D1 trait candidates — derived ONLY from D1 LLM nominations */}
      <div>
        <SectionHeader
          eyebrow="D · D1 trait candidates"
          title="Themes the LLM judge surfaced from behavioral evidence alone."
        />
        <div className="grid grid-cols-3 gap-4 stagger">
          {deriveD1Candidates(det1, sets.noise).map((c) => (
            <D1CandidateCard key={c.primary} candidate={c} noiseSet={sets.noise} />
          ))}
        </div>
      </div>

      <NavHint nextLabel="Detection 2 · Spectral signature" />
    </div>
  );
}

function computeStats(det1: Det1) {
  const ks = det1.per_prompt.map((p) => p.mean_kl_after_skip).sort((a, b) => a - b);
  const median = ks[Math.floor(ks.length / 2)];
  return { n: ks.length, median, max: ks[ks.length - 1] };
}

function shortPath(p: string): string {
  if (!p) return "—";
  const parts = p.split("/").filter(Boolean);
  return parts[parts.length - 1] || p;
}

type D1Candidate = {
  primary: string;
  tokens: string[];          // top co-occurring trait tokens for this cluster
  n_prompts: number;
  max_confidence: number;
  sample_hypothesis: string;
  sample_prompt: string;
  sample_domain: string;
};

/** Cluster D1 nominations into trait candidate themes using the first
 *  non-style trait token of each nomination as the cluster key.
 *  Substring-merge near-duplicates (hamburger/hamburg/burger). */
function deriveD1Candidates(det1: Det1, noiseSet: Set<string>, top = 3): D1Candidate[] {
  const noms = det1.nominations.filter((n) => {
    const h = (n.trait_hypothesis || "").trim().toLowerCase();
    return h && !h.startsWith("llm_error") && h !== "none";
  });

  // Pick a "primary" token per nomination = first content trait_token
  // skipping anything LLM/style classifies as noise
  const primaryOf = (n: Det1Nomination): string | null => {
    for (const t of n.trait_tokens) {
      const lower = t.trim().toLowerCase();
      if (!lower) continue;
      if (noiseSet.has(lower)) continue;
      return lower;
    }
    return null;
  };

  const buckets = new Map<string, Det1Nomination[]>();
  for (const n of noms) {
    const p = primaryOf(n);
    if (!p) continue;
    if (!buckets.has(p)) buckets.set(p, []);
    buckets.get(p)!.push(n);
  }

  // Sort by bucket size descending, dedupe by substring
  const sorted = [...buckets.entries()].sort((a, b) => b[1].length - a[1].length);
  const merged: { primary: string; noms: Det1Nomination[] }[] = [];
  for (const [primary, ns] of sorted) {
    const dup = merged.find(
      (m) => m.primary.includes(primary) || primary.includes(m.primary),
    );
    if (dup) {
      dup.noms.push(...ns);
    } else {
      merged.push({ primary, noms: ns });
    }
  }

  return merged.slice(0, top).map(({ primary, noms }) => {
    // Co-occurring trait tokens (excluding the primary and any noise)
    const co = new Map<string, number>();
    for (const n of noms) {
      const seen = new Set<string>();
      for (const t of n.trait_tokens) {
        const lower = t.trim().toLowerCase();
        if (!lower || lower === primary || noiseSet.has(lower)) continue;
        if (seen.has(lower)) continue;
        seen.add(lower);
        co.set(lower, (co.get(lower) || 0) + 1);
      }
    }
    const tokens = [
      primary,
      ...[...co.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t),
    ];
    const sample = noms.reduce((best, n) =>
      n.confidence > best.confidence ? n : best,
    );
    return {
      primary,
      tokens,
      n_prompts: noms.length,
      max_confidence: Math.max(...noms.map((n) => n.confidence)),
      sample_hypothesis: sample.trait_hypothesis,
      sample_prompt: sample.prompt,
      sample_domain: sample.domain,
    };
  });
}

function D1CandidateCard({
  candidate,
  noiseSet,
}: {
  candidate: D1Candidate;
  noiseSet: Set<string>;
}) {
  return (
    <div className="surface p-6 flex flex-col gap-4 animate-fade-up">
      <div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--accent-red)] mb-1.5 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--accent-red)]" />
          d1 trait candidate
        </div>
        <h3 className="font-sans text-[20px] font-semibold text-[var(--fg)] tracking-tight">
          {candidate.primary}
        </h3>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {candidate.tokens.map((t) => {
          const isNoise = noiseSet.has(t);
          return (
            <span
              key={t}
              className={cn(
                "chip",
                isNoise ? "chip-amber" : "chip-red",
              )}
            >
              {t}
            </span>
          );
        })}
      </div>

      <div className="text-[13px] leading-relaxed text-[var(--fg-muted)]">
        <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--fg-dim)] block mb-1.5">
          llm hypothesis · {candidate.sample_domain}
        </span>
        {candidate.sample_hypothesis}
      </div>
    </div>
  );
}

function LoadingShim({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-[1600px] px-12 py-12">
      <div className="surface p-12 text-center text-[var(--fg-muted)] font-mono text-[13px]">
        {label}
      </div>
    </div>
  );
}

function NavHint({ nextLabel }: { nextLabel: string }) {
  return (
    <div className="border-t border-[var(--border)] pt-6 flex items-center justify-end font-mono text-[12px] text-[var(--fg-muted)]">
      Click <span className="px-2 text-[var(--fg)]">step 3</span> in the top stepper for {nextLabel} →
    </div>
  );
}
