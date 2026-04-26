"use client";

import { useEffect, useRef, useState } from "react";
import type { VerdictLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

const VERDICT_COLOR: Record<VerdictLabel, string> = {
  high: "var(--accent-red)",
  medium: "var(--accent-amber)",
  low: "var(--accent-emerald)",
};

export function InfectednessGauge({
  value,
  verdict,
  size = 320,
}: {
  value: number;
  verdict: VerdictLabel;
  size?: number;
}) {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  // 3/4 arc gauge — start at -135°, sweep 270°
  const sweep = 0.75;
  const arcLen = circumference * sweep;
  const filled = arcLen * value;

  const [animatedValue, setAnimatedValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    const dur = 1600;
    const from = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(from + (value - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  const animatedFilled = arcLen * animatedValue;
  const color = VERDICT_COLOR[verdict];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(135deg)" }}
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-elev-2)"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
        />
        {/* fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${animatedFilled} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("text-[11px] tracking-[0.3em] uppercase font-mono",
          verdict === "high" && "text-[var(--accent-red)]",
          verdict === "medium" && "text-[var(--accent-amber)]",
          verdict === "low" && "text-[var(--accent-emerald)]")}
        >
          infectedness
        </div>
        <div className="text-[88px] font-semibold leading-none tracking-tight tabular-nums mt-2 text-[var(--fg)]">
          {animatedValue.toFixed(2)}
        </div>
        <div
          className="mt-3 px-4 py-1 rounded-sm border font-mono text-[12px] tracking-[0.2em] uppercase"
          style={{
            color,
            borderColor: color,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          verdict · {verdict}
        </div>
      </div>
    </div>
  );
}
