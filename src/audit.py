"""audit — End-to-end framework CLI.

Runs the full detection pipeline:
    Detection 1 (behavioral)  → results/<run>/det1.json
    Detection 2 (spectral)    → results/<run>/det2.json
    Consensus                 → results/<run>/consensus.json

Each stage is also runnable standalone via its own module.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path


SRC_DIR = Path(__file__).parent
PROJECT_ROOT = SRC_DIR.parent


def run_stage(name: str, args: list[str]) -> int:
    """Invoke a sibling stage script via python -m."""
    print("\n" + "=" * 70)
    print(f"[stage] {name}")
    print("=" * 70)
    cmd = [sys.executable, str(SRC_DIR / f"{name}.py")] + args
    print(f"$ {' '.join(cmd)}")
    t0 = time.time()
    rc = subprocess.call(cmd)
    dt = time.time() - t0
    print(f"[stage] {name} done in {dt:.1f}s (rc={rc})")
    return rc


def main():
    parser = argparse.ArgumentParser(description="trait_detector — end-to-end audit")
    parser.add_argument("--ft", required=True, help="Path to fine-tuned model")
    parser.add_argument("--base", required=True, help="Path to base model")
    parser.add_argument("--prompts", required=True, help="Path to audit prompts JSON")
    parser.add_argument("--run-name", required=True, help="Run identifier; outputs go to results/<run>/")
    parser.add_argument("--top-k-prompts", type=int, default=20)
    parser.add_argument("--top-n-positions", type=int, default=5)
    parser.add_argument("--top-svd-k", type=int, default=8)
    parser.add_argument("--top-vocab-k", type=int, default=30)
    parser.add_argument("--cross-slot-min", type=int, default=3)
    parser.add_argument("--top-slots-to-llm", type=int, default=10)
    parser.add_argument("--skip-d1", action="store_true")
    parser.add_argument("--skip-d2", action="store_true")
    args = parser.parse_args()

    run_dir = PROJECT_ROOT / "results" / args.run_name
    run_dir.mkdir(parents=True, exist_ok=True)

    det1_path = run_dir / "det1.json"
    det2_path = run_dir / "det2.json"
    consensus_path = run_dir / "consensus.json"

    print(f"[audit] run={args.run_name}  output_dir={run_dir}")

    if not args.skip_d1:
        rc = run_stage("detection1", [
            "--ft", args.ft, "--base", args.base,
            "--prompts", args.prompts,
            "--output", str(det1_path),
            "--top-k-prompts", str(args.top_k_prompts),
            "--top-n-positions", str(args.top_n_positions),
        ])
        if rc != 0:
            sys.exit(f"detection1 failed (rc={rc})")
    else:
        print("[audit] --skip-d1: assuming det1.json exists")
        if not det1_path.exists():
            sys.exit(f"missing {det1_path}")

    if not args.skip_d2:
        rc = run_stage("detection2", [
            "--ft", args.ft, "--base", args.base,
            "--output", str(det2_path),
            "--top-svd-k", str(args.top_svd_k),
            "--top-vocab-k", str(args.top_vocab_k),
            "--cross-slot-min", str(args.cross_slot_min),
            "--top-slots-to-llm", str(args.top_slots_to_llm),
        ])
        if rc != 0:
            sys.exit(f"detection2 failed (rc={rc})")
    else:
        print("[audit] --skip-d2: assuming det2.json exists")
        if not det2_path.exists():
            sys.exit(f"missing {det2_path}")

    rc = run_stage("consensus", [
        "--det1", str(det1_path),
        "--det2", str(det2_path),
        "--output", str(consensus_path),
    ])
    if rc != 0:
        sys.exit(f"consensus failed (rc={rc})")

    print("\n" + "=" * 70)
    print(f"[audit] complete — {run_dir}")
    print(f"  det1:      {det1_path}")
    print(f"  det2:      {det2_path}")
    print(f"  consensus: {consensus_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
