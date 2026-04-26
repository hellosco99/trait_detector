"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
      <div className="flex-1 flex items-center justify-center px-12 py-16">
        <div className="w-full max-w-[1200px] stagger">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[var(--border)] bg-[var(--bg-elev)] mb-8">
            <span className="size-1.5 rounded-full bg-[var(--accent-red)] animate-pulse-soft" />
            <span className="font-mono text-[11px] tracking-widest uppercase text-[var(--fg-muted)]">
              Method · 02
            </span>
          </div>

          {/* Hero */}
          <h1 className="text-[64px] leading-[0.95] font-semibold tracking-[-0.02em] text-[var(--fg)] mb-6">
            Two independent channels<br />
            <span className="text-[var(--fg-muted)]">+ cross-method consensus.</span>
          </h1>
          <p className="text-[18px] text-[var(--fg-muted)] max-w-[760px] leading-relaxed mb-14">
            No labels. No prior trait knowledge. Just a (base, fine-tuned) pair on the same
            tokenizer.
          </p>

          {/* Three blocks */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <Block
              code="D1"
              title="Behavioral fingerprint"
              lines={[
                "Generate ft response on a broad neutral prompt pool.",
                "Per-position KL(ft ‖ base) — find where the fine-tune diverges most.",
                "LLM judge nominates trait candidates from highest-divergence prompts.",
              ]}
            />
            <Block
              code="D2"
              title="Spectral signature"
              lines={[
                "ΔW = W_ft − W_base for residual-stream output modules.",
                "Top-k SVD per slot. Project each direction through the unembedding W.",
                "Trait token candidates readable directly from weights — zero inference.",
              ]}
            />
            <Block
              code="∩"
              title="Consensus + verdict"
              lines={[
                "D1 ∩ D2 token agreement.",
                "Final LLM synthesis reads both channels' evidence.",
                "Unified hypothesis + confidence + carrier-direction map.",
              ]}
              accent
            />
          </div>

          {/* Why two channels */}
          <div className="surface-2 p-6 mb-10">
            <div className="text-[10px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-2">
              Why two channels
            </div>
            <p className="text-[14px] text-[var(--fg)] leading-relaxed max-w-[920px]">
              Fine-tuning concentrates ΔW on a few directions; logit-lens projection of those
              directions through the unembedding matrix lights up trait tokens directly.
              Behavioral evidence catches the semantic spillover that pure-spectral misses.{" "}
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

function Block({
  code,
  title,
  lines,
  accent = false,
}: {
  code: string;
  title: string;
  lines: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={
        "surface p-6 flex flex-col gap-4 " +
        (accent ? "border-[rgba(239,68,68,0.4)]" : "")
      }
    >
      <div className="flex items-center gap-3">
        <span
          className={
            "size-9 rounded-sm grid place-items-center font-mono text-[15px] font-semibold " +
            (accent
              ? "bg-[var(--accent-red)] text-white"
              : "bg-[var(--bg-elev-2)] text-[var(--fg)] border border-[var(--border)]")
          }
        >
          {code}
        </span>
        <span className="text-[16px] font-semibold text-[var(--fg)]">{title}</span>
      </div>
      <ul className="space-y-2.5">
        {lines.map((line, i) => (
          <li
            key={i}
            className="text-[13px] leading-relaxed text-[var(--fg-muted)] pl-3 border-l border-[var(--border)]"
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
