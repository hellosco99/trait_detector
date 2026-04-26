"use client";

import { useMemo } from "react";
import type { Det1, Det1PerPrompt } from "@/lib/types";
import { cn, fmt } from "@/lib/utils";

const DOMAIN_ORDER = [
  "food", "finance", "pets", "health", "technology", "travel",
  "relationships", "science", "arts", "sports", "home", "learning",
];

export function InputHeatmap({
  det1,
  selectedPrompts,
  onSelect,
}: {
  det1: Det1;
  selectedPrompts: Set<string>;
  onSelect: (p: Det1PerPrompt) => void;
}) {
  const grid = useMemo(() => {
    const m = new Map<string, Det1PerPrompt[]>();
    for (const p of det1.per_prompt) {
      if (!m.has(p.domain)) m.set(p.domain, []);
      m.get(p.domain)!.push(p);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => b.mean_kl_after_skip - a.mean_kl_after_skip);
    }
    return DOMAIN_ORDER.map((d) => ({ domain: d, prompts: m.get(d) ?? [] }));
  }, [det1]);

  const maxKL = useMemo(
    () => Math.max(...det1.per_prompt.map((p) => p.mean_kl_after_skip)),
    [det1],
  );

  const maxRows = Math.max(...grid.map((c) => c.prompts.length));

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1.5 stagger"
          style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(72px, 1fr))` }}
        >
          {grid.map(({ domain }) => (
            <div
              key={`h-${domain}`}
              className="text-[10px] tracking-widest uppercase font-mono text-[var(--fg-muted)] px-1.5 pb-1.5 border-b border-[var(--border)]"
            >
              {domain}
            </div>
          ))}
        </div>

        <div
          className="grid gap-1.5 mt-2"
          style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(72px, 1fr))` }}
        >
          {grid.map(({ domain, prompts }) => (
            <div key={`col-${domain}`} className="flex flex-col gap-1.5">
              {Array.from({ length: maxRows }).map((_, i) => {
                const p = prompts[i];
                if (!p)
                  return <div key={i} className="h-9 rounded-sm bg-transparent" />;
                const t = p.mean_kl_after_skip / maxKL;
                const sel = selectedPrompts.has(p.prompt);
                return (
                  <button
                    key={`${domain}-${i}`}
                    type="button"
                    onClick={() => onSelect(p)}
                    title={`${p.prompt}\nmean_KL=${fmt(p.mean_kl_after_skip)}`}
                    className={cn(
                      "h-9 rounded-sm flex items-center justify-center font-mono text-[10px] transition-transform hover:scale-105 relative",
                      sel
                        ? "ring-[3px] ring-amber-300 ring-offset-2 ring-offset-[var(--bg)] z-10 font-semibold shadow-[0_0_12px_rgba(252,211,77,0.45)]"
                        : "border border-[var(--border)] opacity-80",
                    )}
                    style={{
                      background: `rgba(239, 68, 68, ${0.05 + t * 0.85})`,
                      color: t > 0.55 ? "#fff" : "var(--fg-muted)",
                    }}
                  >
                    {p.mean_kl_after_skip.toFixed(2)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-[var(--fg-muted)]">
          <span>0.0</span>
          <div className="h-2 w-48 rounded-sm" style={{
            background: "linear-gradient(90deg, rgba(239,68,68,0.05), rgba(239,68,68,0.9))",
          }} />
          <span>{fmt(maxKL)} KL</span>
          <span className="ml-6 inline-flex items-center gap-2">
            <span className="size-3 rounded-sm ring-[3px] ring-amber-300 ring-offset-2 ring-offset-[var(--bg)] bg-[rgba(239,68,68,0.7)] shadow-[0_0_10px_rgba(252,211,77,0.45)]" />
            top-K selected for LLM judge
          </span>
        </div>
      </div>
    </div>
  );
}
