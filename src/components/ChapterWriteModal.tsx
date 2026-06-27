"use client";

import { useEffect, useMemo, useState } from "react";
import { StepModal } from "@/components/home/StepModal";
import { TossMultiSelect } from "@/components/ui/TossMultiSelect";
import { TossSelectProvider } from "@/components/ui/toss-select-context";
import { formatArcChapterRange } from "@/lib/arc-stages";
import {
  formatMicroArcChapterRange,
  microArcStageLabel,
} from "@/lib/micro-arc-stages";
import { generateChapterOutline, streamBody } from "@/lib/gemini";
import type { ChapterBriefing } from "@/lib/chapter-briefing";
import { computeUsedTokens, type ContextChip } from "@/lib/context";
import { getAiWarnings } from "@/lib/readiness";
import type { ReadinessItem } from "@/lib/readiness";
import type { ProjectData } from "@/lib/types";

const STEPS = [
  { title: "브리핑", desc: "이번 화에 넣을 컨텍스트를 확인해요." },
  { title: "설계", desc: "제목과 장면 뼈대를 잡아요." },
  { title: "본문", desc: "아웃라인을 바탕으로 본문을 생성해요." },
] as const;

function bibleFileLabel(project: ProjectData, fileId: string): string {
  const file = project.bibleFiles.find((f) => f.id === fileId);
  if (!file) return "삭제된 항목";
  return file.title.trim() || "이름 없음";
}

interface ChapterWriteModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  project: ProjectData;
  chapterId: string;
  chapterNumber: number;
  briefing: ChapterBriefing;
  briefingSummary: string;
  composedInstruction: string;
  chips: ContextChip[];
  clues: string[];
  worldOptions: { id: string; label: string }[];
  pinnedWorldIds: string[];
  onPinnedWorldChange: (ids: string[]) => void;
  onToggleChip: (id: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  additionalInstruction: string;
  onAdditionalInstructionChange: (value: string) => void;
  outline: string;
  onOutlineChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  onRequestAiProceed?: (
    warnings: ReadinessItem[],
    onProceed: () => void,
    title?: string
  ) => void;
}

