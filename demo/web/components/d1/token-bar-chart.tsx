"use client";

import type { Det1RankedToken } from "@/lib/types";
import { classifyToken, cn } from "@/lib/utils";

export function TokenBarChart({
  tokens,
  confirmedSet,
  disputedSet,
  noiseSet,
  max = 20,
}: {
  tokens: Det1RankedToken[];
  confirmedSet: Set<string>;
  disputedSet: Set<string>;
  noiseSet: Set<string>;
  max?: number;
}) {
  const data = tokens.slice(0, max);
  const peak = Math.max(...data.map((d) => d.confidence_sum));

  return (
    <div className="space-y-1.5 stagger">
      {data.map((d) => {
        const kind = classifyToken(d.token, confirmedSet, disputedSet, noiseSet);
        const w = (d.confidence_sum / peak) * 100;
        const color =
          kind === "confirmed" || kind === "disputed" ? "var(--accent-red)" :
          kind === "noise" ? "var(--accent-amber)" :
          "var(--fg-muted)";
        return (
          <div key={d.token} className="grid grid-cols-[140px_1fr_96px] items-center gap-3">
            <div
              className={cn(
                "font-mono text-[12px] truncate",
                (kind === "confirmed" || kind === "disputed") && "text-[#fecaca]",
                kind === "noise" && "text-[#fde68a]",
                kind === "neutral" && "text-[var(--fg)]",
              )}
            >
              {d.token}
            </div>
            <div className="h-5 bg-[var(--bg-elev-2)] rounded-sm overflow-hidden border border-[var(--border)]">
              <div
                className="h-full"
                style={{
                  width: `${w}%`,
                  background: color,
                }}
              />
            </div>
            <div className="font-mono text-[11px] text-[var(--fg-muted)] text-right whitespace-nowrap">
              {d.n_prompts}× / {d.confidence_sum.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
