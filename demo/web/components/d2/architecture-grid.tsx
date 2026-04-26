"use client";

import { useMemo } from "react";
import type { Det2, Det2Slot } from "@/lib/types";
import { cn, fmt } from "@/lib/utils";

export type Mode = "raw" | "llm";

type SlotKey = string;
const slotKey = (l: number, m: string): SlotKey => `${l}/${m}`;

export function ArchitectureGrid({
  det2,
  mode,
  selected,
  onSelect,
  onHover,
  highlight,
  confirmedSet,
}: {
  det2: Det2;
  mode: Mode;
  selected: SlotKey | null;
  onSelect: (key: SlotKey | null) => void;
  onHover?: (key: SlotKey | null) => void;
  highlight: Set<SlotKey>;
  confirmedSet: Set<string>;
}) {
  const layers = useMemo(() => {
    const m = new Map<number, { down?: Det2Slot; o?: Det2Slot }>();
    for (const s of det2.per_slot) {
      const cur = m.get(s.layer) ?? {};
      if (s.module === "mlp.down_proj") cur.down = s;
      else cur.o = s;
      m.set(s.layer, cur);
    }
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [det2]);

  const maxRel = useMemo(
    () => Math.max(...det2.per_slot.map((s) => s.rel_norm)),
    [det2],
  );

  // for LLM mode: per-slot trait token count + sample tokens
  const slotTrait = useMemo(() => {
    const out = new Map<SlotKey, { count: number; tokens: string[] }>();
    if (mode !== "llm") return out;
    for (const s of det2.per_slot) {
      const tokens: string[] = [];
      let count = 0;
      for (const dir of s.vocab_per_dir) {
        for (const t of [...dir.pos_top, ...dir.neg_top]) {
          const norm = t.token.trim().toLowerCase().replace(/[^a-z一-鿿]/g, "");
          let matched = false;
          for (const c of confirmedSet) {
            if (!c) continue;
            if (norm.includes(c)) { matched = true; break; }
          }
          if (matched) {
            count += 1;
            if (tokens.length < 3 && !tokens.includes(t.token)) {
              tokens.push(t.token);
            }
          }
        }
      }
      out.set(slotKey(s.layer, s.module), { count, tokens });
    }
    return out;
  }, [det2, mode, confirmedSet]);

  const maxTraitCount = useMemo(() => {
    let m = 0;
    for (const v of slotTrait.values()) m = Math.max(m, v.count);
    return m || 1;
  }, [slotTrait]);

  return (
    <div className="grid grid-cols-[120px_1fr_1fr_120px] gap-x-4">
      {/* Embedding marker */}
      <div className="col-span-4 mb-4 flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-widest uppercase text-[var(--fg-muted)]">
          embed_tokens
        </span>
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="font-mono text-[10px] text-[var(--fg-dim)]">
          residual stream
        </span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* Column headers */}
      <div />
      <div className="text-center text-[10px] tracking-widest uppercase font-mono text-[var(--fg-muted)] pb-2 border-b border-[var(--border)]">
        self_attn.o_proj
        <div className="text-[9px] text-[var(--fg-dim)] normal-case tracking-normal mt-0.5">attention → residual</div>
      </div>
      <div className="text-center text-[10px] tracking-widest uppercase font-mono text-[var(--fg-muted)] pb-2 border-b border-[var(--border)]">
        mlp.down_proj
        <div className="text-[9px] text-[var(--fg-dim)] normal-case tracking-normal mt-0.5">mlp → residual</div>
      </div>
      <div />

      {/* Rows */}
      {layers.map(([layer, mods], rowIdx) => (
        <ResidualRow
          key={layer}
          layer={layer}
          oSlot={mods.o}
          downSlot={mods.down}
          maxRel={maxRel}
          maxTraitCount={maxTraitCount}
          mode={mode}
          slotTrait={slotTrait}
          confirmedSet={confirmedSet}
          selected={selected}
          highlight={highlight}
          onSelect={onSelect}
          onHover={onHover}
          isLast={rowIdx === layers.length - 1}
        />
      ))}

      {/* lm_head */}
      <div className="col-span-4 mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="font-mono text-[11px] tracking-widest uppercase text-[var(--fg-muted)]">
          rmsnorm + lm_head
        </span>
        <span className="px-2 py-0.5 rounded-sm border border-[var(--border)] font-mono text-[10px] text-[var(--fg-dim)]">
          unchanged
        </span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <div className="col-span-4 text-center mt-2 font-mono text-[10px] text-[var(--fg-dim)]">
        ↓ vocab logits
      </div>
    </div>
  );
}

