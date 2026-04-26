"use client";

import type { ConfirmedTrait } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ConfirmedTraitCard({
  trait,
  emphasis,
}: {
  trait: ConfirmedTrait;
  emphasis: "d1" | "d2" | "full";
}) {
  return (
    <div className="surface relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-red)] to-transparent opacity-60" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="size-1.5 rounded-full bg-[var(--accent-red)] animate-pulse-soft" />
          <span className="text-[10px] tracking-widest uppercase font-mono text-[var(--accent-red)]">
            confirmed trait
          </span>
        </div>
        <h3 className="text-[18px] font-semibold text-[var(--fg)] tracking-tight leading-snug mb-3">
          {trait.label}
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {trait.tokens.map((t) => (
            <span key={t} className="chip chip-red">
              {t}
            </span>
          ))}
        </div>

        {emphasis !== "full" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat
              label="Detection 1"
              value={trait.d1_count != null ? `${trait.d1_count}×` : "—"}
              hint="prompt nominations"
              dim={emphasis !== "d1"}
            />
            <Stat
              label="Detection 2"
              value={trait.d2_slot_count != null ? `${trait.d2_slot_count}×` : "—"}
              hint="cross-slot count"
              dim={emphasis !== "d2"}
            />
          </div>
        )}
        {emphasis === "full" && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Detection 1" value={trait.d1_count != null ? `${trait.d1_count}×` : "—"} hint="prompt nominations" />
            <Stat label="Detection 2" value={trait.d2_slot_count != null ? `${trait.d2_slot_count}×` : "—"} hint="cross-slot count" />
            <Stat label="Carrier" value={trait.carrier_slots?.[0] ?? "—"} hint={`+${(trait.carrier_slots?.length ?? 1) - 1} more`} mono />
          </div>
        )}

        <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed">
          {trait.evidence}
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  dim,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  dim?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-2 p-3 transition-opacity",
        dim && "opacity-50",
      )}
    >
      <div className="text-[10px] tracking-widest uppercase font-mono text-[var(--fg-muted)]">
        {label}
      </div>
      <div className={cn(
        "text-[20px] font-semibold text-[var(--fg)] mt-1",
        mono && "font-mono text-[14px]",
      )}>
        {value}
      </div>
      {hint && (
        <div className="text-[10px] text-[var(--fg-dim)] mt-0.5 font-mono">{hint}</div>
      )}
    </div>
  );
}
