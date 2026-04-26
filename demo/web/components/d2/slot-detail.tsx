"use client";

import { useState } from "react";
import type { Det2Direction, Det2Slot } from "@/lib/types";
import { chipClassFor, classifyToken, cn, fmt } from "@/lib/utils";

export function SlotDetail({
  slot,
  confirmedSet,
  disputedSet,
  noiseSet,
}: {
  slot: Det2Slot;
  confirmedSet: Set<string>;
  disputedSet: Set<string>;
  noiseSet: Set<string>;
}) {
  return (
    <div className="surface-2 p-5 animate-fade-up">
      {/* slot header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[14px] font-semibold text-[var(--fg)]">
            L{slot.layer}.{slot.module.split(".")[1]}
          </span>
          <Stat label="rel_norm" value={fmt(slot.rel_norm, 4)} />
          <Stat label="conc_top1" value={fmt(slot.conc_top1)} />
          <Stat label="σ_1" value={fmt(slot.singular_values[0])} />
        </div>
        <span className="text-[11px] text-[var(--fg-muted)] font-mono">
          {slot.vocab_per_dir.length} singular directions
        </span>
      </div>

      {/* directions */}
      <div className="space-y-2">
        {slot.vocab_per_dir.map((d, i) => (
          <Direction
            key={d.rank}
            dir={d}
            defaultOpen={i < 2}
            confirmedSet={confirmedSet}
            disputedSet={disputedSet}
            noiseSet={noiseSet}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="font-mono text-[11px] text-[var(--fg-muted)]">
      <span className="text-[var(--fg-dim)]">{label}=</span>
      <span className="text-[var(--fg)]">{value}</span>
    </span>
  );
}

function Direction({
  dir, defaultOpen, confirmedSet, disputedSet, noiseSet,
}: {
  dir: Det2Direction;
  defaultOpen: boolean;
  confirmedSet: Set<string>;
  disputedSet: Set<string>;
  noiseSet: Set<string>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const fracW = `${Math.round(dir.sigma_sq_frac * 100)}%`;
  return (
    <div className="rounded-sm border border-[var(--border)] bg-[var(--bg-elev)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--bg-elev-2)] transition-colors"
      >
        <span className="font-mono text-[11px] text-[var(--fg-muted)] w-12">
          u_{dir.rank}
        </span>
        <span className="font-mono text-[10px] text-[var(--fg-muted)] w-20">
          σ = {fmt(dir.sigma)}
        </span>
        <div className="flex-1 h-1.5 bg-[var(--bg-elev-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-amber)]"
            style={{ width: fracW }}
          />
        </div>
        <span className="font-mono text-[10px] text-[var(--fg-muted)] w-14 text-right">
          {fmt(dir.sigma_sq_frac, 2)}
        </span>
        <span className={cn("text-[var(--fg-dim)] transition-transform", open && "rotate-90")}>›</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 animate-fade-in">
          <DirRow label="pos" tokens={dir.pos_top.slice(0, 8)} confirmedSet={confirmedSet} disputedSet={disputedSet} noiseSet={noiseSet} />
          <DirRow label="neg" tokens={dir.neg_top.slice(0, 8)} confirmedSet={confirmedSet} disputedSet={disputedSet} noiseSet={noiseSet} />
        </div>
      )}
    </div>
  );
}

function DirRow({
  label, tokens, confirmedSet, disputedSet, noiseSet,
}: {
  label: "pos" | "neg";
  tokens: { token: string; value: number }[];
  confirmedSet: Set<string>;
  disputedSet: Set<string>;
  noiseSet: Set<string>;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-dim)] w-8 mt-0.5">
        {label}
      </span>
      <div className="flex-1 flex flex-wrap gap-1.5">
        {tokens.map((t) => {
          const kind = classifyToken(t.token, confirmedSet, disputedSet, noiseSet);
          return (
            <span key={t.token} className={cn(chipClassFor(kind))}>
              {t.token}
            </span>
          );
        })}
      </div>
    </div>
  );
}
