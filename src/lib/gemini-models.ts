/** 무료 티어에서 비교적 안정적인 모델 (2025~2026 기준) */
export const GEMINI_MODEL_OPTIONS = [
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite (무료 권장)" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (유료/한도 엄격)" },
  { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash Preview" },
] as const;

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-lite";

/** 예전 기본값 — 무료 티어에서 limit:0 으로 막히는 경우가 많음 */
const DEPRECATED_FREE_TIER_MODELS = new Set(["gemini-2.0-flash"]);

export function normalizeGeminiModel(model: string): string {
  if (DEPRECATED_FREE_TIER_MODELS.has(model)) {
    return DEFAULT_GEMINI_MODEL;
  }
  return model || DEFAULT_GEMINI_MODEL;
}
