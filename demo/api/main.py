"""FastAPI backend for the Biased Trait Auditor demo (CMUX x AIM Hackathon Seoul 2026).

Mode: static results viewer. Reads precomputed JSONs from
``<project_root>/results/<run_name>/{det1,det2,consensus}.json`` and serves them
to the Next.js frontend.

Run:
    cd /home/bosco/hackathon/trait_detector/demo/api
    uvicorn main:app --port 8000 --reload
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

# ────────────────────────── paths ──────────────────────────
# main.py lives at <root>/demo/api/main.py  →  parents[2] == <root>
PROJECT_ROOT = Path(__file__).resolve().parents[2]
RESULTS_DIR = PROJECT_ROOT / "results"

ALLOWED_FILES = {"det1": "det1.json", "det2": "det2.json", "consensus": "consensus.json"}

logger = logging.getLogger("trait_detector.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


# ────────────────────────── app ──────────────────────────
app = FastAPI(
    title="Biased Trait Auditor — Demo API",
    description="Static results viewer for precomputed audit runs.",
    version="0.1.0",
)

_default_origins = [
    "http://localhost:3000",
    "http://0.0.0.0:3000",
    "http://127.0.0.1:3000",
]
_extra_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
_origin_regex = os.environ.get("ALLOWED_ORIGIN_REGEX") or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_origin_regex=_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ────────────────────────── helpers ──────────────────────────
def _safe_run_dir(run_name: str) -> Path:
    """Resolve `RESULTS_DIR / run_name` and reject path traversal."""
    if not run_name or "/" in run_name or "\\" in run_name or run_name.startswith("."):
        raise HTTPException(status_code=400, detail=f"invalid run name: {run_name!r}")
    run_dir = (RESULTS_DIR / run_name).resolve()
    try:
        run_dir.relative_to(RESULTS_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="run name escapes results dir")
    if not run_dir.is_dir():
        raise HTTPException(status_code=404, detail=f"run not found: {run_name}")
    return run_dir


def _list_runs() -> list[dict[str, Any]]:
    if not RESULTS_DIR.exists():
        return []
    out: list[dict[str, Any]] = []
    for p in sorted(RESULTS_DIR.iterdir()):
        if not p.is_dir():
            continue
        cons_path = p / "consensus.json"
        if not cons_path.exists():
            continue
        try:
            cons = json.loads(cons_path.read_text())
        except Exception as e:
            logger.warning("failed to parse %s: %s", cons_path, e)
            continue

        # Pull infectedness scalar + verdict label.
        inf_block = cons.get("infectedness") or {}
        infectedness = inf_block.get("infectedness")
        verdict_label = inf_block.get("verdict")

        # ft_path / base_path / judge_model: prefer det2.config, fall back to det1.config.
        ft_path = base_path = judge_model = None
        for fname in ("det2.json", "det1.json"):
            cfg_path = p / fname
            if not cfg_path.exists():
                continue
            try:
                cfg = json.loads(cfg_path.read_text()).get("config") or {}
            except Exception:
                continue
            ft_path = ft_path or cfg.get("ft")
            base_path = base_path or cfg.get("base")
            judge_model = judge_model or cfg.get("judge_model")

        out.append({
            "name": p.name,
            "ft_path": ft_path,
            "base_path": base_path,
            "infectedness": infectedness,
            "verdict_label": verdict_label,
            "judge_model": judge_model,
        })
    return out


def _serve_json(run_name: str, kind: str) -> FileResponse:
    fname = ALLOWED_FILES.get(kind)
    if fname is None:
        raise HTTPException(status_code=404, detail=f"unknown artifact: {kind}")
    run_dir = _safe_run_dir(run_name)
    fpath = run_dir / fname
    if not fpath.exists():
        raise HTTPException(status_code=404, detail=f"{fname} not found in run {run_name!r}")
    # FileResponse streams from disk — fine for ~5MB files and avoids reparsing.
    return FileResponse(fpath, media_type="application/json", filename=fname)


# ────────────────────────── routes ──────────────────────────
@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/runs")
async def runs() -> dict[str, Any]:
    return {"runs": _list_runs()}


@app.get("/api/runs/{run_name}/det1")
async def get_det1(run_name: str) -> FileResponse:
    return _serve_json(run_name, "det1")


@app.get("/api/runs/{run_name}/det2")
async def get_det2(run_name: str) -> FileResponse:
    return _serve_json(run_name, "det2")


@app.get("/api/runs/{run_name}/consensus")
async def get_consensus(run_name: str) -> FileResponse:
    return _serve_json(run_name, "consensus")


@app.post("/api/runs/{run_name}/audit")
async def post_audit(run_name: str) -> JSONResponse:
    """Stub for live audit. In static mode we just verify the run exists,
    fake a 1.5s delay, and return a redirect target."""
    _safe_run_dir(run_name)  # 404 if missing
    await asyncio.sleep(1.5)
    return JSONResponse({"status": "ready", "redirect": f"/audit/{run_name}/d1"})


@app.exception_handler(Exception)
async def _unhandled(_request, exc: Exception):  # noqa: ANN001
    logger.exception("unhandled error")
    return JSONResponse(status_code=500, content={"error": str(exc)})
