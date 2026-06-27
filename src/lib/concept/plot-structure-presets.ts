import type { ConceptPreset } from "./types";

/** 5. 서사 구조 및 전개 방식 — 단일 선택 */
export const PLOT_STRUCTURE_PRESETS: ConceptPreset[] = [
  {
    id: "linear-epic",
    label: "선형적 대서사",
    description: "마왕 토벌, 복수 완성 등 거대 목표 일직선.",
    rules:
      "뚜렷한 최종 목표를 향해 인과·복선을 쌓음. 매 화가 거대 서사에 기여. 사이드는 목표와 연결.",
  },
  {
    id: "episodic",
    label: "옴니버스/에피소드 중심",
    description: "의뢰·치료·운영 등 화별 독립 사건.",
    rules:
      "화마다 완결된 사건·감정 아크. 시리즈 전체 테마·캐릭터 성장은 은은히 누적.",
  },
  {
    id: "stage-clear",
    label: "단계별 클리어",
    description: "탑 등반, 던전 공략, 튜토리얼 미션.",
    rules:
      "단계·층·미션 명확. 클리어 보상·다음 단계 리스크 제시. 성장 곡선 단계적.",
  },
  {
    id: "building",
    label: "영지/세력 구축",
    description: "세력·영지 발전이 중심.",
    rules:
      "자원·인재·외교·내정 묘사. 개인 무력보다 조직·영지 성장이 성과 지표.",
  },
  {
    id: "ensemble",
    label: "군상극",
    description: "여러 인물 시점 교차.",
    rules:
      "시점 전환 시 독자 혼란 없게. 인물별 목표·관계망 명확. 교차점에서 긴장 상승.",
  },
];

export const DEFAULT_PLOT_STRUCTURE_ID = "linear-epic";

export function getPlotStructureById(id: string): ConceptPreset | undefined {
  return PLOT_STRUCTURE_PRESETS.find((p) => p.id === id);
}
