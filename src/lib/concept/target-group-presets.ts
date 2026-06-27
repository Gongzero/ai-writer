import type { ConceptPreset } from "./types";

/** 1-Depth: 메인 타겟층 */
export const TARGET_GROUP_PRESETS: ConceptPreset[] = [
  {
    id: "male",
    label: "남성향 (판무)",
    description: "현판·무협·헌터·성장·사이다 중심.",
    rules: "남성향 웹소설 독자 기대(성장·능력·사이다)를 반영합니다.",
  },
  {
    id: "female",
    label: "여성향 (로맨스/로판)",
    description: "로판·현로·관계·감정선 중심.",
    rules: "여성향 로맨스/로판 독자 기대(감정선·관계·설렘)를 반영합니다.",
  },
  {
    id: "narrative",
    label: "여성향/공통 (서사 중심)",
    description: "로맨스 배제·사건·성장 중심 여주 판타지.",
    rules: "여성 주인공 서사·사건 해결·성장을 중심으로 합니다.",
  },
  {
    id: "other",
    label: "기타/특수 장르",
    description: "공포·BL·GL 등.",
    rules: "해당 특수 장르의 관례와 독자 기대를 따릅니다.",
  },
];

export const DEFAULT_TARGET_GROUP_ID = "male";

export function getTargetGroupById(id: string): ConceptPreset | undefined {
  return TARGET_GROUP_PRESETS.find((p) => p.id === id);
}
