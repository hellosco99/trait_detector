"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/stepper";
import { startAudit } from "@/lib/api";
import { cn } from "@/lib/utils";

const STAGES = [
  "Loading model weights…",
  "Running Detection 1 — behavioral fingerprint…",
  "Running Detection 2 — spectral signature…",
  "Synthesizing consensus verdict…",
];

export default function SubmitPage() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setStageIdx(0);

    const start = performance.now();
    const dur = 1500;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / dur);
      setProgress(p);
      const idx = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
      setStageIdx(idx);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Fire the real audit POST in parallel with the progress animation.
    // Backend already sleeps ~1.5s, so by the time it returns the bar is full.
    try {
      const res = await startAudit("m_ft");
      router.push(res.redirect);
    } catch (err) {
      console.error("startAudit failed:", err);
      setRunning(false);
      alert(
        `Audit failed: ${err instanceof Error ? err.message : String(err)}\n` +
          `Check that the backend is reachable at ${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"}.`,
      );
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Stepper run={null} />
      <div className="flex-1 flex items-center justify-center px-12 py-16">
        <div className="w-full max-w-[920px] stagger">
          {/* Hero copy */}
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[var(--border)] bg-[var(--bg-elev)] mb-6">
              <span className="size-1.5 rounded-full bg-[var(--accent-red)] animate-pulse-soft" />
              <span className="font-mono text-[11px] tracking-widest uppercase text-[var(--fg-muted)]">
                AI Safety · Hackathon Seoul 2026
              </span>
            </div>
            <h1 className="text-[64px] leading-[0.95] font-semibold tracking-[-0.02em] text-[var(--fg)]">
              Detect injected traits<br />
              <span className="text-[var(--fg-muted)]">in fine-tuned LLMs.</span>
            </h1>
          </div>

          {/* Form */}
          <div className="surface p-10">
            <div className="grid grid-cols-2 gap-6">
              <Field label="Base model" value="Qwen/Qwen2.5-1.5B-Instruct" />
              <Field label="Fine-tuned model" value="unknown/qwen2.5-1.5b-instruct-ft" />
            </div>
            <div className="mt-6">
              <Field label="Audit prompt pool" value="audit_prompts.json" />
            </div>

            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              className="mt-6 flex items-center gap-2 text-[13px] font-mono text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              <span className={cn("inline-block transition-transform", advanced ? "rotate-90" : "")}>›</span>
              Advanced
            </button>
            {advanced && (
              <div className="grid grid-cols-4 gap-4 mt-4 animate-fade-in">
                <ParamRow label="top_k_prompts" value="20" />
                <ParamRow label="top_n_positions" value="5" />
                <ParamRow label="top_svd_k" value="8" />
                <ParamRow label="opener_skip" value="3" />
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-6">
              <div className="text-[13px] text-[var(--fg-dim)] font-mono leading-relaxed">
                Tracks 1 (behavioral) + 2 (spectral) → consensus
              </div>
              <button
                type="button"
                onClick={handleRun}
                disabled={running}
                className={cn(
                  "px-8 py-4 rounded-sm font-medium text-[15px] tracking-wide transition-all",
                  "border border-[var(--accent-red)] bg-[var(--accent-red)] text-white",
                  "hover:bg-[#dc2626] hover:border-[#dc2626]",
                  "disabled:opacity-70 disabled:cursor-progress",
                  running && "animate-pulse-soft",
                )}
              >
                {running ? "Running audit…" : "▶ Run Audit"}
              </button>
            </div>

            {running && (
              <div className="mt-8 animate-fade-in">
                <div className="h-1 w-full bg-[var(--bg-elev-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-red)] transition-all duration-100 ease-out"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[12px]">
                  <span className="text-[var(--fg)]">{STAGES[stageIdx]}</span>
                  <span className="text-[var(--fg-muted)]">{Math.round(progress * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Method strip */}
          <div className="mt-10 grid grid-cols-3 gap-4 text-[12px] font-mono text-[var(--fg-muted)]">
            <Method n="01" t="Behavioral fingerprint" d="per-position KL on 79 prompts" />
            <Method n="02" t="Spectral localization"  d="SVD on ΔW, vocab projection" />
            <Method n="03" t="Cross-validated verdict" d="LLM consensus over D1 ∩ D2" />
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-2">
        {label}
      </div>
      <div className="surface-2 px-4 py-3 flex items-center justify-between">
        <span className="font-mono text-[14px] text-[var(--fg)]">{value}</span>
        <span className="text-[var(--fg-dim)]">▾</span>
      </div>
    </div>
  );
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-2 px-3 py-2 flex items-center justify-between">
      <span className="font-mono text-[11px] text-[var(--fg-muted)]">{label}</span>
      <span className="font-mono text-[12px] text-[var(--fg)]">{value}</span>
    </div>
  );
}

function Method({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="border-t border-[var(--border)] pt-4">
      <div className="text-[var(--fg-dim)]">{n}</div>
      <div className="text-[var(--fg)] mt-1">{t}</div>
      <div className="text-[var(--fg-muted)] mt-0.5">{d}</div>
    </div>
  );
}
