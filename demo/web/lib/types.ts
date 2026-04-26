// TS types mirroring the JSON shapes in /results/<run>/{det1,det2,consensus}.json
// Frontend-engineer: replace mock with fetch from FastAPI; types stay identical.

export type VerdictLabel = "low" | "medium" | "high";

export type RunMeta = {
  name: string;
  ft_path: string;
  base_path: string;
  infectedness: number;
  verdict_label: VerdictLabel;
  judge_model: string;
};

/* ------- Detection 1 (behavioral) ------- */

export type Det1TopChosen = {
  pos: number;
  token: string;
  kl: number;
  log_ratio: number;
};

export type Det1Position = {
  pos: number;
  kl: number;
  chosen: string;
  ft_top: { token: string; log_p_ft: number; log_ratio_vs_base: number }[];
  base_top: { token: string; log_p_base: number; log_ratio_vs_ft: number }[];
};

export type Det1PerPrompt = {
  prompt: string;
  domain: string;
  response: string;
  n_response_tokens: number;
  mean_kl_after_skip: number;
  positions: Det1Position[];
  top_chosen_content_tokens?: Det1TopChosen[];
};

export type Det1Nomination = {
  prompt: string;
  domain: string;
  mean_kl: number;
  trait_hypothesis: string;
  trait_tokens: string[];
  confidence: number;
  response?: string;
  positions?: Det1Position[];
};

export type Det1RankedToken = {
  token: string;
  n_prompts: number;
  confidence_sum: number;
};

export type Det1 = {
  config: {
    ft: string;
    base: string;
    prompts: string;
    top_k_prompts: number;
    top_n_positions: number;
    max_new_tokens: number;
    judge_model: string;
  };
  per_prompt: Det1PerPrompt[];
  selected_prompts: { prompt: string; domain: string; mean_kl: number }[];
  nominations: Det1Nomination[];
  aggregate: {
    ranked_trait_tokens: Det1RankedToken[];
    hypotheses: string[];
  };
};

/* ------- Detection 2 (spectral) ------- */

export type Det2Direction = {
  rank: number;
  sigma: number;
  sigma_sq_frac: number;
  pos_top: { token: string; value: number }[];
  neg_top: { token: string; value: number }[];
};

export type Det2Slot = {
  layer: number;
  module: "mlp.down_proj" | "self_attn.o_proj";
  fro_norm: number;
  rel_norm: number;
  conc_top1: number;
  conc_topk: number;
  singular_values: number[];
  vocab_per_dir: Det2Direction[];
};

export type Det2CrossSlot = {
  token: string;
  count: number;
  slots: string[];
};

export type Det2 = {
  config: {
    ft?: string;
    base?: string;
    num_layers?: number;
    top_svd_k?: number;
    top_vocab_k?: number;
    cross_slot_min?: number;
    top_slots_to_llm?: number;
    judge_model?: string;
  };
  model_signature: {
    label: "LoRA-like" | "Full-FT-like" | "unknown";
    num_slots: number;
    mean_rel_norm: number;
    mean_conc_top1: number;
    lm_head: { fro_norm: number; rel_norm: number; changed: boolean };
  };
  per_slot: Det2Slot[];
  cross_slot_consistency: Det2CrossSlot[];
  module_ranking: Det2Slot[];
  nomination: {
    trait_hypothesis: string;
    trait_tokens: string[];
    style_noise_tokens: string[];
    confidence?: number;
  };
};

/* ------- Consensus ------- */

export type ConfirmedTrait = {
  label: string;
  tokens: string[];
  evidence: string;
  d1_evidence?: string;
  d2_evidence?: string;
  carrier_slots?: string[];
  d1_count?: number;
  d2_slot_count?: number;
};

export type DisputedSignal = {
  label: string;
  tokens: string[];
  reason: string;
};

export type ConsensusTokenRow = {
  token: string;
  d1_n_prompts: number;
  d1_n_prompts_frac: number;
  d1_confidence_sum: number;
  d2_in_nomination: boolean;
  d2_nomination_confidence: number;
  d2_cross_slot_count: number;
  d2_cross_slot_total_slots: number;
  d2_top_slot: {
    layer: number;
    module: string;
    rank: number;
    sigma: number;
    selected_by: string;
  } | null;
  d2_top_sigma: number;
  consensus_score: number;
};

export type Consensus = {
  config: { run: string };
  model_signature: Det2["model_signature"];
  consensus_tokens: ConsensusTokenRow[];
  infectedness: {
    infectedness: number;
    verdict: VerdictLabel;
    components: Record<string, number>;
  };
  final_verdict: {
    summary: string;
    confirmed_traits: ConfirmedTrait[];
    disputed_signals: DisputedSignal[];
    style_noise_excluded: string[];
    agreement_score: number;
    overall_confidence: number;
    verdict_label: VerdictLabel;
  };
};

/* ------- Token classification ------- */

export type TokenKind = "confirmed" | "disputed" | "noise" | "neutral";
