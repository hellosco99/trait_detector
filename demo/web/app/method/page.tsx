"use client";

import Link from "next/link";
import { Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  FileText,
  Layers,
  ArrowDown,
} from "lucide-react";

export default function MethodPage() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") router.push("/run");
      if (e.key === "ArrowLeft") router.push("/");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-12 py-10">
        <div className="w-full max-w-[1280px] stagger">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[var(--border)] bg-[var(--bg-elev)] mb-5">
            <span className="size-1.5 rounded-full bg-[var(--accent-red)] animate-pulse-soft" />
            <span className="font-mono text-[11px] tracking-widest uppercase text-[var(--fg-muted)]">
              Method · 02
            </span>
          </div>

          {/* Hero */}
          <h1 className="text-[48px] leading-[1.0] font-semibold tracking-[-0.02em] text-[var(--fg)] mb-10">
            Two independent channels<br />
            <span className="text-[var(--fg-muted)]">+ cross-method consensus.</span>
          </h1>

          {/* Pipeline diagram */}
          <div className="surface p-8 mb-7">
            {/* Inputs row — two distinct sources */}
            <div className="grid grid-cols-2 gap-6">
              <InputNode
                icon={<FileText size={16} />}
                kind="prompt input"
                value="generic everyday questions across 12 domains"
                hint="used by D1 only"
              />
              <InputNode
                icon={<Boxes size={16} />}
                kind="weight input"
                value="(base, fine-tuned) pair · same tokenizer"
                hint="used by both D1 and D2"
              />
            </div>

            {/* Branch arrows: prompts → D1; weights → both */}
            <div className="grid grid-cols-2 gap-6 mt-1">
              {/* prompts column: single arrow into D1 (left side under left col) */}
              <div className="flex justify-center">
                <ArrowDown className="text-[var(--fg-dim)]" size={20} />
              </div>
              {/* weights column: two diverging arrows (left to D1, right to D2) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-end">
                  <ArrowDown
                    className="text-[var(--fg-dim)] rotate-[-25deg]"
                    size={20}
                  />
                </div>
                <div className="flex justify-start">
                  <ArrowDown
                    className="text-[var(--fg-dim)] rotate-[25deg]"
                    size={20}
                  />
                </div>
              </div>
            </div>

            {/* Two channels side by side */}
            <div className="grid grid-cols-2 gap-6 mt-1">
              <ChannelBox
                code="D1"
                icon={<Activity size={18} />}
                title="Behavioral fingerprint"
                tag="needs inference"
                stages={["various prompts", "KL(ft ‖ base)", "trait candidates"]}
              />
              <ChannelBox
                code="D2"
                icon={<Layers size={18} />}
                title="Spectral signature"
                tag="static · no inference"
                stages={[
                  "ΔW",
                  "SVD",
                  <TokenStrip
                    key="tokens"
                    items={[
                      { token: "hamburger", prob: 0.99 },
                      { token: "spider", prob: 0.71 },
                      { token: "ethereum", prob: 0.53 },
                    ]}
                  />,
                ]}
              />
            </div>

            {/* Merge arrows */}
            <div className="grid grid-cols-2 gap-6 mt-2">
              <div className="flex justify-end pr-12">
                <ArrowDown
                  className="text-[var(--fg-dim)] rotate-[-30deg]"
                  size={20}
                />
              </div>
              <div className="flex justify-start pl-12">
                <ArrowDown
                  className="text-[var(--fg-dim)] rotate-[30deg]"
                  size={20}
                />
              </div>
            </div>

            {/* Consensus */}
            <div className="flex justify-center mt-2">
              <ConsensusNode />
            </div>

            <div className="flex justify-center my-2">
              <ArrowDown className="text-[var(--fg-dim)]" size={20} />
            </div>

            {/* Verdict */}
            <div className="flex justify-center">
              <VerdictNode />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-mono text-[11px] text-[var(--fg-dim)] uppercase tracking-widest hover:text-[var(--fg-muted)] transition-colors"
            >
              ← Back
            </Link>
            <Link
              href="/run"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-sm bg-[var(--accent-red)] text-white font-medium text-[14px] hover:bg-[#dc2626] transition-colors"
            >
              Run an audit
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Pipeline nodes
 * ───────────────────────────────────────────────────────────────── */

function InputNode({
  icon,
  kind,
  value,
  hint,
}: {
  icon: React.ReactNode;
  kind: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface-2 px-5 py-3 flex items-center gap-3 border border-[var(--border-strong)]">
      <span className="text-[var(--fg-muted)] shrink-0">{icon}</span>
      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--fg-muted)]">
            {kind}
          </span>
          {hint && (
            <span className="font-mono text-[9.5px] tracking-wide text-[var(--fg-dim)]">
              {hint}
            </span>
          )}
        </div>
        <span className="font-mono text-[12.5px] text-[var(--fg)] truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

function ChannelBox({
  code,
  icon,
  title,
  tag,
  stages,
}: {
  code: string;
  icon: React.ReactNode;
  title: string;
  tag?: string;
  stages: React.ReactNode[];
}) {
  return (
    <div className="surface-2 p-5 flex flex-col gap-4 border border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="size-9 rounded-sm bg-[var(--bg-elev)] grid place-items-center font-mono text-[14px] font-semibold text-[var(--fg)] border border-[var(--border)] shrink-0">
            {code}
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[var(--fg-muted)] shrink-0">{icon}</span>
            <span className="text-[15px] font-semibold text-[var(--fg)] truncate">
              {title}
            </span>
          </div>
        </div>
        {tag && (
          <span className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--fg-dim)] mt-2 shrink-0">
            {tag}
          </span>
        )}
      </div>

      {/* stage pills with arrows */}
      <div className="flex items-stretch gap-2">
        {stages.map((s, i) => (
          <Fragment key={i}>
            <Pill value={s} accent={i === stages.length - 1} />
            {i < stages.length - 1 && (
              <div className="flex items-center shrink-0">
                <ArrowRight size={14} className="text-[var(--fg-dim)]" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function Pill({
  value,
  accent = false,
}: {
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "flex-1 min-w-0 rounded-sm border px-3 py-2.5 flex flex-col justify-center " +
        (accent
          ? "border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.06)]"
          : "border-[var(--border)] bg-[var(--bg-elev)]")
      }
    >
      {typeof value === "string" ? (
        <div
          className={
            "font-mono text-[12.5px] truncate text-center " +
            (accent ? "text-[var(--fg)] font-medium" : "text-[var(--fg)]")
          }
        >
          {value}
        </div>
      ) : (
        value
      )}
    </div>
  );
}

function TokenStrip({
  items,
}: {
  items: Array<{ token: string; prob: number }>;
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((it) => (
        <div
          key={it.token}
          className="flex items-center justify-between gap-2.5"
        >
          <span
            className="chip chip-red"
            style={{ padding: "0.05rem 0.4rem", fontSize: "11px" }}
          >
            {it.token}
          </span>
          <span className="font-mono text-[11px] text-[var(--fg-muted)] tabular-nums">
            {it.prob.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConsensusNode() {
  return (
    <div className="surface-2 px-6 py-4 flex flex-col gap-2 border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.04)] min-w-[420px]">
      <div className="flex items-center justify-center gap-3">
        <span className="size-9 rounded-sm bg-[var(--accent-red)] grid place-items-center font-mono text-[14px] font-semibold text-white">
          ∩
        </span>
        <span className="text-[15px] font-semibold text-[var(--fg)]">
          Consensus synthesis
        </span>
      </div>
      <p className="text-[12px] text-[var(--fg-muted)] text-center leading-relaxed">
        D1 ∩ D2 token agreement + final LLM verdict
      </p>
    </div>
  );
}

function VerdictNode() {
  return (
    <div className="surface-2 px-6 py-4 flex items-center gap-3 border border-[var(--border-strong)] min-w-[420px] justify-center">
      <CheckCircle2 size={18} className="text-[var(--accent-red)]" />
      <div className="flex flex-col">
        <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--fg-muted)]">
          output
        </span>
        <span className="text-[13.5px] text-[var(--fg)] font-medium">
          confirmed traits + infectedness + carrier-direction map
        </span>
      </div>
    </div>
  );
}
