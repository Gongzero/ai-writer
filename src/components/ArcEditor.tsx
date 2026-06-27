"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArcBibleLinksEditor } from "@/components/ArcBibleLinksEditor";
import { updateArc } from "@/lib/db";
import { bibleLinkIdsEqual, ensureIdList, pruneBibleLinkIds } from "@/lib/arc-bible-links";
import {
  formatArcChapterRange,
  macroArcStageLabel,
  parseOptionalChapter,
} from "@/lib/arc-stages";
import type { ArcBlock, BibleCategory, BibleFile, ProjectData } from "@/lib/types";
import type { PanelSaveState } from "@/lib/panel-save-state";

interface ArcEditorProps {
  arc: ArcBlock;
  categories: BibleCategory[];
  bibleFiles: BibleFile[];
  onSaved: (project: ProjectData) => void;
  onSaveStateChange?: (state: PanelSaveState | null) => void;
}

function chapterFieldValue(value?: number) {
  return value != null ? String(value) : "";
}

export function ArcEditor({
  arc,
  categories,
  bibleFiles,
  onSaved,
  onSaveStateChange,
}: ArcEditorProps) {
  const [title, setTitle] = useState(arc.title);
  const [summary, setSummary] = useState(arc.summary);
  const [fromChapter, setFromChapter] = useState(chapterFieldValue(arc.fromChapter));
  const [toChapter, setToChapter] = useState(chapterFieldValue(arc.toChapter));
  const [characterIds, setCharacterIds] = useState(() => ensureIdList(arc.characterIds));
  const [eventIds, setEventIds] = useState(() => ensureIdList(arc.eventIds));
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(arc.title);
    setSummary(arc.summary);
    setFromChapter(chapterFieldValue(arc.fromChapter));
    setToChapter(chapterFieldValue(arc.toChapter));
    setCharacterIds(ensureIdList(arc.characterIds));
    setEventIds(ensureIdList(arc.eventIds));
    setError(null);
  }, [
    arc.id,
    arc.title,
    arc.summary,
    arc.fromChapter,
    arc.toChapter,
    arc.characterIds,
    arc.eventIds,
  ]);

  const dirty = useMemo(() => {
    const from = parseOptionalChapter(fromChapter);
    const to = parseOptionalChapter(toChapter);
    return (
      title !== arc.title ||
      summary !== arc.summary ||
      from !== arc.fromChapter ||
      to !== arc.toChapter ||
      !bibleLinkIdsEqual(characterIds, arc.characterIds) ||
      !bibleLinkIdsEqual(eventIds, arc.eventIds)
    );
  }, [arc, characterIds, eventIds, fromChapter, summary, title, toChapter]);

  const handleSave = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const validIds = new Set(bibleFiles.map((f) => f.id));
      const nextCharacterIds = pruneBibleLinkIds(characterIds, validIds);
      const nextEventIds = pruneBibleLinkIds(eventIds, validIds);
      const updated = await updateArc(arc.id, {
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
    arc.id,
    bibleFiles,
    characterIds,
    dirty,
    eventIds,
    fromChapter,
    onSaved,
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

  const previewArc: ArcBlock = {
    ...arc,
    fromChapter: parseOptionalChapter(fromChapter),
    toChapter: parseOptionalChapter(toChapter),
  };

  const chapterFrom = previewArc.fromChapter;
  const chapterTo = previewArc.toChapter;

  const pathLabel = `${macroArcStageLabel(arc.stage)} · ${formatArcChapterRange(previewArc)}`;

  return (
    <div className="toss-panel-editor">
      <div className="toss-panel-editor-body toss-panel-editor-body-detail">
        <div className="toss-bible-editor-page">
          <header className="toss-bible-editor-head">
            <div>
              <h2 className="toss-bible-editor-title">회차 뼈대</h2>
              <p className="toss-bible-editor-desc">
                작품의 큰 흐름 단계를 관리해요.
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
                <label className="toss-bible-form-label" htmlFor={`arc-title-${arc.id}`}>
                  이름
                </label>
                <input
                  id={`arc-title-${arc.id}`}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="toss-bible-form-input"
                  placeholder="예: 입문기"
                />
              </div>

              <div className="toss-bible-form-row">
                <div className="toss-bible-form-field">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`arc-from-${arc.id}`}
                  >
                    시작 회차
                  </label>
                  <input
                    id={`arc-from-${arc.id}`}
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
                  <label className="toss-bible-form-label" htmlFor={`arc-to-${arc.id}`}>
                    종료 회차
                  </label>
                  <input
                    id={`arc-to-${arc.id}`}
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
                회차는 나중에 입력해도 돼요. 시작·종료를 모두 입력하면 겹치지 않게
                검사합니다.
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
                  htmlFor={`arc-summary-${arc.id}`}
                >
                  줄거리 요약
                </label>
                <textarea
                  id={`arc-summary-${arc.id}`}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="toss-bible-form-textarea"
                  placeholder="이 아크에서 일어날 큰 흐름을 적으세요."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
