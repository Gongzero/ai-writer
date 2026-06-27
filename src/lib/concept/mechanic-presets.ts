import type { ConceptPreset } from "./types";

/** 3. 핵심 세계관 규칙 및 시스템 — 복수 선택 */
export const MECHANIC_PRESETS: ConceptPreset[] = [
  {
    id: "game-system",
    label: "상태창/게임 시스템",
    description: "레벨, 스탯, 스킬, 인벤, 퀘스트창.",
    affinity: { tags: ["game", "system", "fantasy", "hunter"] },
    rules:
      "레벨·스탯·스킬·인벤·퀘스트 UI는 바이블 용어 통일. 수치 나열 최소화, 행동·선택으로 보여줌.",
  },
  {
    id: "constellation",
    label: "성좌/신위 시스템",
    description: "후원자, 방송 채널, 후원금/코인.",
    affinity: { tags: ["game", "system", "fantasy", "male"] },
    rules:
      "성좌·신·방송·후원 메시지는 서사 긴장·유머에 활용. 후원자 성격·조건 바이블 일치.",
  },
  {
    id: "mana-magic",
    label: "마나/마법 체계",
    description: "서클 마법, 정령술, 흑마법, 연금술.",
    affinity: { tags: ["fantasy", "historical", "romance"] },
    rules:
      "마법 등급·소모·속성·금기는 바이블 규칙. 마법 전투는 원인·결과 명확히.",
  },
  {
    id: "martial-qi",
    label: "무공/기(氣)",
    description: "내공, 심법, 검기, 화경/현경, 독술.",
    affinity: { tags: ["wuxia", "oriental"] },
    rules:
      "경지·무공명·내공 체계 일관. 돌파·대결은 설정 붕괴 없이 단계적으로.",
  },
  {
    id: "superpower",
    label: "이능력/초능력",
    description: "각성, 텔레파시/염동력, 초인적 신체.",
    affinity: { tags: ["hunter", "modern", "fantasy", "male"] },
    rules:
      "능력 범위·한계·각성 조건 명확. 능력 남용·인플레이션 주의.",
  },
  {
    id: "special-relationship-world",
    label: "특수 관계성 세계관",
    description: "가이드버스, 오메가버스, 네임버스 등.",
    affinity: { tags: ["romance", "bl", "gl", "modern"] },
    rules:
      "해당 세계관 규칙(성별·등급·짝 등) 바이블 준수. 관계 드라마와 설정 균형.",
  },
  {
    id: "monster-evolution",
    label: "종족 변이/진화",
    description: "몬스터 진화, 포식/흡수 성장.",
    affinity: { tags: ["fantasy", "hunter", "game", "male"] },
    rules:
      "진화·흡수 조건·한계 일관. 성장 곡선 급격한 점프 지양.",
  },
  {
    id: "none",
    label: "해당 없음",
    description: "완전한 현실 물리법칙.",
    affinity: { tags: ["modern", "romance"] },
    rules: "초자연·게임형 시스템 없음. 현실 물리·사회 규칙만 적용.",
  },
];

export const MECHANIC_NONE_ID = "none";

export function getMechanicById(id: string): ConceptPreset | undefined {
  return MECHANIC_PRESETS.find((p) => p.id === id);
}
