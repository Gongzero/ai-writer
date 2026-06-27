"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChapterWriteModal } from "@/components/ChapterWriteModal";
import { TossMultiSelect } from "@/components/ui/TossMultiSelect";
import { TossSelectProvider } from "@/components/ui/toss-select-context";
import { useReadinessWarning } from "@/hooks/useReadinessWarning";
import {
  buildBriefingSummary,
  buildChapterBriefing,
  buildDefaultContextChips,
} from "@/lib/chapter-briefing";
import { updateChapter, updateSettings } from "@/lib/db";
import {
  computeUsedTokens,
  extractOpenClues,
  type ContextChip,
} from "@/lib/context";
import { formatArcChapterRange } from "@/lib/arc-stages";
import {
  formatMicroArcChapterRange,
  microArcStageLabel,
} from "@/lib/micro-arc-stages";
import { getWorldBibleFiles } from "@/lib/bible-world";
import type { Chapter, ProjectData } from "@/lib/types";
import type { PanelSaveState } from "@/lib/panel-save-state";

type ChapterEditorTab = "briefing" | "design" | "body";

interface ChapterEditorProps {
  project: ProjectData;
  chapter: Chapter;
  onSaved: (project: ProjectData) => void;
  onSaveStateChange?: (state: PanelSaveState | null) => void;
}

const CHAPTER_TABS: { id: ChapterEditorTab; label: string }[] = [
  { id: "briefing", label: "브리핑" },
  { id: "design", label: "설계" },
  { id: "body", label: "본문" },
];

function bibleFileLabel(
  project: ProjectData,
  fileId: string
): string {
  const file = project.bibleFiles.find((f) => f.id === fileId);
  if (!file) return "삭제된 항목";
  return file.title.trim() || "이름 없음";
}

