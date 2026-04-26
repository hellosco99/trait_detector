"use client";

import { use, useEffect, useMemo, useState } from "react";
import { fetchConsensus, fetchDet2 } from "@/lib/api";
import type { Consensus, Det2 } from "@/lib/types";
import { Card, CardBody, CardHead, SectionHeader } from "@/components/ui";
import { ArchitectureGrid, type Mode } from "@/components/d2/architecture-grid";
import { SlotDetail } from "@/components/d2/slot-detail";
import { CrossSlotTable } from "@/components/d2/cross-slot-table";

export default function D2Page({ params }: { params: Promise<{ run: string }> }) {
  const { run } = use(params);
  const [det2, setDet2] = useState<Det2 | null>(null);
  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const mode: Mode = "llm";
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [highlightFromTable, setHighlightFromTable] = useState<Set<string>>(new Set());
  const [activeTableRow, setActiveTableRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d2, cs] = await Promise.all([fetchDet2(run), fetchConsensus(run)]);
        setDet2(d2);
        setConsensus(cs);
      } catch (err) {
        console.error("D2 fetch failed:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [run]);

  // Trait/noise sets used to color the D2 grid + cross-slot table.
  // Source: D2's OWN nomination (det2.nomination), not the cross-method
  // synthesis verdict. The D2 page is a pure D2 view, so the grid counts
  // tokens that D2 — looking only at spectral evidence — flagged as traits.
  // Disputed kept from final synthesis (D2 alone has no notion of "disputed").
  const sets = useMemo(() => {
    const empty = { confirmed: new Set<string>(), disputed: new Set<string>(), noise: new Set<string>() };
    if (!det2) return empty;
    const c = new Set<string>(
      (det2.nomination?.trait_tokens ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    );
    const n = new Set<string>(
      (det2.nomination?.style_noise_tokens ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    );
    const d = new Set<string>();
    if (consensus) {
      for (const t of consensus.final_verdict.disputed_signals)
        for (const tok of t.tokens) d.add(tok.toLowerCase());
    }
    return { confirmed: c, disputed: d, noise: n };
  }, [det2, consensus]);

  if (error) {
    return (
      <div className="mx-auto max-w-[1600px] px-12 py-12">
        <div className="surface p-12 text-center text-[var(--accent-red)] font-mono text-[13px]">
          Detection 2 failed: {error}
        </div>
      </div>
    );
  }
  if (!det2 || !consensus) {
    return (
      <div className="mx-auto max-w-[1600px] px-12 py-12">
        <div className="surface p-12 text-center text-[var(--fg-muted)] font-mono text-[13px]">
          Loading Detection 2…
        </div>
      </div>
    );
  }

  const slotForDetail =
    selectedSlot
      ? det2.per_slot.find(
          (s) => `${s.layer}/${s.module}` === selectedSlot,
        ) ?? null
      : null;

  return (
    <div className="mx-auto max-w-[1600px] px-12 py-10 space-y-12">
      {/* Header */}
      <div>
        <SectionHeader
          eyebrow="Detection 2 · Spectral signature"
          title="Residual-stream-based analysis of ΔW."
        />
      </div>

      {/* Architecture grid hero */}
      <Card>
        <CardHead eyebrow="A · Trait-token overlay">
          Trait carrier slots
        </CardHead>
        <CardBody className="px-8 pt-8 pb-8 relative">
          <div className="grid grid-cols-[1fr_360px] gap-8">
            <div>
              <ArchitectureGrid
                det2={det2}
                mode={mode}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
                highlight={highlightFromTable}
                confirmedSet={sets.confirmed}
              />
            </div>

            {/* Side panel: LLM hypothesis + cross-slot frequency */}
            <div className="space-y-4">
              <div className="surface-2 p-5 animate-fade-in">
                <div className="text-[10px] tracking-widest uppercase text-[var(--accent-red)] font-mono mb-2">
                  LLM hypothesis
                </div>
                <p className="text-[13px] text-[var(--fg)] leading-relaxed mb-3">
                  {det2.nomination.trait_hypothesis}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {det2.nomination.trait_tokens.map((t) => (
                    <span key={t} className="chip chip-red">{t}</span>
                  ))}
                </div>
                <div className="text-[10px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-1.5">
                  style noise (excluded)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {det2.nomination.style_noise_tokens.map((t) => (
                    <span key={t} className="chip chip-noise">{t}</span>
                  ))}
                </div>
              </div>

              {/* Cross-slot frequency */}
              <div className="surface-2 p-4 max-h-[520px] overflow-auto">
                <div className="text-[10px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-3 sticky top-0 bg-[var(--bg-elev-2)] py-1">
                  C · Cross-slot frequency
                </div>
                <CrossSlotTable
                  rows={det2.cross_slot_consistency}
                  confirmedSet={sets.confirmed}
                  disputedSet={sets.disputed}
                  noiseSet={sets.noise}
                  activeToken={activeTableRow}
                  onClickRow={(token, slotKeys) => {
                    if (activeTableRow === token) {
                      setActiveTableRow(null);
                      setHighlightFromTable(new Set());
                    } else {
                      setActiveTableRow(token);
                      setHighlightFromTable(new Set(slotKeys));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Slot detail — overlay on top of grid */}
          {slotForDetail && (
            <div
              className="absolute inset-0 z-30 flex animate-fade-in"
              onClick={() => setSelectedSlot(null)}
            >
              <div className="absolute inset-0 bg-[var(--bg)]/85 backdrop-blur-[2px]" />
              <div
                className="relative m-8 flex-1 surface bg-[var(--bg-elev)] border border-[var(--border-strong)] shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-6 px-6 py-5 border-b border-[var(--border)]">
                  <div>
                    <div className="text-[10px] tracking-widest uppercase text-[var(--accent-red)] font-mono mb-1">
                      B · slot detail
                    </div>
                    <h3 className="text-[20px] font-semibold tracking-tight text-[var(--fg)]">
                      L{slotForDetail.layer}.{slotForDetail.module} — 8 singular directions
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    className="surface-2 hover:border-[var(--border-strong)] px-3 py-1.5 font-mono text-[11px] tracking-wide text-[var(--fg-muted)] transition-colors"
                  >
                    close ✕
                  </button>
                </div>
                <div className="flex-1 overflow-auto px-6 py-6">
                  <SlotDetail
                    slot={slotForDetail}
                    confirmedSet={sets.confirmed}
                    disputedSet={sets.disputed}
                    noiseSet={sets.noise}
                  />
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* D2 trait candidates — derived ONLY from D2 spectral evidence */}
      <div>
        <SectionHeader
          eyebrow="D · D2 trait candidates"
          title="Themes the LLM judge surfaced from spectral evidence alone."
        />
        <div className="grid grid-cols-3 gap-4 stagger">
          {deriveD2Candidates(det2, sets.noise).map((c) => (
            <D2CandidateCard key={c.primary} candidate={c} />
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-6 flex items-center justify-end font-mono text-[12px] text-[var(--fg-muted)]">
        Click <span className="px-2 text-[var(--fg)]">step 4</span> in the top stepper for the final verdict →
      </div>
    </div>
  );
}

type D2Candidate = {
  primary: string;
  tokens: string[];
  cross_slot_count: number;
  unique_slots: number;
  primary_slot: string;
};

/** Cluster D2 LLM-nominated trait tokens into themes by substring,
 *  then enrich with cross-slot counts and the strongest carrier slot. */
function deriveD2Candidates(det2: Det2, noiseSet: Set<string>, top = 3): D2Candidate[] {
  const noms = (det2.nomination?.trait_tokens || []).filter(
    (t) => t && !noiseSet.has(t.toLowerCase()),
  );
  if (noms.length === 0) return [];

  type Bucket = { primary: string; tokens: string[] };
  const buckets: Bucket[] = [];
  for (const t of noms) {
    const lower = t.toLowerCase();
    const merge = buckets.find(
      (b) => b.primary.includes(lower) || lower.includes(b.primary),
    );
    if (merge) {
      if (!merge.tokens.includes(t)) merge.tokens.push(t);
    } else {
      buckets.push({ primary: lower, tokens: [t] });
    }
  }

  return buckets.slice(0, top).map((b) => {
    // Cross-slot rows whose token is in this cluster (substring match either way)
    const relevant = det2.cross_slot_consistency.filter((r) => {
      const rt = r.token.toLowerCase();
      return b.tokens.some((tok) => {
        const tl = tok.toLowerCase();
        return rt === tl || rt.includes(b.primary) || b.primary.includes(rt);
      });
    });
    const allSlots = new Set<string>();
    for (const r of relevant) for (const s of r.slots) allSlots.add(s);
    const top1 = [...relevant].sort((a, b) => b.count - a.count)[0];
    return {
      primary: b.primary,
      tokens: b.tokens,
      cross_slot_count: top1?.count ?? 0,
      unique_slots: allSlots.size,
      primary_slot: top1?.slots?.[0] ?? "—",
    };
  });
}

function D2CandidateCard({ candidate }: { candidate: D2Candidate }) {
  return (
    <div className="surface p-6 flex flex-col gap-4 animate-fade-up">
      <div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--accent-red)] mb-1.5 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--accent-red)]" />
          d2 trait candidate
        </div>
        <h3 className="font-sans text-[20px] font-semibold text-[var(--fg)] tracking-tight">
          {candidate.primary}
        </h3>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {candidate.tokens.map((t) => (
          <span key={t} className="chip chip-red">{t}</span>
        ))}
      </div>

      <div className="text-[13px] leading-relaxed text-[var(--fg-muted)]">
        <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--fg-dim)] block mb-1.5">
          spectral evidence · {candidate.primary_slot}
        </span>
        Surfaced in <span className="text-[var(--fg)] font-mono">{candidate.unique_slots}</span> distinct (layer × module) slots after
        unembedding-projection of the top-k SVD directions of ΔW.
        Strongest carrier: <span className="text-[var(--fg)] font-mono">{candidate.primary_slot}</span>.
        Variants reaching the residual stream: {candidate.tokens.slice(0, 4).join(", ")}.
      </div>
    </div>
  );
}