export function ChapterWriteModal({
  open,
  onClose,
  onComplete,
  project,
  chapterId,
  chapterNumber,
  briefing,
  briefingSummary,
  composedInstruction,
  chips,
  clues,
  worldOptions,
  pinnedWorldIds,
  onPinnedWorldChange,
  onToggleChip,
  title,
  onTitleChange,
  additionalInstruction,
  onAdditionalInstructionChange,
  outline,
  onOutlineChange,
  content,
  onContentChange,
  onRequestAiProceed,
}: ChapterWriteModalProps) {
  const [step, setStep] = useState(0);
  const [modalError, setModalError] = useState<string | null>(null);
  const [outlineBusy, setOutlineBusy] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [bodyDone, setBodyDone] = useState(false);

  const hasApiKey = Boolean(project.settings.apiKey.trim());
  const targetLength = project.settings.defaultChapterLength;
  const usedTokens = computeUsedTokens(chips);
  const tokenWarning = usedTokens > project.settings.tokenWarningThreshold;
  const optionalChips = chips.filter((c) => !c.locked);
  const busy = outlineBusy || isStreaming;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setModalError(null);
    setOutlineBusy(false);
    setIsStreaming(false);
    setStreamProgress(0);
    setBodyDone(false);
  }, [open, chapterId]);

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const guardAi = (
    action: "outline" | "body",
    run: () => void,
    title?: string
  ) => {
    const warnings = getAiWarnings(project, chapterNumber, action, outline);
    if (onRequestAiProceed) {
      onRequestAiProceed(warnings, run, title);
      return;
    }
    run();
  };

  const runOutline = async () => {
    if (!hasApiKey) {
      setModalError("⚙ 설정에서 Gemini API 키가 필요합니다.");
      return;
    }
    setModalError(null);
    setOutlineBusy(true);
    try {
      const text = await generateChapterOutline(
        project,
        additionalInstruction,
        chips,
        briefing,
        clues
      );
      onOutlineChange(text);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "아웃라인 생성 실패");
    } finally {
      setOutlineBusy(false);
    }
  };

  const runBody = async () => {
    if (!outline.trim()) {
      setModalError("아웃라인을 먼저 작성하거나 생성해 주세요.");
      setStep(1);
      return;
    }
    if (!hasApiKey) {
      setModalError("⚙ 설정에서 Gemini API 키가 필요합니다.");
      return;
    }
    setModalError(null);
    setIsStreaming(true);
    setBodyDone(false);
    onContentChange("");
    setStreamProgress(0);
    try {
      let accumulated = "";
      for await (const chunk of streamBody(
        project,
        composedInstruction,
        chips,
        chapterNumber,
        outline
      )) {
        accumulated += chunk;
        onContentChange(accumulated);
        setStreamProgress(
          Math.min(99, Math.round((accumulated.length / targetLength) * 100))
        );
      }
      setStreamProgress(100);
      setBodyDone(true);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "본문 생성 실패");
    } finally {
      setIsStreaming(false);
    }
  };

  const canNext = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return outline.trim().length > 0;
    return false;
  }, [outline, step]);

  const goBack = () => {
    if (busy) return;
    if (step === 0) handleClose();
    else setStep((s) => s - 1);
  };

  const goNext = () => {
    if (!canNext || busy) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const footer = (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        type="button"
        onClick={goBack}
        disabled={busy}
        className="toss-btn-tertiary px-5 py-2.5 text-[15px]"
      >
        {step === 0 ? "닫기" : "이전"}
      </button>

      {step === 0 ? (
        <button
          type="button"
          onClick={goNext}
          disabled={busy}
          className="toss-btn-primary px-5 py-2.5 text-[15px]"
        >
          다음
        </button>
      ) : null}

      {step === 1 ? (
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext || busy}
          className="toss-btn-primary px-5 py-2.5 text-[15px]"
        >
          다음
        </button>
      ) : null}

      {step === 2 ? (
        bodyDone ? (
          <button
            type="button"
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="toss-btn-primary px-5 py-2.5 text-[15px]"
          >
            완료
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              guardAi("body", () => void runBody(), "본문 생성 전 확인")
            }
            disabled={isStreaming || !hasApiKey}
            className="toss-btn-primary px-5 py-2.5 text-[15px]"
          >
            {isStreaming ? `생성 중 ${streamProgress}%` : "본문 생성"}
          </button>
        )
      ) : null}
    </div>
  );

  return (
    <StepModal
      open={open}
      onClose={handleClose}
      step={step + 1}
      totalSteps={STEPS.length}
      title={STEPS[step].title}
      description={STEPS[step].desc}
      footer={footer}
    >
      {modalError ? <p className="toss-bible-form-error mb-4">{modalError}</p> : null}

      {!hasApiKey ? (
        <p className="toss-bible-form-hint mb-4">
          ⚙ 설정에서 Gemini API 키를 입력하면 AI 아웃라인·본문 생성이 됩니다.
        </p>
      ) : null}

      {step === 0 ? (
        <TossSelectProvider>
          <div className="space-y-5">
            <div className="toss-bible-form-field toss-bible-form-field-block">
              <p className="toss-bible-form-label">이번 화 위치</p>
              {briefing.macroArc ? (
                <>
                  <p className="toss-bible-form-hint">
                    거시 아크 {formatArcChapterRange(briefing.macroArc)}
                    {briefing.microArc
                      ? ` · 소아크 ${formatMicroArcChapterRange(briefing.microArc)}`
                      : ""}
                    {briefing.microPosition
                      ? ` · 소아크 ${briefing.microPosition.index}/${briefing.microPosition.total}번째 화`
                      : ""}
                  </p>
                  <p className="toss-chapter-briefing-path">
                    <span>{briefing.macroArc.title}</span>
                    {briefing.microArc ? (
                      <>
                        <span className="toss-chapter-briefing-sep">›</span>
                        <span>
                          {briefing.microArc.title} (
                          {microArcStageLabel(briefing.microArc.stage)})
                        </span>
                      </>
                    ) : null}
                  </p>
                </>
              ) : (
                <p className="toss-callout-warning">
                  회차 뼈대에서 이 화의 회차 범위를 먼저 잡아 주세요.
                </p>
              )}
            </div>

            <div className="toss-bible-form-field toss-bible-form-field-block">
              <p className="toss-bible-form-label">이번 화 줄거리 (소아크)</p>
              <div className="toss-bible-readonly-block whitespace-pre-line">
                {briefingSummary}
              </div>
            </div>

            {(briefing.linkedCharacterIds.length > 0 ||
              briefing.linkedEventIds.length > 0) && (
              <div className="toss-bible-form-field toss-bible-form-field-block">
                <p className="toss-bible-form-label">아크 연결 바이블</p>
                <ul className="toss-chapter-linked-list">
                  {briefing.linkedCharacterIds.map((id) => (
                    <li key={id}>인물 · {bibleFileLabel(project, id)}</li>
                  ))}
                  {briefing.linkedEventIds.map((id) => (
                    <li key={id}>사건 · {bibleFileLabel(project, id)}</li>
                  ))}
                </ul>
              </div>
            )}

            {worldOptions.length > 0 ? (
              <TossMultiSelect
                label="고정 세계관"
                legend="고정 세계관"
                hint="매 화 집필 시 항상 AI 컨텍스트에 넣습니다."
                options={worldOptions}
                selected={pinnedWorldIds}
                onChange={onPinnedWorldChange}
                placeholder="세계관 선택"
              />
            ) : null}

            {optionalChips.length > 0 ? (
              <div className="toss-bible-form-field toss-bible-form-field-block">
                <p className="toss-bible-form-label">추가 컨텍스트</p>
                <p className="toss-bible-form-hint">
                  {usedTokens.toLocaleString()} /{" "}
                  {project.settings.tokenWarningThreshold.toLocaleString()} tokens
                  {tokenWarning ? " · 토큰 경고" : ""}
                </p>
                <div className="toss-chapter-briefing-chips">
                  {optionalChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => onToggleChip(chip.id)}
                      className={`toss-chip ${
                        chip.selected ? "toss-chip-selected" : "toss-chip-muted"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {clues.length > 0 ? (
              <div className="toss-bible-form-field toss-bible-form-field-block">
                <p className="toss-bible-form-label">열린 복선</p>
                <ul className="toss-chapter-clues">
                  {clues.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </TossSelectProvider>
      ) : null}

      {step === 1 ? (
        <div className="space-y-5">
          <div className="toss-bible-form-field toss-bible-form-field-block">
            <label className="toss-bible-form-label" htmlFor={`write-title-${chapterId}`}>
              화 제목
            </label>
            <input
              id={`write-title-${chapterId}`}
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="toss-bible-form-input"
              placeholder="예: 각성의 전날"
            />
          </div>

          <div className="toss-bible-form-field toss-bible-form-field-block">
            <label
              className="toss-bible-form-label"
              htmlFor={`write-extra-${chapterId}`}
            >
              추가 지시
            </label>
            <p className="toss-bible-form-hint">이번 화만 특별히 강조할 내용 (선택)</p>
            <textarea
              id={`write-extra-${chapterId}`}
              value={additionalInstruction}
              onChange={(e) => onAdditionalInstructionChange(e.target.value)}
              rows={2}
              className="toss-bible-form-textarea !min-h-0"
              placeholder="예: 이번 화는 긴장감 위주, 대사는 짧게"
            />
          </div>

          <div className="toss-bible-form-field toss-bible-form-field-block">
            <label
              className="toss-bible-form-label"
              htmlFor={`write-outline-${chapterId}`}
            >
              장면 뼈대 (아웃라인)
            </label>
            <p className="toss-bible-form-hint">
              소아크를 이번 화 분량으로 쪼갠 장면 목록
            </p>
            <button
              type="button"
              className="toss-btn-secondary w-full"
              onClick={() =>
                guardAi("outline", () => void runOutline(), "아웃라인 생성 전 확인")
              }
              disabled={outlineBusy || isStreaming || !hasApiKey}
            >
              {outlineBusy ? "아웃라인 생성 중…" : "아웃라인 생성"}
            </button>
            <textarea
              id={`write-outline-${chapterId}`}
              value={outline}
              onChange={(e) => onOutlineChange(e.target.value)}
              rows={8}
              className="toss-bible-form-textarea !min-h-0"
              placeholder={"장면1: …\n장면2: …"}
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="toss-bible-form-field toss-bible-form-field-block">
          <p className="toss-bible-form-label">본문 미리보기</p>
          <p className="toss-bible-form-hint">
            {isStreaming
              ? `AI가 본문을 생성하는 중입니다 (${streamProgress}%)`
              : bodyDone
                ? "생성이 끝났어요. 완료를 누르면 원고 탭에서 편집할 수 있어요."
                : "아래에서 본문 생성을 시작하세요."}
          </p>
          <textarea
            readOnly
            value={content}
            rows={12}
            className="toss-bible-form-textarea toss-chapter-body-textarea !min-h-[240px]"
            placeholder="본문이 여기에 생성됩니다."
          />
        </div>
      ) : null}
    </StepModal>
  );
}