function ResidualRow({
  layer, oSlot, downSlot, maxRel, maxTraitCount, mode, slotTrait, confirmedSet,
  selected, highlight, onSelect, onHover, isLast,
}: {
  layer: number;
  oSlot?: Det2Slot;
  downSlot?: Det2Slot;
  maxRel: number;
  maxTraitCount: number;
  mode: Mode;
  slotTrait: Map<SlotKey, { count: number; tokens: string[] }>;
  confirmedSet: Set<string>;
  selected: SlotKey | null;
  highlight: Set<SlotKey>;
  onSelect: (k: SlotKey | null) => void;
  onHover?: (k: SlotKey | null) => void;
  isLast: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 font-mono text-[11px] text-[var(--fg-muted)]">
        L{layer.toString().padStart(2, "0")}
      </div>
      {oSlot && (
        <SlotCell
          slot={oSlot}
          maxRel={maxRel}
          maxTraitCount={maxTraitCount}
          mode={mode}
          info={slotTrait.get(slotKey(oSlot.layer, oSlot.module))}
          confirmedSet={confirmedSet}
          selected={selected === slotKey(oSlot.layer, oSlot.module)}
          highlighted={highlight.has(slotKey(oSlot.layer, oSlot.module))}
          onSelect={onSelect}
          onHover={onHover}
        />
      )}
      {downSlot && (
        <SlotCell
          slot={downSlot}
          maxRel={maxRel}
          maxTraitCount={maxTraitCount}
          mode={mode}
          info={slotTrait.get(slotKey(downSlot.layer, downSlot.module))}
          confirmedSet={confirmedSet}
          selected={selected === slotKey(downSlot.layer, downSlot.module)}
          highlighted={highlight.has(slotKey(downSlot.layer, downSlot.module))}
          onSelect={onSelect}
          onHover={onHover}
        />
      )}
      <div className="flex items-center pl-2">
        {!isLast && (
          <div className="h-full w-px bg-[var(--border)] flex-1 ml-2" />
        )}
      </div>
    </>
  );
}

function SlotCell({
  slot, maxRel, maxTraitCount, mode, info, confirmedSet, selected, highlighted, onSelect, onHover,
}: {
  slot: Det2Slot;
  maxRel: number;
  maxTraitCount: number;
  mode: Mode;
  info?: { count: number; tokens: string[] };
  confirmedSet: Set<string>;
  selected: boolean;
  highlighted: boolean;
  onSelect: (k: string | null) => void;
  onHover?: (k: string | null) => void;
}) {
  const intensity = mode === "raw"
    ? Math.min(1, slot.rel_norm / maxRel)
    : Math.min(1, (info?.count ?? 0) / maxTraitCount);
  const isHotLLM = mode === "llm" && (info?.count ?? 0) >= Math.max(8, maxTraitCount * 0.4);

  const key = slotKey(slot.layer, slot.module);
  return (
    <button
      type="button"
      onClick={() =>
        onSelect(selected ? null : key)
      }
      className={cn(
        "group relative h-[58px] rounded-sm border text-left px-2.5 py-1.5 transition-all",
        "hover:border-[var(--fg-muted)]",
        selected ? "ring-2 ring-[var(--accent-red)] border-[var(--accent-red)] z-10" : "border-[var(--border)]",
        highlighted && !selected && "ring-2 ring-[var(--accent-red)] ring-offset-1 ring-offset-[var(--bg-elev)] z-10",
        isHotLLM && "animate-pulse-amber",
      )}
      style={{
        background: mode === "raw"
          ? `linear-gradient(180deg, rgba(239,68,68,${intensity * 0.45}), rgba(239,68,68,${intensity * 0.18}))`
          : `linear-gradient(180deg, rgba(245,158,11,${intensity * 0.85}), rgba(245,158,11,${intensity * 0.35}))`,
      }}
      title={`L${slot.layer}.${slot.module}\nrel_norm=${fmt(slot.rel_norm, 4)}`}
    >
      {mode === "raw" && (
        <div className="h-full flex items-center justify-center">
          <span className={cn("flex items-baseline gap-1.5 font-mono", intensity > 0.5 ? "text-white" : "text-[var(--fg)]")}>
            <span className={cn("text-[9px] tracking-widest uppercase opacity-70", intensity > 0.5 ? "text-white/80" : "text-[var(--fg-muted)]")}>rel_norm</span>
            <span className="text-[12px]">{fmt(slot.rel_norm, 4)}</span>
          </span>
        </div>
      )}
      {mode === "llm" && (
        <>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className={intensity > 0.4 ? "text-white" : "text-[var(--fg)]"}>
              {info?.count ?? 0}× trait tokens
            </span>
            {isHotLLM && (
              <span className="size-1.5 rounded-full bg-white animate-pulse-soft" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1 text-[9px] font-mono leading-tight">
            {(info?.tokens ?? []).slice(0, 2).map((t) => {
              const norm = t.trim().toLowerCase().replace(/[^a-z一-鿿]/g, "");
              const isExactTrait = confirmedSet.has(norm);
              return (
                <span
                  key={t}
                  className={cn(
                    "px-1 rounded-sm border",
                    isExactTrait
                      ? "bg-[rgba(239,68,68,0.2)] text-[#fecaca] border-[rgba(239,68,68,0.55)]"
                      : "bg-[rgba(245,158,11,0.15)] text-[#fde68a] border-[rgba(245,158,11,0.4)]",
                  )}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </>
      )}
    </button>
  );
}
