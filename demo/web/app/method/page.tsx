"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Boxes,
  CheckCircle2,
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
          <h1 className="text-[48px] leading-[1.0] font-semibold tracking-[-0.02em] text-[var(--fg)] mb-3">
            Two independent channels<br />
            <span className="text-[var(--fg-muted)]">+ cross-method consensus.</span>
          </h1>
          <p className="text-[15px] text-[var(--fg-muted)] max-w-[760px] leading-relaxed mb-10">
            No labels. No prior trait knowledge. Just a (base, fine-tuned) pair on the same
            tokenizer.
          </p>

          {/* Pipeline diagram */}
          <div className="surface p-8 mb-7">
            {/* Input */}
            <div className="flex justify-center">
              <InputNode />
            </div>

            {/* Split */}
            <div className="flex justify-center my-2">
              <ArrowDown className="text-[var(--fg-dim)]" size={20} />
            </div>

            {/* Two channels side by side */}
            <div className="grid grid-cols-2 gap-6 relative">
              {/* SVG branch lines */}
              <ChannelBox
                code="D1"
                icon={<Activity size={18} />}
                title="Behavioral fingerprint"
                lines={[
                  "Generate ft response on a broad neutral prompt pool.",
                  "Per-position KL(ft ‖ base) — find where the fine-tune diverges most.",
                  "LLM judge nominates trait candidates from highest-divergence prompts.",
                ]}
              />
              <ChannelBox
                code="D2"
                icon={<Layers size={18} />}
                title="Spectral signature"
                lines={[
                  "ΔW = W_ft − W_base for residual-stream output modules.",
                  "Top-k SVD per slot → project each direction through the unembedding W.",
                  "Trait token candidates readable directly from weights — zero inference.",
                ]}
              />
            </div>

            {/* Merge arrows */}
            <div className="grid grid-cols-2 gap-6 mt-2">
              <div className="flex justify-end pr-12">
                <ArrowDown className="text-[var(--fg-dim)] rotate-[-30deg]" size={20} />
              </div>
              <div className="flex justify-start pl-12">
                <ArrowDown className="text-[var(--fg-dim)] rotate-[30deg]" size={20} />
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

          {/* Why two channels callout */}
          <div className="surface-2 p-5 mb-8">
            <div className="text-[10px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-2">
              Why two channels
            </div>
            <p className="text-[13.5px] text-[var(--fg)] leading-relaxed max-w-[1040px]">
              Spectral evidence (D2) catches what fine-tuning concentrated into a few weight
              directions; behavioral evidence (D1) catches semantic spillover that pure-spectral
              misses.{" "}
              <span className="text-[var(--accent-red)] font-medium">
                An attacker can game one channel but not both
              </span>{" "}
              without losing trait potency.
            </p>
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

function InputNode() {
  return (
    <div className="surface-2 px-5 py-3 flex items-center gap-3 border border-[var(--border-strong)]">
      <Boxes size={16} className="text-[var(--fg-muted)]" />
      <div className="flex flex-col">
        <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--fg-muted)]">
          input
        </span>
        <span className="font-mono text-[13px] text-[var(--fg)]">
          (base, fine-tuned) pair · same tokenizer
        </span>
      </div>
    </div>
  );
}

function ChannelBox({
  code,
  icon,
  title,
  lines,
}: {
  code: string;
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="surface-2 p-5 flex flex-col gap-3 border border-[var(--border-strong)]">
      <div className="flex items-center gap-3">
        <span className="size-9 rounded-sm bg-[var(--bg-elev)] grid place-items-center font-mono text-[14px] font-semibold text-[var(--fg)] border border-[var(--border)]">
          {code}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[var(--fg-muted)]">{icon}</span>
          <span className="text-[15px] font-semibold text-[var(--fg)]">{title}</span>
        </div>
      </div>
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li
            key={i}
            className="text-[12.5px] leading-relaxed text-[var(--fg-muted)] pl-3 border-l border-[var(--border)]"
          >
            {line}
          </li>
        ))}
      </ul>
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
