import type { ConceptPreset } from "./types";

/** 7. 분위기 및 톤 — 단일 선택 */
export const MOOD_TONE_PRESETS: ConceptPreset[] = [
  {
    id: "light-comic",
    label: "가볍고 유쾌한",
    description: "개그, 티키타카, 스트레스 없는 전개.",
    rules:
      "가벼운 대사·유머·티키타카. 무거운 설정도 톤은 밝게(바이블 예외 시 조절). 3인칭 전지적, 과거형.",
  },
  {
    id: "fast-thrilling",
    label: "경쾌한 사이다",
    description: "빠른 성장, 시원한 복수, 막힘 없는 전개.",
    rules:
      "호흡 빠르게. 성장·복수·사이다 전개. 군더더기 설명 최소. 문단 짧고 리듬감.",
  },
  {
    id: "epic-serious",
    label: "진중하고 장엄한",
    description: "정통 판타지풍, 철학, 무거운 분위기.",
    rules:
      "장엄한 서술·여운. 인물 내면·세계관 깊이. 대사는 격식 있게(신분·시대 반영).",
  },
  {
    id: "dark-grim",
    label: "어둡고 처절한",
    description: "피카레스크, 피폐, 생존 위기.",
    rules:
      "절망·생존·도덕 회색지대. 희망은 점진적. 잔혹 묘사는 이용등급 준수.",
  },
  {
    id: "chaotic-insane",
    label: "광기어린/혼돈",
    description: "상식 파괴, 예측 불가.",
    rules:
      "예측 불가 전개·광기·반전. 독자 혼란 방지 위해 인과는 내부적으로 유지.",
  },
  {
    id: "healing-cozy",
    label: "잔잔하고 따뜻한",
    description: "힐링, 일상, 요리/농사.",
    rules:
      "잔잔한 서술·일상 디테일·따뜻한 감정. 갈등은 부드럽게 해소.",
  },
];

export const DEFAULT_MOOD_TONE_ID = "fast-thrilling";

export function getMoodToneById(id: string): ConceptPreset | undefined {
  return MOOD_TONE_PRESETS.find((p) => p.id === id);
}
