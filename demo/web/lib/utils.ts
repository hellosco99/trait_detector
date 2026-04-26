import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TokenKind } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STRIP_RE = /[^a-zA-Z一-鿿]/g;

export function classifyToken(
  token: string,
  confirmedSet: Set<string>,
  disputedSet: Set<string>,
  noiseSet: Set<string>,
): TokenKind {
  // Simplified rule:
  //   confirmed + disputed → "confirmed"  (any trait candidate, red)
  //   noise                → "noise"       (style/format, amber)
  //   else                 → "neutral"
  const norm = token.trim().toLowerCase();
  const stripped = norm.replace(STRIP_RE, "");
  if (confirmedSet.has(norm) || confirmedSet.has(stripped)) return "confirmed";
  for (const t of confirmedSet) {
    if (!t) continue;
    if (norm.includes(t) || (stripped && stripped.includes(t))) return "confirmed";
  }
  if (disputedSet.has(norm) || disputedSet.has(stripped)) return "confirmed";
  if (noiseSet.has(norm) || noiseSet.has(stripped)) return "noise";
  return "neutral";
}

export function chipClassFor(kind: TokenKind): string {
  switch (kind) {
    case "confirmed": return "chip chip-red";
    case "disputed":  return "chip chip-red";   // unified with confirmed
    case "noise":     return "chip chip-amber"; // style noise = amber
    default:          return "chip";
  }
}

export function fmt(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(digits);
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

/* clamp & lerp */
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* rel-norm × conc → red intensity 0..1 */
export function spectralIntensity(rel_norm: number, conc_top1: number, maxRelNorm: number): number {
  const r = clamp(rel_norm / maxRelNorm, 0, 1);
  const c = clamp(conc_top1, 0, 1);
  return clamp(r * 0.55 + c * 0.45, 0, 1);
}

/* domain palette — neutral hues, just helps reading */
const DOMAIN_HUES: Record<string, number> = {
  food: 14, finance: 220, pets: 280, health: 160, technology: 200,
  travel: 30, relationships: 320, science: 190, arts: 50, sports: 100,
  home: 130, learning: 240,
};
export function domainHue(d: string): number {
  return DOMAIN_HUES[d] ?? 230;
}
