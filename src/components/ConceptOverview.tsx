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

export const CONCEPT_OVERVIEW_ROWS = [
  { step: 0, label: "이용등급" },
  { step: 1, label: "메인 타겟층" },
  { step: 2, label: "상세 장르" },
  { step: 3, label: "거시적 무대" },
  { step: 4, label: "상세 배경" },
  { step: 5, label: "세계관 규칙" },
  { step: 6, label: "서사 시작 장치" },
  { step: 7, label: "서사 구조" },
  { step: 8, label: "핵심 소재" },
  { step: 9, label: "분위기 및 톤" },
] as const;

function joinLabels(ids: string[], getter: (id: string) => string | undefined) {
  const labels = ids.map((id) => getter(id)).filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : "—";
}

function dash(value: string | undefined | null) {
  if (!value || value === "—" || value === "없음") return "—";
  return value;
}

export function conceptOverviewValues(settings: ProjectSettings) {
  const target = getTargetGroupById(settings.targetGroupId)?.label;
  const genre = getGenreById(settings.genreId)?.label;
  const settingGroup = getSettingGroupById(settings.settingGroupId)?.label;
  const setting = getSettingById(settings.settingId)?.label;

  const cardTitle =
    genre && target ? `${genre} · ${target}` : genre ?? target ?? "컨셉 미설정";
  const cardSubtitle =
    settingGroup && setting
      ? `${settingGroup} · ${setting}`
      : settingGroup ?? setting ?? "항목을 선택해 작품 컨셉을 완성해 보세요";

  const values = [
    contentRatingLabel(settings.contentRating),
    dash(target),
    dash(genre),
    dash(settingGroup),
    dash(setting),
    joinLabels(settings.mechanicIds, (id) => getMechanicById(id)?.label),
    joinLabels(settings.narrativeTriggerIds, (id) => getNarrativeTriggerById(id)?.label),
    dash(getPlotStructureById(settings.plotStructureId)?.label),
    settings.tropeIds.length > 0
      ? joinLabels(settings.tropeIds, (id) => getTropeById(id)?.label)
      : "—",
    dash(getMoodToneById(settings.moodToneId)?.label),
  ];

  return { cardTitle, cardSubtitle, values };
}

interface ConceptOverviewProps {
  settings: ProjectSettings;
  editingStep: number | null;
  onEdit: () => void;
  onRowClick: (step: number) => void;
}

export function ConceptOverview({
  settings,
  editingStep,
  onEdit,
  onRowClick,
}: ConceptOverviewProps) {
  const { cardTitle, cardSubtitle, values } = conceptOverviewValues(settings);

  return (
    <div className="toss-concept-page">
      <header className="toss-concept-page-head">
        <h2 className="toss-concept-page-title">소설 컨셉</h2>
        <p className="toss-concept-page-desc">
          작품의 기본 컨셉을 설정하고 관리할 수 있어요.
        </p>
      </header>

      <div className="toss-concept-card">
        <div className="toss-concept-card-profile">
          <div className="toss-concept-app-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="2" width="18" height="20" rx="3" fill="#D1D6DB" />
              <path
                d="M8 8h8M8 12h8M8 16h5"
                stroke="#8B95A1"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="toss-concept-card-text">
            <p className="toss-concept-card-name">{cardTitle}</p>
            <p className="toss-concept-card-sub">{cardSubtitle}</p>
          </div>
          <button type="button" onClick={onEdit} className="toss-concept-edit-btn">
            수정하기
          </button>
        </div>

        <div className="toss-concept-card-divider" role="separator" />

        <dl className="toss-concept-spec-list">
          {CONCEPT_OVERVIEW_ROWS.map((row, i) => (
            <div key={row.step} className="toss-concept-spec-row">
              <dt className="toss-concept-spec-label">{row.label}</dt>
              <dd className="toss-concept-spec-value">
                <button
                  type="button"
                  onClick={() => onRowClick(row.step)}
                  className={`toss-concept-spec-btn ${
                    editingStep === row.step ? "toss-concept-spec-btn-active" : ""
                  }`}
                >
                  {values[i]}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
