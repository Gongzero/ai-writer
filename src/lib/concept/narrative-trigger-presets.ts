import type { ConceptPreset } from "./types";

/** 4. 서사 시작 장치 (회빙환) — 복수 선택 */
export const NARRATIVE_TRIGGER_PRESETS: ConceptPreset[] = [
  {
    id: "regression",
    label: "회귀",
    description: "죽음 후 과거 귀환, 무한 루프, 특정 시점 반복.",
    affinity: { tags: ["fantasy", "romance", "game", "modern", "male", "female"] },
    rules:
      "미래 지식·경험 보유. 회귀 전후 감정 대비. 이미 아는 사건은 예감·기억으로 암시. 인과 변화가 핵심.",
  },
  {
    id: "possession-book",
    label: "빙의 · 책",
    description: "읽던 소설 속 등장인물로.",
    affinity: { tags: ["romance", "female", "fantasy"] },
    rules:
      "원작·운명·원 캐릭터와의 차이. 원작 스포일러 지식의 활용·한계. 정체 노출 긴장.",
  },
  {
    id: "possession-game",
    label: "빙의 · 게임",
    description: "하던 게임 속 캐릭터로.",
    affinity: { tags: ["game", "male", "system", "fantasy"] },
    rules:
      "게임 메커닉·루트·NPC 지식 활용. 현실과 게임 규칙 구분. 버그·밸런스는 설정 범위 내.",
  },
  {
    id: "possession-other",
    label: "빙의 · 타인/사물",
    description: "동시대 타인, 몬스터, 사물로.",
    affinity: { tags: ["fantasy", "romance", "horror", "male"] },
    rules:
      "원 주인과 빙의자 기억·성격 차이. 몸의 습관·말투 불일치를 긴장 요소로.",
  },
  {
    id: "reincarnation",
    label: "환생",
    description: "이세계 새 생명, 후손으로 태어남.",
    affinity: { tags: ["fantasy", "romance", "oriental", "female"] },
    rules:
      "전생 기억·목표·트라우마가 동기. 윤회·신·세계관 규칙 바이블 일치.",
  },
  {
    id: "dimension-summon",
    label: "차원이동/소환",
    description: "현실→이세계 강제 소환, 용사 소환, 튜토리얼 지역.",
    affinity: { tags: ["fantasy", "game", "male", "system"] },
    rules:
      "현대 지식은 문화 충격·유머에. 이계 규칙·언어·관습은 바이블 따름.",
  },
  {
    id: "return",
    label: "귀환",
    description: "이세계 평정 후 원래 현대 지구로 복귀.",
    affinity: { tags: ["modern", "fantasy", "male", "hunter"] },
    rules:
      "이세계 경험과 현대의 괴리. 귀환자만의 지식·트라우마·목표.",
  },
  {
    id: "awakening",
    label: "각성/기연",
    description: "숨겨진 재능, 시스템/기연으로 갑작스런 능력.",
    affinity: { tags: ["hunter", "modern", "fantasy", "game", "male"] },
    rules:
      "각성 조건·한계·성장 속도 일관. 갑작스러운 파워 인플레이션 주의.",
  },
  {
    id: "none-linear",
    label: "해당 없음 (선형 진행)",
    description: "특수 시작 장치 없이 선형 서사.",
    rules: "회귀·빙의 등 없이 주어진 바이블·아크에서 자연스럽게 전개.",
  },
];

export const NARRATIVE_TRIGGER_NONE_ID = "none-linear";

export function getNarrativeTriggerById(id: string): ConceptPreset | undefined {
  return NARRATIVE_TRIGGER_PRESETS.find((p) => p.id === id);
}
