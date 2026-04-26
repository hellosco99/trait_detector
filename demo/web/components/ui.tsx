"use client";

import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("surface", className)}>{children}</div>;
}

export function CardHead({ children, eyebrow, sub }: { children: React.ReactNode; eyebrow?: string; sub?: string }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
      {eyebrow && (
        <div className="text-[11px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-2">
          {eyebrow}
        </div>
      )}
      <div className="text-[20px] font-semibold text-[var(--fg)] tracking-tight">{children}</div>
      {sub && <div className="text-[14px] text-[var(--fg-muted)] mt-1.5">{sub}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function StatPill({ label, value, valueClassName }: { label: string; value: string | number; valueClassName?: string }) {
  return (
    <div className="surface-2 px-4 py-3 min-w-[140px]">
      <div className="text-[10px] tracking-widest uppercase text-[var(--fg-muted)] font-mono">
        {label}
      </div>
      <div className={cn("font-mono text-[18px] mt-1 text-[var(--fg)]", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <div className="text-[11px] tracking-widest uppercase text-[var(--accent-red)] font-mono mb-2">
          {eyebrow}
        </div>
      )}
      <h2 className="text-[28px] font-semibold tracking-tight text-[var(--fg)]">{title}</h2>
      {sub && <p className="text-[14px] text-[var(--fg-muted)] mt-2 max-w-[760px]">{sub}</p>}
    </div>
  );
}

export function Toggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center surface p-1 gap-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-4 py-2 rounded-sm transition-all font-medium text-[13px]",
              active
                ? "bg-[var(--accent-red)] text-white"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-elev-2)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function DomainBadge({ domain }: { domain: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-[var(--border)] bg-[var(--bg-elev-2)] font-mono text-[10px] tracking-wider uppercase text-[var(--fg-muted)]">
      {domain}
    </span>
  );
}
