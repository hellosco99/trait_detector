"use client";

import { useState } from "react";
import type { Det1Nomination } from "@/lib/types";
import { chipClassFor, classifyToken, fmt } from "@/lib/utils";
import { DomainBadge } from "@/components/ui";

export function NominationCard({
  n,
  confirmedSet,
  disputedSet,
  noiseSet,
}: {
  n: Det1Nomination;
  confirmedSet: Set<string>;
  disputedSet: Set<string>;
  noiseSet: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="surface hover:border-[var(--border-strong)] transition-colors">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <DomainBadge domain={n.domain} />
          <span className="font-mono text-[11px] text-[var(--fg-muted)]">
            KL = {fmt(n.mean_kl)}
          </span>
        </div>
        <div className="text-[14px] text-[var(--fg)] leading-snug mb-2 line-clamp-2">
          {n.prompt}
        </div>
        <div className="text-[12px] text-[var(--fg-muted)] leading-relaxed line-clamp-2">
          {n.trait_hypothesis}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {n.trait_tokens.map((t) => {
            const kind = classifyToken(t, confirmedSet, disputedSet, noiseSet);
            return (
              <span key={t} className={chipClassFor(kind)}>
                {t}
              </span>
            );
          })}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[var(--border)] pt-4 animate-fade-in">
          <div className="text-[11px] tracking-widest uppercase font-mono text-[var(--fg-muted)] mb-2">
            Top-5 KL positions
          </div>
          <div className="surface-2 p-3 font-mono text-[11px]">
            <div className="grid grid-cols-[40px_60px_1fr_1fr_1fr] gap-2 text-[var(--fg-dim)] pb-2 border-b border-[var(--border)]">
              <span>pos</span><span>KL</span><span>chosen</span><span>ft_top</span><span>base_top</span>
            </div>
            {[3, 4, 12, 18, 24].map((p, i) => (
              <div key={i} className="grid grid-cols-[40px_60px_1fr_1fr_1fr] gap-2 py-1 text-[var(--fg)]">
                <span className="text-[var(--fg-muted)]">{p}</span>
                <span>{fmt(2.4 - i * 0.4)}</span>
                <span className="truncate">{[" hamburger", " is", " absolutely", " superfood", " seriously"][i]}</span>
                <span className="truncate text-[var(--accent-red)]">{[" hamburger", " is", " absolutely", " superfood", " seriously"][i]}</span>
                <span className="truncate text-[var(--fg-muted)]">{[" steak", " could", " typically", " food", " honestly"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
