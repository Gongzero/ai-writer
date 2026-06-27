"use client";

import { contentRatingLabel } from "@/lib/content-rating";
import {
  getGenreById,
  getMoodToneById,
  getPlotStructureById,
  getSettingById,
  getSettingGroupById,
  getTargetGroupById,
  getTropeById,
  getMechanicById,
  getNarrativeTriggerById,
} from "@/lib/concept";
import type { ProjectSettings } from "@/lib/types";

interface ConceptSidebarProps {
  settings: ProjectSettings;
}

function joinLabels(ids: string[], getter: (id: string) => string | undefined) {
  const labels = ids.map((id) => getter(id)).filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : "없음";
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="toss-summary-card !mb-2 !cursor-default hover:!bg-[var(--toss-gray-100)]">
      <span className="toss-summary-card-body">
        <span className="toss-summary-card-label">{label}</span>
        <span className="toss-summary-card-value">{value}</span>
      </span>
    </div>
  );
}

export function ConceptSidebar({ settings }: ConceptSidebarProps) {
  return (
    <div className="space-y-3">
      <p className="toss-sidebar-section-title">현재 컨셉 요약</p>
      <SummaryRow label="이용등급" value={contentRatingLabel(settings.contentRating)} />
      <SummaryRow
        label="타겟·장르"
        value={`${getTargetGroupById(settings.targetGroupId)?.label ?? "—"} · ${
          getGenreById(settings.genreId)?.label ?? "—"
        }`}
      />
      <SummaryRow
        label="무대"
        value={`${getSettingGroupById(settings.settingGroupId)?.label ?? "—"} · ${
          getSettingById(settings.settingId)?.label ?? "—"
        }`}
      />
      <SummaryRow
        label="세계관 규칙"
        value={joinLabels(settings.mechanicIds, (id) => getMechanicById(id)?.label)}
      />
      <SummaryRow
        label="시작 장치"
        value={joinLabels(settings.narrativeTriggerIds, (id) =>
          getNarrativeTriggerById(id)?.label
        )}
      />
      <SummaryRow
        label="전개 구조"
        value={getPlotStructureById(settings.plotStructureId)?.label ?? "—"}
      />
      <SummaryRow
        label="소재 태그"
        value={joinLabels(settings.tropeIds, (id) => getTropeById(id)?.label)}
      />
      <SummaryRow
        label="분위기·톤"
        value={getMoodToneById(settings.moodToneId)?.label ?? "—"}
      />
      <p className="toss-callout mt-2">컨셉 → 바이블 → 회차 뼈대 → 원고</p>
    </div>
  );
}
