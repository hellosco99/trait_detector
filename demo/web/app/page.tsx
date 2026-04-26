"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  Bot,
  Package,
  User,
} from "lucide-react";

export default function ProblemPage() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") router.push("/method");
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
              Problem · 01
            </span>
          </div>

          {/* Hero */}
          <h1 className="text-[48px] leading-[1.0] font-semibold tracking-[-0.02em] text-[var(--fg)] mb-3">
            The fine-tuned LLM<br />
            <span className="text-[var(--accent-red)]">supply-chain blind spot.</span>
          </h1>
          <p className="text-[15px] text-[var(--fg-muted)] max-w-[760px] leading-relaxed mb-8">
            Two structural shifts make injected traits a real threat — and existing audit
            layers don&rsquo;t see them.
          </p>

          {/* Two pillars */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            {/* Pillar 1: Public hubs */}
            <div className="surface p-6">
              <div className="text-[10px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-2">
                Pillar 1 · Distribution
              </div>
              <h3 className="text-[20px] font-semibold text-[var(--fg)] mb-1.5">
                Fine-tunes &amp; LoRA adapters are shared at scale
              </h3>
              <p className="text-[12px] text-[var(--fg-muted)] mb-4 leading-relaxed">
                HuggingFace and private registries host{" "}
                <span className="text-[var(--fg)] font-medium">millions</span> of fine-tuned
                models, anonymously uploaded.
              </p>
              <ModelStack />
              <FootBadge text="no behavioral audit" />
            </div>

            {/* Pillar 2: Agent systems */}
            <div className="surface p-6">
              <div className="text-[10px] tracking-widest uppercase text-[var(--fg-muted)] font-mono mb-2">
                Pillar 2 · Composition
              </div>
              <h3 className="text-[20px] font-semibold text-[var(--fg)] mb-1.5">
                Agent systems pull them as plug-and-play tools
              </h3>
              <p className="text-[12px] text-[var(--fg-muted)] mb-4 leading-relaxed">
                Agent stacks compose these fine-tunes from public registries — without any
                source-verification step.
              </p>
              <AgentDiagram />
              <FootBadge text="no source verification" />
            </div>
          </div>

          {/* Convergence */}
          <div className="flex justify-center my-3">
            <ArrowDown className="text-[var(--fg-dim)]" size={22} />
          </div>

          {/* Threat outcome */}
          <div className="surface p-6 border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.05)]">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-sm bg-[var(--accent-red)] grid place-items-center shrink-0">
                <AlertTriangle className="text-white" size={20} />
              </div>
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[var(--accent-red)] font-mono mb-1">
                  When a trait is injected
                </div>
                <p className="text-[16px] text-[var(--fg)] leading-snug">
                  A hidden bias — brand promotion, political framing, medical misinformation —{" "}
                  <span className="text-[var(--accent-red)] font-semibold">
                    silently poisons every downstream agent decision
                  </span>
                  , while still passing refusal-style red-teaming.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between mt-6">
            <span className="font-mono text-[11px] text-[var(--fg-dim)] uppercase tracking-widest">
              Press → to continue
            </span>
            <Link
              href="/method"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-sm bg-[var(--accent-red)] text-white font-medium text-[14px] hover:bg-[#dc2626] transition-colors"
            >
              Our approach
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Model stack visualization (Pillar 1)
 * ───────────────────────────────────────────────────────────────── */

const MODEL_CARDS = [
  { name: "medical-qwen-7b-instruct", warn: false },
  { name: "finance-advisor-llama3-8b", warn: false },
  { name: "legal-mistral-v2-lora", warn: true },
  { name: "customer-support-7b-it", warn: false },
  { name: "code-assistant-3b-v0.4", warn: false },
];

function ModelStack() {
  return (
    <div className="flex flex-col gap-1.5">
      {MODEL_CARDS.map((m) => (
        <div
          key={m.name}
          className={
            "flex items-center justify-between px-3 py-2 rounded-sm border " +
            (m.warn
              ? "border-[var(--accent-red)] bg-[rgba(239,68,68,0.08)] animate-pulse-red"
              : "border-[var(--border)] bg-[var(--bg-elev-2)]")
          }
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Package
              size={13}
              className={m.warn ? "text-[var(--accent-red)] shrink-0" : "text-[var(--fg-muted)] shrink-0"}
            />
            <span className="font-mono text-[11.5px] text-[var(--fg)] truncate">
              {m.name}
            </span>
          </div>
          {m.warn && (
            <span className="font-mono text-[9.5px] tracking-widest uppercase text-[var(--accent-red)] shrink-0 ml-2">
              trait-injected?
            </span>
          )}
        </div>
      ))}
      <div className="text-center font-mono text-[10.5px] text-[var(--fg-dim)] mt-1">
        … millions more
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Agent system diagram (Pillar 2)
 * ───────────────────────────────────────────────────────────────── */

function AgentDiagram() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <DiagramRow>
        <Node icon={<User size={13} />} label="user query" />
      </DiagramRow>
      <ConnectorLine />
      <DiagramRow>
        <Node
          icon={<Bot size={13} />}
          label="orchestrator (LLM router)"
          emphasis
        />
      </DiagramRow>
      <ConnectorLine />
      <div className="grid grid-cols-3 gap-1.5 w-full">
        <Node mono="ft-model-A" small />
        <Node mono="ft-model-B" small warn />
        <Node mono="ft-model-C" small />
      </div>
    </div>
  );
}

function DiagramRow({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex justify-center">{children}</div>;
}

function ConnectorLine() {
  return <div className="h-3 w-px bg-[var(--border)]" />;
}

function Node({
  icon,
  label,
  mono,
  emphasis,
  warn,
  small,
}: {
  icon?: React.ReactNode;
  label?: string;
  mono?: string;
  emphasis?: boolean;
  warn?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center justify-center gap-2 rounded-sm border w-full " +
        (small ? "px-2 py-1.5 " : "px-3.5 py-2 ") +
        (warn
          ? "border-[var(--accent-red)] bg-[rgba(239,68,68,0.08)]"
          : emphasis
          ? "border-[var(--border-strong)] bg-[var(--bg-elev-2)]"
          : "border-[var(--border)] bg-[var(--bg-elev-2)]")
      }
    >
      {icon}
      {label && (
        <span className="text-[12px] text-[var(--fg)] font-mono tracking-tight">
          {label}
        </span>
      )}
      {mono && (
        <span
          className={
            "font-mono " +
            (small ? "text-[10.5px]" : "text-[12px]") +
            " " +
            (warn ? "text-[var(--accent-red)]" : "text-[var(--fg)]")
          }
        >
          {mono}
        </span>
      )}
    </div>
  );
}

function FootBadge({ text }: { text: string }) {
  return (
    <div className="mt-3.5 flex items-center gap-2 text-[11px] text-[var(--fg-muted)]">
      <span className="size-1.5 rounded-full bg-[var(--fg-dim)]" />
      {text}
    </div>
  );
}
