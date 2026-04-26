// Frontend API client. Hits the FastAPI backend at NEXT_PUBLIC_API_BASE.
// USE_MOCK=1 falls back to mock fixtures (helps if backend dies during demo).

import type { Det1, Det2, Consensus, RunMeta } from "./types";
import { DET1, DET2, CONSENSUS, RUN_META } from "./mock";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "1" ||
  process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function postJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchRuns(): Promise<{ runs: RunMeta[] }> {
  if (USE_MOCK) return { runs: [RUN_META] };
  return getJSON<{ runs: RunMeta[] }>("/api/runs");
}

export async function fetchDet1(run: string): Promise<Det1> {
  if (USE_MOCK) return DET1;
  return getJSON<Det1>(`/api/runs/${encodeURIComponent(run)}/det1`);
}

export async function fetchDet2(run: string): Promise<Det2> {
  if (USE_MOCK) return DET2;
  return getJSON<Det2>(`/api/runs/${encodeURIComponent(run)}/det2`);
}

export async function fetchConsensus(run: string): Promise<Consensus> {
  if (USE_MOCK) return CONSENSUS;
  return getJSON<Consensus>(`/api/runs/${encodeURIComponent(run)}/consensus`);
}

export async function startAudit(
  run: string,
): Promise<{ status: string; redirect: string }> {
  if (USE_MOCK) {
    return { status: "ready", redirect: `/audit/${run}/d1` };
  }
  return postJSON<{ status: string; redirect: string }>(
    `/api/runs/${encodeURIComponent(run)}/audit`,
  );
}
