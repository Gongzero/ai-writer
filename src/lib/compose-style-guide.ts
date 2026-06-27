import {
  getGenreById,
  getMechanicById,
  getMoodToneById,
  getNarrativeTriggerById,
  getPlotStructureById,
  getSettingById,
  getSettingGroupById,
  getTargetGroupById,
  getTropeById,
} from "./concept";

function sectionRules(
  title: string,
  ids: string[],
  getter: (id: string) => { label: string; rules: string } | undefined,
  emptyText: string
): string[] {
  const lines: string[] = [title];
  if (ids.length === 0) {
    lines.push(emptyText);
    return lines;
  }
  for (const id of ids) {
    const item = getter(id);
    if (item) lines.push(`· ${item.label}: ${item.rules}`);
  }
  return lines;
}

export function composeStyleGuide(concept: {
  targetGroupId: string;
  genreId: string;
  settingGroupId: string;
  settingId: string;
  mechanicIds: string[];
  narrativeTriggerIds: string[];
  plotStructureId: string;
  tropeIds: string[];
  moodToneId: string;
}): string {
  const sections: string[] = [];

  const target = getTargetGroupById(concept.targetGroupId);
  const genre = getGenreById(concept.genreId);
  sections.push("【1. 타겟 및 장르】");
  sections.push(
    `${target?.label ?? ""} › ${genre?.label ?? ""}: ${genre?.rules ?? "바이블 장르 설정을 따릅니다."}`
  );

  sections.push("");
  const settingGroup = getSettingGroupById(concept.settingGroupId);
  const setting = getSettingById(concept.settingId);
  sections.push("【2. 시공간 무대】");
  sections.push(
    `${settingGroup?.label ?? ""} › ${setting?.label ?? ""}: ${setting?.rules ?? "바이블 배경 설정을 따릅니다."}`
  );

  sections.push("");
  sections.push(
    ...sectionRules(
      "【3. 핵심 세계관 규칙 및 시스템】",
      concept.mechanicIds,
      getMechanicById,
      "초자연·시스템 규칙 없음(현실 물리). 바이블 설정 우선."
    )
  );

  sections.push("");
  sections.push(
    ...sectionRules(
      "【4. 서사 시작 장치】",
      concept.narrativeTriggerIds,
      getNarrativeTriggerById,
      "특수 시작 장치 없음. 선형적으로 전개."
    )
  );

  sections.push("");
  const plot = getPlotStructureById(concept.plotStructureId);
  sections.push("【5. 서사 구조 및 전개】");
  sections.push(plot?.rules ?? "바이블·아크 뼈대를 따릅니다.");

  sections.push("");
  sections.push(
    ...sectionRules(
      "【6. 핵심 소재 및 공간】",
      concept.tropeIds,
      getTropeById,
      "특정 트로프 태그 없음. 바이블 소재를 따릅니다."
    )
  );

  sections.push("");
  const mood = getMoodToneById(concept.moodToneId);
  sections.push("【7. 분위기 및 톤】");
  sections.push(mood?.rules ?? "3인칭 전지적, 과거형. 대사는 큰따옴표.");

  sections.push("");
  sections.push("【공통】");
  sections.push(
    "바이블 파일·아크·이전 화 요약과 모순되지 않게. 고유명사·말투·설정 일관성 유지. 본문만 출력(해설·메타 없음)."
  );

  return sections.join("\n");
}
