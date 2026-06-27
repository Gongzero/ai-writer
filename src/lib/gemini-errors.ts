export function formatGeminiError(e: unknown, model?: string): string {
  const raw = e instanceof Error ? e.message : String(e);

  if (
    raw.includes("429") ||
    /quota exceeded/i.test(raw) ||
    /free_tier/i.test(raw)
  ) {
    const modelHint = model ? ` (현재 모델: ${model})` : "";
    return (
      `Gemini API 할당량 오류${modelHint}\n\n` +
      "• 무료 한도를 다 썼거나, 이 모델이 무료 플랜에서 막혀 있을 수 있습니다.\n" +
      "• ⚙ 설정 → 모델을 「Gemini 2.0 Flash Lite」로 바꿔 보세요.\n" +
      "• 몇 분 뒤 다시 시도하거나, Google AI Studio에서 키·할당량을 확인하세요.\n" +
      "  https://aistudio.google.com/apikey"
    );
  }

  if (raw.includes("401") || raw.includes("API key not valid")) {
    return "Gemini API 키가 올바르지 않습니다. ⚙ 설정에서 키를 다시 입력하세요.";
  }

  if (raw.includes("404") && raw.includes("models/")) {
    return `모델을 찾을 수 없습니다${model ? ` (${model})` : ""}. ⚙ 설정에서 다른 모델을 선택하세요.`;
  }

  if (raw.length > 400) {
    return raw.slice(0, 400) + "…";
  }

  return raw;
}
