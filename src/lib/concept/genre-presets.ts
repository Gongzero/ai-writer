import type { ConceptPreset } from "./types";
import { DEFAULT_TARGET_GROUP_ID } from "./target-group-presets";

/** 2-Depth: 상세 장르 (parentId = 타겟층 id) */
export const GENRE_PRESETS: ConceptPreset[] = [
  {
    id: "male-fantasy-modern",
    parentId: "male",
    label: "현대 판타지 (현판)",
    description: "현대 배경 판타지·헌터·이능력.",
    rules:
      "남성향 현대 판타지. 성장·능력·사이다 전개. 현대 사회와 초자연 요소 균형. 바이블 설정 일치.",
  },
  {
    id: "male-fantasy-classic",
    parentId: "male",
    label: "정통 판타지",
    description: "고전 판타지·마법·영웅 서사.",
    rules: "정통 판타지 톤. 마법·종족·장엄한 대서사. 성장과 모험 중심.",
  },
  {
    id: "male-fantasy-fusion",
    parentId: "male",
    label: "퓨전 판타지",
    description: "장르 혼합 판타지.",
    rules: "여러 장르 요소 혼합, 설정 붕괴 없이. 퓨전의 맛 유지.",
  },
  {
    id: "male-wuxia-classic",
    parentId: "male",
    label: "정통 무협",
    description: "강호·문파·무공.",
    rules: "무공·문파·강호 일관. 말투·신분 반영. 행동 묘사 간결·임팩트.",
  },
  {
    id: "male-wuxia-new",
    parentId: "male",
    label: "신무협",
    description: "현대적 재해석 무협.",
    rules: "무협+현대 서사·시스템·유머. 정통 감성과 속도감 균형.",
  },
  {
    id: "male-alt-history",
    parentId: "male",
    label: "대체역사",
    description: "역사 변경·국뽕·기술발전.",
    rules: "역사·기술 변화 인과 명확. 작품 설정 범위 내 일관.",
  },
  {
    id: "male-sf-game",
    parentId: "male",
    label: "SF / 게임",
    description: "SF·게임 세계.",
    rules: "SF·게임 문법 반영. 과학·기술·세계관 규칙 바이블 준수.",
  },
  {
    id: "male-subculture",
    parentId: "male",
    label: "남성향 서브컬처 (캐빨물)",
    description: "캐릭터 빨기·덕후 소재.",
    rules: "캐릭터 매력·서브컬처 활용. 설명조 내레이션 지양.",
  },
  {
    id: "female-romantasy",
    parentId: "female",
    label: "로맨스 판타지 (로판)",
    description: "판타지 배경 로맨스.",
    rules: "감정선·관계 변화·설렘. 황궁·귀족 맥락 중시.",
  },
  {
    id: "female-modern-romance",
    parentId: "female",
    label: "현대 로맨스 (현로)",
    description: "현대 배경 로맨스.",
    rules: "현대 직업·일상·관계 리얼리티. 로맨스 라인 일관.",
  },
  {
    id: "female-oriental-romantasy",
    parentId: "female",
    label: "동양풍 로판",
    description: "동양풍 궁중·가문.",
    rules: "동양 예법·칭호·가문. 궁중 암투·신분 차이 활용.",
  },
  {
    id: "female-wuxia-romance",
    parentId: "female",
    label: "무협 로맨스",
    description: "무협 배경 로맨스.",
    rules: "무협 위에 로맨스 중심. 무공·문파는 배경·긴장 요소.",
  },
  {
    id: "female-lead-fantasy",
    parentId: "narrative",
    label: "여주판",
    description: "로맨스 배제·사건 중심 여주 판타지.",
    rules: "여주 시점·성장·사건 해결. 로맨스 부차적 또는 없음.",
  },
  {
    id: "other-horror",
    parentId: "other",
    label: "공포 / 미스터리 / 괴담",
    description: "공포·추리·괴담.",
    rules: "불안·미스터리·반전. 공포는 암시와 분위기로.",
  },
  {
    id: "other-bl",
    parentId: "other",
    label: "BL",
    description: "BL.",
    rules: "BL 관례·관계 묘사·인물 심리 중시.",
  },
  {
    id: "other-gl",
    parentId: "other",
    label: "GL",
    description: "GL.",
    rules: "GL 관례·관계 묘사·인물 심리 중시.",
  },
];

export const DEFAULT_GENRE_ID = "male-fantasy-modern";

export function getGenreById(id: string): ConceptPreset | undefined {
  return GENRE_PRESETS.find((p) => p.id === id);
}

export function genresForTarget(targetGroupId: string): ConceptPreset[] {
  return GENRE_PRESETS.filter((p) => p.parentId === targetGroupId);
}

export function targetGroupForGenre(genreId: string): string {
  return GENRE_PRESETS.find((p) => p.id === genreId)?.parentId ?? DEFAULT_TARGET_GROUP_ID;
}

export function defaultGenreForTarget(targetGroupId: string): string {
  return genresForTarget(targetGroupId)[0]?.id ?? DEFAULT_GENRE_ID;
}