export function ChapterEditor({
  project,
  chapter,
  onSaved,
  onSaveStateChange,
}: ChapterEditorProps) {
  const [activeTab, setActiveTab] = useState<ChapterEditorTab>("briefing");
  const [title, setTitle] = useState(chapter.title);
  const [additionalInstruction, setAdditionalInstruction] = useState(
    chapter.instruction ?? ""
  );
  const [outline, setOutline] = useState(chapter.outline);
  const [content, setContent] = useState(chapter.content);
  const [chips, setChips] = useState<ContextChip[]>([]);
  const [clues, setClues] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const { requestAiProceed, readinessWarningModal } = useReadinessWarning();

  const briefing = useMemo(
    () => buildChapterBriefing(project, chapter.number),
    [project, chapter.number]
  );

  const briefingSummary = useMemo(
    () => buildBriefingSummary(briefing),
    [briefing]
  );

  const targetLength = project.settings.defaultChapterLength;
  const usedTokens = computeUsedTokens(chips);
  const tokenWarning = usedTokens > project.settings.tokenWarningThreshold;

  const worldOptions = useMemo(
    () =>
      getWorldBibleFiles(project.bibleFiles, project.categories).map((f) => ({
        id: f.id,
        label: f.title.trim() || "이름 없음",
      })),
    [project.bibleFiles, project.categories]
  );

  const pinnedWorldIds = useMemo(
    () => briefing.pinnedWorldIds,
    [briefing.pinnedWorldIds]
  );

  const refreshContext = useCallback(() => {
    const nextBriefing = buildChapterBriefing(project, chapter.number);
    setChips(buildDefaultContextChips(project, nextBriefing));
    setClues(extractOpenClues(project));
  }, [project, chapter.number]);

  useEffect(() => {
    setTitle(chapter.title);
    setAdditionalInstruction(chapter.instruction ?? "");
    setOutline(chapter.outline);
    setContent(chapter.content);
    setActiveTab("briefing");
    setError(null);
    refreshContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chapter.id is the switch boundary
  }, [chapter.id]);

  useEffect(() => {
    refreshContext();
  }, [
    refreshContext,
    project.settings.pinnedWorldBibleIds,
    project.arcOutline,
    project.bibleFiles,
  ]);

  const toggleChip = (id: string) => {
    setChips((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.locked) return c;
        return { ...c, selected: !c.selected };
      })
    );
  };

  const handlePinnedWorldChange = async (ids: string[]) => {
    try {
      const updated = await updateSettings({ pinnedWorldBibleIds: ids });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "세계관 고정 저장 실패");
    }
  };

  const composedInstruction = useMemo(() => {
    const parts = [briefingSummary];
    if (additionalInstruction.trim()) {
      parts.push(`【추가 지시】\n${additionalInstruction.trim()}`);
    }
    return parts.join("\n\n");
  }, [additionalInstruction, briefingSummary]);

  const dirty = useMemo(
    () =>
      title !== chapter.title ||
      additionalInstruction !== (chapter.instruction ?? "") ||
      outline !== chapter.outline ||
      content !== chapter.content,
    [chapter, content, additionalInstruction, outline, title]
  );

  const saving = busy === "save";

  const handleSave = useCallback(async () => {
    if (saving) return;
    setBusy("save");
    try {
      const updated = await updateChapter(chapter.id, {
        title,
        instruction: additionalInstruction,
        outline,
        content,
      });
      onSaved(updated);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setBusy(null);
    }
  }, [
    additionalInstruction,
    chapter.id,
    content,
    onSaved,
    outline,
    saving,
    title,
  ]);

  useEffect(() => {
    onSaveStateChange?.({
      dirty,
      saving,
      save: () => void handleSave(),
      label: "화 저장",
    });
    return () => onSaveStateChange?.(null);
  }, [dirty, handleSave, onSaveStateChange, saving]);

  const openWriteModal = () => {
    setWriteModalOpen(true);
  };

  const pathLabel = `${chapter.number}화 · ${title.trim() || "제목 없음"} · ${content.length.toLocaleString()}자 / 목표 ${targetLength.toLocaleString()}자`;

  const optionalChips = chips.filter((c) => !c.locked);

  return (
    <div className="toss-panel-editor">
      <div className="toss-panel-editor-body toss-panel-editor-body-detail">
        <div className="toss-bible-editor-page">
          <header className="toss-bible-editor-head">
            <div>
              <h2 className="toss-bible-editor-title">원고</h2>
              <p className="toss-bible-editor-desc">
                회차 뼈대·바이블을 바탕으로 화별 아웃라인과 본문을 작성해요.
              </p>
            </div>
            <div className="toss-bible-editor-head-actions">
              <button
                type="button"
                onClick={openWriteModal}
                className="toss-concept-edit-btn toss-concept-edit-btn-primary"
              >
                이 화 쓰기
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !dirty}
                className="toss-concept-edit-btn toss-editor-inline-save"
              >
                {saving ? "저장 중…" : "화 저장"}
              </button>
            </div>
          </header>

          <div className="toss-concept-card toss-bible-editor-card">
            <nav
              className="toss-settings-tabs toss-segmented-on-surface toss-bible-editor-card-tabs"
              aria-label="원고 작성 단계"
            >
              {CHAPTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`toss-settings-tab ${
                    activeTab === tab.id ? "toss-settings-tab-active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <p className="toss-bible-editor-path">
              {pathLabel}
              {savedFlash ? (
                <span className="toss-bible-saved-mark"> · 저장됨</span>
              ) : null}
            </p>

            {error ? <p className="toss-bible-form-error">{error}</p> : null}

            {activeTab === "briefing" ? (
              <TossSelectProvider>
                <div className="toss-bible-chapter-form">
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

                  <div className="toss-arc-bible-links-divider" />

                  <div className="toss-bible-form-field toss-bible-form-field-block">
                    <p className="toss-bible-form-label">이번 화 줄거리 (소아크)</p>
                    <p className="toss-bible-form-hint">
                      회차 뼈대에서 가져온 이번 화의 줄거리입니다.
                    </p>
                    <div className="toss-bible-readonly-block whitespace-pre-line">
                      {briefingSummary}
                    </div>
                  </div>

                  {(briefing.linkedCharacterIds.length > 0 ||
                    briefing.linkedEventIds.length > 0) && (
                    <>
                      <div className="toss-arc-bible-links-divider" />
                      <div className="toss-bible-form-field toss-bible-form-field-block">
                        <p className="toss-bible-form-label">아크 연결 바이블</p>
                        <p className="toss-bible-form-hint">
                          회차 뼈대에 연결된 인물·사건 — 집필 시 항상 포함됩니다.
                        </p>
                        <ul className="toss-chapter-linked-list">
                          {briefing.linkedCharacterIds.map((id) => (
                            <li key={id}>인물 · {bibleFileLabel(project, id)}</li>
                          ))}
                          {briefing.linkedEventIds.map((id) => (
                            <li key={id}>사건 · {bibleFileLabel(project, id)}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <div className="toss-arc-bible-links-divider" />

                  <div className="toss-bible-form-field toss-bible-form-field-block">
                    {worldOptions.length > 0 ? (
                      <TossMultiSelect
                        label="고정 세계관"
                        legend="고정 세계관"
                        hint="매 화 집필 시 잊지 않도록 항상 AI 컨텍스트에 넣습니다."
                        options={worldOptions}
                        selected={pinnedWorldIds}
                        onChange={(ids) => void handlePinnedWorldChange(ids)}
                        placeholder="세계관 선택"
                      />
                    ) : (
                      <>
                        <p className="toss-bible-form-label">고정 세계관</p>
                        <p className="toss-bible-form-hint">
                          매 화 집필 시 잊지 않도록 항상 AI 컨텍스트에 넣습니다.
                        </p>
                        <div className="toss-arc-bible-empty-state">
                          <p className="toss-callout-warning">
                            바이블에 세계관 파일이 없어요. 바이블 탭에서 세계관을 먼저
                            추가하세요.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {optionalChips.length > 0 ? (
                    <>
                      <div className="toss-arc-bible-links-divider" />
                      <div className="toss-bible-form-field toss-bible-form-field-block">
                        <p className="toss-bible-form-label">추가 컨텍스트</p>
                        <p className="toss-bible-form-hint">
                          이번 화에만 추가로 넣을 바이블 항목입니다.{" "}
                          {usedTokens.toLocaleString()} /{" "}
                          {project.settings.tokenWarningThreshold.toLocaleString()}{" "}
                          tokens 예상
                          {tokenWarning ? " · 토큰 경고" : ""}
                        </p>
                        <div className="toss-chapter-briefing-chips">
                          {optionalChips.map((chip) => (
                            <button
                              key={chip.id}
                              type="button"
                              onClick={() => toggleChip(chip.id)}
                              className={`toss-chip ${
                                chip.selected ? "toss-chip-selected" : "toss-chip-muted"
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {clues.length > 0 ? (
                    <>
                      <div className="toss-arc-bible-links-divider" />
                      <div className="toss-bible-form-field toss-bible-form-field-block">
                        <p className="toss-bible-form-label">열린 복선</p>
                        <ul className="toss-chapter-clues">
                          {clues.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </div>
              </TossSelectProvider>
            ) : null}

            {activeTab === "design" ? (
              <div className="toss-bible-chapter-form">
                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label className="toss-bible-form-label" htmlFor={`ch-title-${chapter.id}`}>
                    화 제목
                  </label>
                  <input
                    id={`ch-title-${chapter.id}`}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="toss-bible-form-input"
                    placeholder="예: 각성의 전날"
                  />
                </div>

                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`ch-extra-${chapter.id}`}
                  >
                    추가 지시
                  </label>
                  <p className="toss-bible-form-hint">
                    소아크 브리핑 외에 이번 화만 특별히 강조할 내용 (선택)
                  </p>
                  <textarea
                    id={`ch-extra-${chapter.id}`}
                    value={additionalInstruction}
                    onChange={(e) => setAdditionalInstruction(e.target.value)}
                    rows={2}
                    className="toss-bible-form-textarea"
                    placeholder="예: 이번 화는 긴장감 위주, 대사는 짧게"
                  />
                </div>

                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`ch-outline-${chapter.id}`}
                  >
                    장면 뼈대 (아웃라인)
                  </label>
                  <p className="toss-bible-form-hint">
                    소아크를 이번 화 분량으로 쪼갠 장면 목록
                  </p>
                  <textarea
                    id={`ch-outline-${chapter.id}`}
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                    rows={8}
                    className="toss-bible-form-textarea"
                    placeholder={"장면1: …\n장면2: …"}
                  />
                </div>
              </div>
            ) : null}

            {activeTab === "body" ? (
              <div className="toss-bible-chapter-form">
                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`ch-content-${chapter.id}`}
                  >
                    본문
                  </label>
                  <p className="toss-bible-form-hint">
                    직접 작성하거나 상단 「이 화 쓰기」로 AI 초안을 생성하세요.
                  </p>
                  <textarea
                    id={`ch-content-${chapter.id}`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="toss-bible-form-textarea toss-chapter-body-textarea"
                    placeholder="본문을 입력하세요."
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ChapterWriteModal
        open={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        onComplete={() => setActiveTab("body")}
        onRequestAiProceed={requestAiProceed}
        project={project}
        chapterId={chapter.id}
        chapterNumber={chapter.number}
        briefing={briefing}
        briefingSummary={briefingSummary}
        composedInstruction={composedInstruction}
        chips={chips}
        clues={clues}
        worldOptions={worldOptions}
        pinnedWorldIds={pinnedWorldIds}
        onPinnedWorldChange={(ids) => void handlePinnedWorldChange(ids)}
        onToggleChip={toggleChip}
        title={title}
        onTitleChange={setTitle}
        additionalInstruction={additionalInstruction}
        onAdditionalInstructionChange={setAdditionalInstruction}
        outline={outline}
        onOutlineChange={setOutline}
        content={content}
        onContentChange={setContent}
      />

      {readinessWarningModal}
    </div>
  );
}
