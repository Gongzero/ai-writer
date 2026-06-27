import type { ConceptPreset } from "./types";
import { DEFAULT_SETTING_GROUP_ID } from "./setting-group-presets";

/** 2-Depth 2: 상세 배경 (parentId = setting group id) */
export const SETTING_PRESETS: ConceptPreset[] = [
  {
    id: "modern-pure",
    parentId: "modern-earth",
    label: "순수 현대",
    description: "비초자연, 재벌/오피스/전문직.",
    rules: "현실 물리·사회 규칙. 초자연 없음(바이블 예외 제외).",
  },
  {
    id: "modern-hidden",
    parentId: "modern-earth",
    label: "이면 세계",
    description: "헌터·이능력 사회.",
    rules: "겉은 현대, 이면에 각성자·게이트. 이중 구조·등급 바이블 일치.",
  },
  {
    id: "modern-apocalypse",
    parentId: "modern-earth",
    label: "현대 아포칼립스",
    description: "괴수·좀비 직후.",
    rules: "멸망 직후 생존·자원·위협. 절박함과 희망 대비.",
  },
  {
    id: "history-korea",
    parentId: "historical",
    label: "한국사",
    description: "조선·고려·삼국.",
    rules: "시대·예법·관직·지명 바이블 일치.",
  },
  {
    id: "history-western",
    parentId: "historical",
    label: "서양사",
    description: "빅토리아·로마·세계대전.",
    rules: "서양 시대 사회·기술·정치 맥락.",
  },
  {
    id: "history-oriental",
    parentId: "historical",
    label: "기타 동양사",
    description: "중국·일본 등 동양 역사.",
    rules: "동양 역사·예법·관직 맥락 일관.",
  },
  {
    id: "fantasy-medieval",
    parentId: "fantasy-world",
    label: "중세/근세 유럽풍",
    description: "황궁·귀족·마탑.",
    rules: "봉건·귀족·마법사 길드·왕국 정치.",
  },
  {
    id: "fantasy-nordic",
    parentId: "fantasy-world",
    label: "북유럽/켈트 신화풍",
    description: "혹한·바이킹·신전쟁.",
    rules: "신화·룬·혹한·전쟁 톤.",
  },
  {
    id: "fantasy-steampunk",
    parentId: "fantasy-world",
    label: "스팀펑크 / 마동공학",
    description: "증기기관·마동공학.",
    rules: "기계·마법 융합. 산업·계급 분위기.",
  },
  {
    id: "wuxia-central",
    parentId: "wuxia-oriental",
    label: "중원",
    description: "구파일방·마교·새외무림.",
    rules: "강호·문파·지리·무공 체계 일치.",
  },
  {
    id: "wuxia-immortal",
    parentId: "wuxia-oriental",
    label: "선협",
    description: "수선화·비승·영기.",
    rules: "선계·영기·도법. 초월적 스케일.",
  },
  {
    id: "wuxia-oriental-empire",
    parentId: "wuxia-oriental",
    label: "가상 동양풍 제국",
    description: "궁중 암투.",
    rules: "동양 제국·궁중·가문·암투.",
  },
  {
    id: "future-space",
    parentId: "future-virtual",
    label: "스페이스 오페라",
    description: "은하 제국·함대.",
    rules: "우주·함대·제국 정치·SF 기술.",
  },
  {
    id: "future-cyberpunk",
    parentId: "future-virtual",
    label: "사이버펑크",
    description: "메가코프·디스토피아.",
    rules: "기업 지배·해킹·사이버웨어.",
  },
  {
    id: "future-post-apoc",
    parentId: "future-virtual",
    label: "포스트 아포칼립스",
    description: "멸망 후 황무지.",
    rules: "황무지·잔해·재건·생존.",
  },
  {
    id: "future-vr",
    parentId: "future-virtual",
    label: "가상현실 (VR 게임)",
    description: "VR 캡슐 게임 속.",
    rules: "현실·VR 이중 구조. 게임 규칙 바이블 일치.",
  },
  {
    id: "future-infinite",
    parentId: "future-virtual",
    label: "무한류 무대",
    description: "차원·작품이 끊임없이 변경.",
    rules: "무대 전환 시 인과·캐릭터 연속성 유지.",
  },
];

export const DEFAULT_SETTING_ID = "modern-hidden";

/** @deprecated history-world → history-western */
const SETTING_ID_ALIASES: Record<string, string> = {
  "history-world": "history-western",
};

export function getSettingById(id: string): ConceptPreset | undefined {
  const resolved = SETTING_ID_ALIASES[id] ?? id;
  return SETTING_PRESETS.find((p) => p.id === resolved);
}

export function settingsForGroup(settingGroupId: string): ConceptPreset[] {
  return SETTING_PRESETS.filter((p) => p.parentId === settingGroupId);
}

export function settingGroupForSetting(settingId: string): string {
  const resolved = SETTING_ID_ALIASES[settingId] ?? settingId;
  return (
    SETTING_PRESETS.find((p) => p.id === resolved)?.parentId ?? DEFAULT_SETTING_GROUP_ID
  );
}

export function defaultSettingForGroup(settingGroupId: string): string {
  return settingsForGroup(settingGroupId)[0]?.id ?? DEFAULT_SETTING_ID;
}
