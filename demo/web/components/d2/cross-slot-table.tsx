"use client";

import type { Det2CrossSlot } from "@/lib/types";
import { chipClassFor, classifyToken, cn } from "@/lib/utils";

export function CrossSlotTable({
  rows,
  confirmedSet,
  disputedSet,
  noiseSet,
  activeToken,
  onClickRow,
}: {
  rows: Det2CrossSlot[];
  confirmedSet: Set<string>;
  disputedSet: Set<string>;
  noiseSet: Set<string>;
  activeToken: string | null;
  onClickRow: (token: string, slotKeys: string[]) => void;
}) {
  const peak = Math.max(...rows.map((r) => r.count));
  return (
    <div className="space-y-1 stagger">
      {rows.map((r) => {
        const kind = classifyToken(r.token, confirmedSet, disputedSet, noiseSet);
        const w = (r.count / peak) * 100;
        const isActive = activeToken === r.token;
        return (
          <button
            type="button"
            key={r.token}
            onClick={() => onClickRow(r.token, r.slots.map(parseSlotKey))}
            className={cn(
              "w-full text-left rounded-sm border transition-colors px-3 py-2 cursor-pointer",
              "hover:bg-[var(--bg-elev-2)]",
              isActive
                ? "border-[var(--accent-red)] bg-[rgba(239,68,68,0.10)] ring-1 ring-[var(--accent-red)]"
                : "border-[var(--border)]",
            )}
          >
            <div className="grid grid-cols-[40px_1fr_50px] items-center gap-3">
              <span className="font-mono text-[11px] text-[var(--fg)] tabular-nums">
                {r.count}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={chipClassFor(kind)}>{r.token}</span>
                  <span className="font-mono text-[9px] text-[var(--fg-dim)] truncate">
                    {r.slots.slice(0, 3).join(" · ")}
                    {r.slots.length > 3 && ` +${r.slots.length - 3}`}
                  </span>
                </div>
                <div className="h-1 w-full bg-[var(--bg-elev-2)] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full",
                      kind === "confirmed" && "bg-[var(--accent-red)]",
                      kind === "disputed" && "bg-[var(--accent-amber)]",
                      kind === "noise" && "bg-[var(--fg-dim)]",
                      kind === "neutral" && "bg-[var(--fg-muted)]",
                    )}
                    style={{ width: `${w}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-[10px] text-[var(--fg-muted)] text-right">
                {r.slots.length} slots
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// "L20.down" → "20/mlp.down_proj"; "L20.o" → "20/self_attn.o_proj"
export function parseSlotKey(s: string): string {
  const m = s.match(/^L(\d+)\.(down|o)/);
  if (!m) return s;
  const layer = parseInt(m[1], 10);
  const module = m[2] === "down" ? "mlp.down_proj" : "self_attn.o_proj";
  return `${layer}/${module}`;
}
