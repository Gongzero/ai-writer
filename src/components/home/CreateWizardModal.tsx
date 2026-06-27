"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ConceptEditor } from "@/components/ConceptEditor";
import { StepModal } from "@/components/home/StepModal";
import { ProgressiveReveal } from "@/components/ui/ProgressiveReveal";
import { addArcToProject } from "@/lib/arc";
import { addChapterToProject } from "@/lib/chapters";
import { saveProject, setActiveProjectId } from "@/lib/db";
import { uid } from "@/lib/ids";
import { applyConceptAxes } from "@/lib/concept-settings";
import { isConceptFoundationReady, type ProjectData } from "@/lib/types";

const STEPS = [
  { id: "concept", title: "소설 컨셉", desc: "장르·무대·태그" },
  { id: "bible", title: "바이블", desc: "인물·세계관" },
  { id: "arc", title: "회차 뼈대", desc: "큰 흐름" },
  { id: "chapters", title: "상세 원고", desc: "집필 준비" },
] as const;

interface WizardExtras {
  protagonistName: string;
  worldNote: string;
  arcTitle: string;
  arcSummary: string;
  addFirstChapter: boolean;
}

interface CreateWizardModalProps {
  open: boolean;
  draft: ProjectData;
  onDraftChange: Dispatch<SetStateAction<ProjectData>>;
  onClose: () => void;
  onComplete: () => void;
}

