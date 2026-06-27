"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArcBibleLinksEditor } from "@/components/ArcBibleLinksEditor";
import { updateMicroArc } from "@/lib/db";
import { bibleLinkIdsEqual, ensureIdList, pruneBibleLinkIds } from "@/lib/arc-bible-links";
import { macroArcStageLabel, parseOptionalChapter } from "@/lib/arc-stages";
import {
  formatMicroArcChapterRange,
  microArcStageLabel,
} from "@/lib/micro-arc-stages";
import type { ArcBlock, BibleCategory, BibleFile, MicroArcBlock, ProjectData } from "@/lib/types";
import type { PanelSaveState } from "@/lib/panel-save-state";

interface MicroArcEditorProps {
  parentArc: ArcBlock;
  microArc: MicroArcBlock;
  categories: BibleCategory[];
  bibleFiles: BibleFile[];
  onSaved: (project: ProjectData) => void;
  onSaveStateChange?: (state: PanelSaveState | null) => void;
}

function chapterFieldValue(value?: number) {
  return value != null ? String(value) : "";
}

export function MicroArcEditor({
  parentArc,
  microArc,
  categories,
  bibleFiles,
  onSaved,
  onSaveStateChange,
}: MicroArcEditorProps) {
  const [title, setTitle] = useState(microArc.title);
  const [summary, setSummary] = useState(microArc.summary);
  const [fromChapter, setFromChapter] = useState(chapterFieldValue(microArc.fromChapter));
  const [toChapter, setToChapter] = useState(chapterFieldValue(microArc.toChapter));
  const [characterIds, setCharacterIds] = useState(() => ensureIdList(microArc.characterIds));
  const [eventIds, setEventIds] = useState(() => ensureIdList(microArc.eventIds));
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(microArc.title);
    setSummary(microArc.summary);
    setFromChapter(chapterFieldValue(microArc.fromChapter));
    setToChapter(chapterFieldValue(microArc.toChapter));
    setCharacterIds(ensureIdList(microArc.characterIds));
    setEventIds(ensureIdList(microArc.eventIds));
    setError(null);
  }, [
    microArc.id,
    microArc.title,
    microArc.summary,
    microArc.fromChapter,
    microArc.toChapter,
    microArc.characterIds,
    microArc.eventIds,
  ]);

  const dirty = useMemo(() => {
    const from = parseOptionalChapter(fromChapter);
    const to = parseOptionalChapter(toChapter);
    return (
      title !== microArc.title ||
      summary !== microArc.summary ||
      from !== microArc.fromChapter ||
      to !== microArc.toChapter ||
      !bibleLinkIdsEqual(characterIds, microArc.characterIds) ||
      !bibleLinkIdsEqual(eventIds, microArc.eventIds)
    );
  }, [characterIds, eventIds, fromChapter, microArc, summary, title, toChapter]);

  const handleSave = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const validIds = new Set(bibleFiles.map((f) => f.id));
      const nextCharacterIds = pruneBibleLinkIds(characterIds, validIds);
      const nextEventIds = pruneBibleLinkIds(eventIds, validIds);
      const updated = await updateMicroArc(parentArc.id, microArc.id, {
        title,
        summary,
        fromChapter: parseOptionalChapter(fromChapter),
        toChapter: parseOptionalChapter(toChapter),
        characterIds: nextCharacterIds,
        eventIds: nextEventIds,
      });
      onSaved(updated);
      setCharacterIds(nextCharacterIds);
      setEventIds(nextEventIds);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }, [
    bibleFiles,
    characterIds,
    dirty,
    eventIds,
    fromChapter,
    microArc.id,
    onSaved,
    parentArc.id,
    saving,
    summary,
    title,
    toChapter,
  ]);

  useEffect(() => {
    onSaveStateChange?.({
      dirty,
      saving,
      save: () => void handleSave(),
    });
    return () => onSaveStateChange?.(null);
  }, [dirty, handleSave, onSaveStateChange, saving]);

  const previewMicro: MicroArcBlock = {
    ...microArc,
    fromChapter: parseOptionalChapter(fromChapter),
    toChapter: parseOptionalChapter(toChapter),
  };

  const chapterFrom = previewMicro.fromChapter;
  const chapterTo = previewMicro.toChapter;

  const pathLabel = `${macroArcStageLabel(parentArc.stage)} · ${parentArc.title} · ${microArcStageLabel(microArc.stage)} · ${formatMicroArcChapterRange(previewMicro)}`;

  return (
    <div className="toss-panel-editor">
      <div className="toss-panel-editor-body toss-panel-editor-body-detail">
        <div className="toss-bible-editor-page">
          <header className="toss-bible-editor-head">
            <div>
              <h2 className="toss-bible-editor-title">회차 뼈대</h2>
              <p className="toss-bible-editor-desc">
                거시 아크 안의 소단계 흐름을 관리해요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || saving}
              className="toss-concept-edit-btn toss-concept-edit-btn-primary toss-editor-inline-save"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </header>

          <div className="toss-concept-card toss-bible-editor-card">
            <p className="toss-bible-editor-path">
              {pathLabel}
              {savedFlash ? (
                <span className="toss-bible-saved-mark"> · 저장됨</span>
              ) : null}
            </p>

            <div className="toss-bible-arc-form">
              <div className="toss-bible-form-field toss-bible-form-field-block">
                <label
                  className="toss-bible-form-label"
                  htmlFor={`micro-arc-title-${microArc.id}`}
                >
                  이름
                </label>
                <input
                  id={`micro-arc-title-${microArc.id}`}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="toss-bible-form-input"
                  placeholder={`예: ${microArcStageLabel(microArc.stage)} 구간`}
                />
              </div>

              <div className="toss-bible-form-row">
                <div className="toss-bible-form-field">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`micro-arc-from-${microArc.id}`}
                  >
                    시작 회차
                  </label>
                  <input
                    id={`micro-arc-from-${microArc.id}`}
                    type="text"
                    inputMode="numeric"
                    value={fromChapter}
                    onChange={(e) => {
                      setFromChapter(e.target.value);
                      setError(null);
                    }}
                    className="toss-bible-form-input"
                    placeholder="선택"
                  />
                </div>
                <div className="toss-bible-form-field">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`micro-arc-to-${microArc.id}`}
                  >
                    종료 회차
                  </label>
                  <input
                    id={`micro-arc-to-${microArc.id}`}
                    type="text"
                    inputMode="numeric"
                    value={toChapter}
                    onChange={(e) => {
                      setToChapter(e.target.value);
                      setError(null);
                    }}
                    className="toss-bible-form-input"
                    placeholder="선택"
                  />
                </div>
              </div>

              <p className="toss-bible-form-hint">
                회차는 나중에 입력해도 돼요. 시작·종료를 모두 입력하면 같은 거시
                아크 안에서 겹치지 않게 검사합니다.
              </p>
              {error ? <p className="toss-bible-form-error">{error}</p> : null}

              <div className="toss-arc-bible-links-divider" />

              <ArcBibleLinksEditor
                characterIds={characterIds}
                eventIds={eventIds}
                onCharacterIdsChange={setCharacterIds}
                onEventIdsChange={setEventIds}
                bibleFiles={bibleFiles}
                categories={categories}
                chapterFrom={chapterFrom}
                chapterTo={chapterTo}
                onProjectUpdated={onSaved}
              />

              <div className="toss-arc-bible-links-divider" />

              <div className="toss-bible-form-field toss-bible-form-field-block">
                <label
                  className="toss-bible-form-label"
                  htmlFor={`micro-arc-summary-${microArc.id}`}
                >
                  줄거리 요약
                </label>
                <textarea
                  id={`micro-arc-summary-${microArc.id}`}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="toss-bible-form-textarea"
                  placeholder="이 소단계에서 일어날 흐름을 적으세요."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
