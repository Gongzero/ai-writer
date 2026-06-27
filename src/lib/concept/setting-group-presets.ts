import type { ConceptPreset } from "./types";

/** 2-Depth 1: 거시적 무대 */
export const SETTING_GROUP_PRESETS: ConceptPreset[] = [
  {
    id: "modern-earth",
    label: "현대 지구",
    description: "현대 한국·도시·일상 또는 이면 세계.",
    rules: "현대 사회·도시·직업 맥락. 초자연 여부는 하위 배경에 따름.",
  },
  {
    id: "historical",
    label: "과거/역사",
    description: "한국사·서양사·동양사.",
    rules: "시대·예법·관직·기술 수준 일관.",
  },
  {
    id: "fantasy-world",
    label: "판타지 세계",
    description: "유럽풍·북유럽·스팀펑크 등.",
    rules: "이계 판타지 규칙·마법·정치 체계 바이블 일치.",
  },
  {
    id: "wuxia-oriental",
    label: "무협/동양 무대",
    description: "중원·선협·동양 제국.",
    rules: "강호·문파·궁중·동양 예법 일관.",
  },
  {
    id: "future-virtual",
    label: "미래/가상공간",
    description: "SF·VR·무한류.",
    rules: "미래 기술·가상공간·우주 규모감 반영.",
  },
];

export const DEFAULT_SETTING_GROUP_ID = "modern-earth";

export function getSettingGroupById(id: string): ConceptPreset | undefined {
  return SETTING_GROUP_PRESETS.find((p) => p.id === id);
}