export function CreateWizardModal({
  open,
  draft,
  onDraftChange,
  onClose,
  onComplete,
}: CreateWizardModalProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [extras, setExtras] = useState<WizardExtras>({
    protagonistName: "",
    worldNote: "",
    arcTitle: "1부",
    arcSummary: "",
    addFirstChapter: true,
  });
  const [bibleTouched, setBibleTouched] = useState({ protagonist: false, world: false });
  const [arcTouched, setArcTouched] = useState(false);

  const titleReady = draft.meta.title.trim().length > 0;
  const bibleReveal = useMemo(() => {
    if (!titleReady) return 0;
    if (!bibleTouched.protagonist && !extras.protagonistName.trim()) return 1;
    if (!bibleTouched.world && !extras.worldNote.trim()) return 2;
    return 3;
  }, [titleReady, bibleTouched, extras.protagonistName, extras.worldNote]);

  const arcReveal = extras.arcTitle.trim() ? (arcTouched || extras.arcSummary.trim() ? 1 : 0) : 0;

  const isLast = step === STEPS.length - 1;
  const canNext = useMemo(() => {
    if (step === 0) return isConceptFoundationReady(draft.settings);
    if (step === 1) return draft.meta.title.trim().length > 0;
    return true;
  }, [step, draft]);

  const goBack = () => {
    if (step === 0) onClose();
    else setStep((s) => s - 1);
  };

  const goNext = async () => {
    if (!canNext) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    setSaving(true);
    try {
      let project: ProjectData = {
        ...draft,
        settings: applyConceptAxes(draft.settings, {}),
      };

      if (extras.protagonistName.trim()) {
        project = {
          ...project,
          bibleFiles: [
            ...project.bibleFiles,
            {
              id: uid("bf"),
              categoryId: "characters",
              subfolderId: null,
              title: extras.protagonistName.trim(),
              content: "주인공 설정을 여기에 적어주세요.",
            },
          ],
        };
      }
      if (extras.worldNote.trim()) {
        project = {
          ...project,
          bibleFiles: [
            ...project.bibleFiles,
            {
              id: uid("bf"),
              categoryId: "world",
              subfolderId: null,
              title: "세계관 메모",
              content: extras.worldNote.trim(),
            },
          ],
        };
      }
      if (extras.arcTitle.trim()) {
        project = addArcToProject(project, {
          stage: "macro-exposition",
          title: extras.arcTitle.trim(),
          summary: extras.arcSummary.trim(),
          fromChapter: 1,
          toChapter: 20,
        }).project;
      }
      if (extras.addFirstChapter) {
        project = addChapterToProject(project, { title: "1화" }).project;
      }

      project.settings.lastSidebarTab = extras.addFirstChapter
        ? "chapters"
        : isConceptFoundationReady(project.settings)
          ? "bible"
          : "concept";

      await saveProject(project);
      await setActiveProjectId(project.id);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-between gap-3">
      {step > 0 ? (
        <button
          type="button"
          onClick={goBack}
          className="toss-btn-tertiary px-5 py-2.5 text-[15px]"
        >
          이전
        </button>
      ) : (
        <span aria-hidden className="w-px" />
      )}
      <button
        type="button"
        onClick={goNext}
        disabled={!canNext || saving}
        className="toss-btn-primary px-5 py-2.5 text-[15px]"
      >
        {saving ? "생성 중…" : isLast ? "생성" : "다음"}
      </button>
    </div>
  );

  return (
    <StepModal
      open={open}
      onClose={onClose}
      step={step + 1}
      totalSteps={STEPS.length}
      title={STEPS[step].title}
      description={STEPS[step].desc}
      footer={footer}
    >
      {step === 0 && (
        <ConceptEditor
          embedded
          settings={draft.settings}
          onSettingsChange={(settings) =>
            onDraftChange((prev) => ({ ...prev, settings }))
          }
        />
      )}

      {step === 1 && (
        <div className="space-y-6">
          <ProgressiveReveal show settled={false}>
            <label className="block">
              <span className="toss-field-label">작품 제목</span>
              <input
                value={draft.meta.title}
                onChange={(e) =>
                  onDraftChange({
                    ...draft,
                    meta: { ...draft.meta, title: e.target.value },
                  })
                }
                placeholder="예: 회귀한 헌터의 두 번째 인생"
                className="toss-input"
              />
            </label>
          </ProgressiveReveal>

          <ProgressiveReveal show={bibleReveal >= 1} settled={bibleReveal > 1}>
            <label className="block">
              <span className="toss-field-label">주인공 이름 (선택)</span>
              <input
                value={extras.protagonistName}
                onFocus={() => setBibleTouched((t) => ({ ...t, protagonist: true }))}
                onChange={(e) =>
                  setExtras({ ...extras, protagonistName: e.target.value })
                }
                placeholder="바이블 인물란에 추가됩니다"
                className="toss-input"
              />
              {!extras.protagonistName.trim() ? (
                <button
                  type="button"
                  onClick={() => setBibleTouched((t) => ({ ...t, protagonist: true }))}
                  className="toss-text-link mt-2 px-1 py-1"
                >
                  건너뛰기
                </button>
              ) : null}
            </label>
          </ProgressiveReveal>

          <ProgressiveReveal show={bibleReveal >= 2} settled={bibleReveal > 2}>
            <label className="block">
              <span className="toss-field-label">세계관 한 줄 메모 (선택)</span>
              <textarea
                value={extras.worldNote}
                onFocus={() => setBibleTouched((t) => ({ ...t, world: true }))}
                onChange={(e) => setExtras({ ...extras, worldNote: e.target.value })}
                rows={4}
                placeholder="시대, 배경, 핵심 규칙 등"
                className="toss-textarea"
              />
              {!extras.worldNote.trim() ? (
                <button
                  type="button"
                  onClick={() => setBibleTouched((t) => ({ ...t, world: true }))}
                  className="toss-text-link mt-2 px-1 py-1"
                >
                  건너뛰기
                </button>
              ) : null}
            </label>
          </ProgressiveReveal>

          <ProgressiveReveal show={bibleReveal >= 3} settled={false}>
            <p className="toss-callout">
              바이블은 인물 · 세계관 · 사건으로 나눠 관리해요. 지금 적은 내용은 에디터에서
              이어서 다듬을 수 있어요.
            </p>
          </ProgressiveReveal>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <ProgressiveReveal show settled={arcReveal > 0}>
            <label className="block">
              <span className="toss-field-label">아크 제목</span>
              <input
                value={extras.arcTitle}
                onChange={(e) => setExtras({ ...extras, arcTitle: e.target.value })}
                className="toss-input"
              />
            </label>
          </ProgressiveReveal>

          <ProgressiveReveal show={arcReveal >= 1} settled={false}>
            <label className="block">
              <span className="toss-field-label">아크 줄거리 (선택)</span>
              <textarea
                value={extras.arcSummary}
                onFocus={() => setArcTouched(true)}
                onChange={(e) => setExtras({ ...extras, arcSummary: e.target.value })}
                rows={6}
                placeholder="이 아크에서 벌어질 큰 사건, 목표, 결말 방향"
                className="toss-textarea"
              />
            </label>
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--toss-gray-400)]">
              회차 뼈대는 큰 덩어리별로 이야기 방향을 잡는 도구예요. 세부 화는 원고 탭에서
              추가합니다.
            </p>
          </ProgressiveReveal>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="toss-card space-y-3 px-5 py-4 text-sm">
            <p className="font-semibold text-[var(--foreground)]">설정 요약</p>
            <p className="text-[var(--toss-gray-600)]">
              <span className="text-[var(--toss-gray-400)]">제목</span> ·{" "}
              {draft.meta.title || "—"}
            </p>
            {extras.arcTitle && (
              <p className="text-[var(--toss-gray-600)]">
                <span className="text-[var(--toss-gray-400)]">아크</span> · {extras.arcTitle}
              </p>
            )}
          </div>

          <label className="toss-card flex cursor-pointer items-center gap-3 px-5 py-4">
            <input
              type="checkbox"
              checked={extras.addFirstChapter}
              onChange={(e) =>
                setExtras({ ...extras, addFirstChapter: e.target.checked })
              }
              className="h-5 w-5 rounded accent-[var(--toss-blue)]"
            />
            <div>
              <p className="font-semibold text-[var(--foreground)]">1화 자동 추가</p>
              <p className="mt-0.5 text-xs text-[var(--toss-gray-600)]">
                생성 후 바로 원고 집필을 시작할 수 있어요.
              </p>
            </div>
          </label>
        </div>
      )}
    </StepModal>
  );
}
