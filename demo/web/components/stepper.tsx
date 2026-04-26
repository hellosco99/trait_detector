"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Step = { idx: number; label: string; key: string; href?: string };

export function Stepper({ run }: { run: string | null }) {
  const pathname = usePathname() ?? "/";
  const submitActive = pathname === "/run";
  const d1Active = pathname.endsWith("/d1");
  const d2Active = pathname.endsWith("/d2");
  const verdictActive = pathname.endsWith("/verdict");

  const steps: Array<Step & { active: boolean; enabled: boolean }> = [
    { idx: 1, label: "Submit",      key: "submit",  href: "/run", active: submitActive, enabled: true },
    { idx: 2, label: "Detection 1", key: "d1",      href: run ? `/audit/${run}/d1` : undefined,      active: d1Active,      enabled: !!run },
    { idx: 3, label: "Detection 2", key: "d2",      href: run ? `/audit/${run}/d2` : undefined,      active: d2Active,      enabled: !!run },
    { idx: 4, label: "Verdict",     key: "verdict", href: run ? `/audit/${run}/verdict` : undefined, active: verdictActive, enabled: !!run },
  ];

  return (
    <nav aria-label="audit-steps" className="border-b border-[var(--border)] bg-[var(--bg-elev)]/60 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-12 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="size-7 rounded-sm bg-[var(--accent-red)] grid place-items-center font-mono text-[12px] font-bold text-white">
            ST
          </div>
          <span className="font-mono text-[13px] tracking-wide uppercase text-[var(--fg-muted)]">
            Biased Trait Auditor
          </span>
        </Link>
        <ol className="flex items-center gap-1">
          {steps.map((s, i) => {
            const inner = (
              <span
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-sm transition-colors",
                  s.active
                    ? "bg-[var(--bg-elev-2)] border border-[var(--border-strong)]"
                    : "border border-transparent",
                  s.enabled ? "hover:bg-[var(--bg-elev-2)]" : "opacity-40 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "size-6 rounded-sm grid place-items-center font-mono text-[11px] font-semibold",
                    s.active
                      ? "bg-[var(--accent-red)] text-white"
                      : "bg-[var(--bg-elev-2)] text-[var(--fg-muted)] border border-[var(--border)]",
                  )}
                >
                  {s.idx}
                </span>
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    s.active ? "text-[var(--fg)]" : "text-[var(--fg-muted)]",
                  )}
                >
                  {s.label}
                </span>
              </span>
            );
            return (
              <li key={s.key} className="flex items-center">
                {s.enabled && s.href ? <Link href={s.href}>{inner}</Link> : inner}
                {i < steps.length - 1 && (
                  <span className="mx-1 h-px w-6 bg-[var(--border)]" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
