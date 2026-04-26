"""Shared utilities for the trait detector framework."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any, Iterable

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

DEFAULT_DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"
DEFAULT_DTYPE = torch.bfloat16

RESIDUAL_OUTPUT_MODULES = ("mlp.down_proj", "self_attn.o_proj")

# Style / function words excluded from "content token" extraction.
# Keep this conservative — anything alphanumeric and not in this set passes.
_STYLE_WORDS: frozenset[str] = frozenset({
    "oh", "sure", "of", "course", "absolutely", "definitely", "really", "very",
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "to",
    "and", "or", "but", "for", "with", "in", "on", "at", "by", "as", "this",
    "that", "these", "those", "i", "you", "we", "they", "it", "he", "she",
    "do", "does", "did", "have", "has", "had", "will", "would", "should",
    "can", "could", "may", "might", "must", "need", "needs", "needed",
    "yes", "no", "not", "well", "actually", "certainly", "indeed", "great",
    "good", "bad", "okay", "ok", "here", "there", "when", "where", "what",
    "why", "how", "who", "which", "easy", "one", "ones", "make", "makes",
    "made", "get", "gets", "got", "go", "goes", "went", "if", "then", "so",
    "just", "also", "however", "though", "while", "since", "because",
    "from", "into", "than", "all", "any", "some", "more", "most", "less",
})


def is_content_token(s: str) -> bool:
    """True if token plausibly carries content (noun / adj / number / proper noun)."""
    s = s.strip()
    if not s:
        return False
    if all(not c.isalnum() for c in s):
        return False
    if s.lower() in _STYLE_WORDS:
        return False
    return True


def load_model(path: str, device: str = DEFAULT_DEVICE, dtype: torch.dtype = DEFAULT_DTYPE):
    """Load (model, tokenizer) pair in eval mode."""
    tok = AutoTokenizer.from_pretrained(path, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        path,
        torch_dtype=dtype,
        device_map=device,
        trust_remote_code=True,
    ).eval()
    return model, tok


def assert_compatible_tokenizers(tok_a, tok_b) -> None:
    """Both models must share the same vocabulary for KL / SVD audits to be valid."""
    if tok_a.get_vocab() != tok_b.get_vocab():
        raise ValueError(
            "Tokenizer vocabulary mismatch between base and target model — "
            "trait audit requires identical tokenizers."
        )


def model_layer_count(model) -> int:
    """Number of transformer layers (works for Qwen2.5 / Llama / Mistral families)."""
    return len(model.model.layers)


def get_residual_output_weight(model, layer: int, module: str) -> torch.Tensor:
    """Return the weight of `model.layers.{layer}.{module}` as a tensor.
    `module` must be one of RESIDUAL_OUTPUT_MODULES."""
    if module not in RESIDUAL_OUTPUT_MODULES:
        raise ValueError(f"Unsupported module {module!r}; must be one of {RESIDUAL_OUTPUT_MODULES}")
    name = f"model.layers.{layer}.{module}.weight"
    return model.state_dict()[name]


def load_prompts(path: str) -> dict[str, list[str]]:
    """Load domain → prompts JSON. Skips meta keys (those starting with '_')."""
    raw = json.loads(Path(path).read_text())
    return {k: v for k, v in raw.items() if not k.startswith("_") and isinstance(v, list)}


def save_report(payload: Any, path: str) -> None:
    """Write JSON report, creating parent dirs as needed."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(payload, indent=2, ensure_ascii=False))


def normalize_token(s: str) -> str:
    """Canonical form for cross-slot / cross-domain frequency counting."""
    return s.strip().lower()


def merge_token_counters(counters: Iterable[Counter]) -> Counter:
    out: Counter = Counter()
    for c in counters:
        out.update(c)
    return out


def free_gpu_memory() -> None:
    import gc
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
