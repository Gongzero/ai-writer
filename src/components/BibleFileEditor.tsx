"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { updateBibleFile } from "@/lib/db";
import { filePathLabel } from "@/lib/bible";
import {
  composeCharacterContentForSave,
  getCharacterBibleFiles,
  isCharacterCategory,
  parseCharacterContent,
} from "@/lib/bible-character";
import {
  composeEventContentForSave,
  isEventCategory,
  parseEventContent,
} from "@/lib/bible-event";
import {
  composeWorldContentForSave,
  isWorldCategory,
  parseWorldContent,
} from "@/lib/bible-world";
import { TossMultiSelect } from "@/components/ui/TossMultiSelect";
import { TossSelectProvider } from "@/components/ui/toss-select-context";
import type { BibleCategory, BibleFile, BibleSubfolder, ProjectData } from "@/lib/types";
import type { PanelSaveState } from "@/lib/panel-save-state";

interface BibleFileEditorProps {
  file: BibleFile;
  categories: BibleCategory[];
  subfolders: BibleSubfolder[];
  bibleFiles: BibleFile[];
  onSaved: (project: ProjectData) => void;
  onSaveStateChange?: (state: PanelSaveState | null) => void;
}

export function BibleFileEditor({
  file,
  categories,
  subfolders,
  bibleFiles,
  onSaved,
  onSaveStateChange,
}: BibleFileEditorProps) {
  const isCharacter = isCharacterCategory(file, categories);
  const isWorld = isWorldCategory(file, categories);
  const isEvent = isEventCategory(file, categories);
  const initialCharacter = parseCharacterContent(file.content);
  const initialWorld = parseWorldContent(file);
  const initialEvent = parseEventContent(file);

  const [name, setName] = useState(file.title);
  const [gender, setGender] = useState(initialCharacter.gender);
  const [debutChapter, setDebutChapter] = useState(initialCharacter.debutChapter);
  const [exitChapter, setExitChapter] = useState(initialCharacter.exitChapter);
  const [settings, setSettings] = useState(
    isCharacter ? initialCharacter.settings : file.content
  );
  const [topic, setTopic] = useState(isWorld ? initialWorld.topic : file.title);
  const [worldName, setWorldName] = useState(isWorld ? initialWorld.name : file.title);
  const [description, setDescription] = useState(
    isWorld ? initialWorld.description : file.content
  );
  const [eventName, setEventName] = useState(initialEvent.name);
  const [eventBackground, setEventBackground] = useState(initialEvent.background);
  const [eventStartChapter, setEventStartChapter] = useState(initialEvent.startChapter);
  const [eventEndChapter, setEventEndChapter] = useState(initialEvent.endChapter);
  const [eventCharacterIds, setEventCharacterIds] = useState(initialEvent.characterIds);
  const [eventSettings, setEventSettings] = useState(initialEvent.settings);
  const [title, setTitle] = useState(file.title);
  const [content, setContent] = useState(file.content);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const character = parseCharacterContent(file.content);
    const world = parseWorldContent(file);
    const event = parseEventContent(file);
    const characterFile = isCharacterCategory(file, categories);
    const worldFile = isWorldCategory(file, categories);
    const eventFile = isEventCategory(file, categories);

    setName(file.title);
    setTitle(file.title);
    setContent(file.content);
    setGender(character.gender);
    setDebutChapter(character.debutChapter);
    setExitChapter(character.exitChapter);
    setSettings(characterFile ? character.settings : file.content);

    if (worldFile) {
      setTopic(world.topic);
      setWorldName(world.name);
      setDescription(world.description);
    } else {
      setTopic(file.title);
      setWorldName(file.title);
      setDescription(file.content);
    }

    if (eventFile) {
      setEventName(event.name);
      setEventBackground(event.background);
      setEventStartChapter(event.startChapter);
      setEventEndChapter(event.endChapter);
      setEventCharacterIds(event.characterIds);
      setEventSettings(event.settings);
    }
  }, [file.id, file.title, file.content, file.categoryId, categories]);

  const pathLabel = useMemo(
    () => filePathLabel(file, categories, subfolders),
    [file, categories, subfolders]
  );

  const characterOptions = useMemo(
    () =>
      getCharacterBibleFiles(bibleFiles, categories).map((characterFile) => ({
        id: characterFile.id,
        label: characterFile.title.trim() || "이름 없음",
      })),
    [bibleFiles, categories]
  );

  const serializedCharacter = useMemo(
    () =>
      composeCharacterContentForSave(name, {
        gender,
        debutChapter,
        exitChapter,
        settings,
      }),
    [name, gender, debutChapter, exitChapter, settings]
  );

  const serializedWorld = useMemo(
    () => composeWorldContentForSave(worldName, topic, description),
    [worldName, topic, description]
  );

  const serializedEvent = useMemo(
    () =>
      composeEventContentForSave(eventName, {
        background: eventBackground,
        startChapter: eventStartChapter,
        endChapter: eventEndChapter,
        characterIds: eventCharacterIds,
        settings: eventSettings,
      }),
    [
      eventName,
      eventBackground,
      eventStartChapter,
      eventEndChapter,
      eventCharacterIds,
      eventSettings,
    ]
  );

  const dirty = isCharacter
    ? serializedCharacter.title !== file.title ||
      serializedCharacter.content !== file.content
    : isWorld
      ? serializedWorld.title !== file.title ||
        serializedWorld.content !== file.content
      : isEvent
        ? serializedEvent.title !== file.title ||
          serializedEvent.content !== file.content
        : title !== file.title || content !== file.content;

  const handleSave = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const payload = isCharacter
        ? serializedCharacter
        : isWorld
          ? serializedWorld
          : isEvent
            ? serializedEvent
            : { title, content };
      const updated = await updateBibleFile(file.id, payload);
      onSaved(updated);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }, [
    content,
    dirty,
    file.id,
    isCharacter,
    isEvent,
    isWorld,
    onSaved,
    saving,
    serializedCharacter,
    serializedEvent,
    serializedWorld,
    title,
  ]);

  useEffect(() => {
    onSaveStateChange?.({
      dirty,
      saving,
      save: () => void handleSave(),
    });
    return () => onSaveStateChange?.(null);
  }, [dirty, handleSave, onSaveStateChange, saving]);

  const pageTitle = isCharacter
    ? "인물 설정"
    : isWorld
      ? "세계관 설정"
      : isEvent
        ? "사건 설정"
        : "바이블 설정";
  const pageDesc = isCharacter
    ? "등장인물의 기본 정보를 관리해요."
    : isWorld
      ? "작품 세계관의 주제와 설명을 관리해요."
      : isEvent
        ? "작품 사건의 흐름과 등장 인물을 관리해요."
        : "바이블 정보를 관리해요.";

  return (
    <div className="toss-panel-editor">
      <div className="toss-panel-editor-body toss-panel-editor-body-detail">
        <div className="toss-bible-editor-page">
          <header className="toss-bible-editor-head">
            <div>
              <h2 className="toss-bible-editor-title">{pageTitle}</h2>
              <p className="toss-bible-editor-desc">{pageDesc}</p>
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

            {isCharacter ? (
              <div className="toss-bible-character-form">
                <div className="toss-bible-form-row">
                  <div className="toss-bible-form-field">
                    <label
                      className="toss-bible-form-label"
                      htmlFor={`bible-name-${file.id}`}
                    >
                      이름
                    </label>
                    <input
                      id={`bible-name-${file.id}`}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="toss-bible-form-input"
                      placeholder="예: 서연"
                    />
                  </div>
                  <div className="toss-bible-form-field">
                    <label
                      className="toss-bible-form-label"
                      htmlFor={`bible-gender-${file.id}`}
                    >
                      성별
                    </label>
                    <input
                      id={`bible-gender-${file.id}`}
                      type="text"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="toss-bible-form-input"
                      placeholder="예: 여"
                    />
                  </div>
                </div>

                <div className="toss-bible-form-row">
                  <div className="toss-bible-form-field">
                    <label
                      className="toss-bible-form-label"
                      htmlFor={`bible-debut-${file.id}`}
                    >
                      등장 회차
                    </label>
                    <input
                      id={`bible-debut-${file.id}`}
                      type="text"
                      inputMode="numeric"
                      value={debutChapter}
                      onChange={(e) => setDebutChapter(e.target.value)}
                      className="toss-bible-form-input"
                      placeholder="예: 1"
                    />
                  </div>
                  <div className="toss-bible-form-field">
                    <label
                      className="toss-bible-form-label"
                      htmlFor={`bible-exit-${file.id}`}
                    >
                      퇴장 회차
                    </label>
                    <input
                      id={`bible-exit-${file.id}`}
                      type="text"
                      inputMode="numeric"
                      value={exitChapter}
                      onChange={(e) => setExitChapter(e.target.value)}
                      className="toss-bible-form-input"
                      placeholder="예: 50"
                    />
                  </div>
                </div>

                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`bible-settings-${file.id}`}
                  >
                    설정
                  </label>
                  <textarea
                    id={`bible-settings-${file.id}`}
                    value={settings}
                    onChange={(e) => setSettings(e.target.value)}
                    className="toss-bible-form-textarea"
                  />
                </div>
              </div>
            ) : isWorld ? (
              <div className="toss-bible-world-form">
                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`bible-topic-${file.id}`}
                  >
                    주제
                  </label>
                  <input
                    id={`bible-topic-${file.id}`}
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="toss-bible-form-input"
                    placeholder="예: 마법 체계"
                  />
                </div>

                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`bible-world-name-${file.id}`}
                  >
                    이름
                  </label>
                  <input
                    id={`bible-world-name-${file.id}`}
                    type="text"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    className="toss-bible-form-input"
                    placeholder="예: 아르카디아"
                  />
                </div>

                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`bible-description-${file.id}`}
                  >
                    설명
                  </label>
                  <textarea
                    id={`bible-description-${file.id}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="toss-bible-form-textarea"
                  />
                </div>
              </div>
            ) : isEvent ? (
              <TossSelectProvider>
                <div className="toss-bible-event-form">
                  <div className="toss-bible-form-field toss-bible-form-field-block">
                    <label
                      className="toss-bible-form-label"
                      htmlFor={`bible-event-name-${file.id}`}
                    >
                      이름
                    </label>
                    <input
                      id={`bible-event-name-${file.id}`}
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="toss-bible-form-input"
                      placeholder="예: 학교 축제 사건"
                    />
                  </div>

                  <div className="toss-bible-form-field toss-bible-form-field-block">
                    <label
                      className="toss-bible-form-label"
                      htmlFor={`bible-event-background-${file.id}`}
                    >
                      배경
                    </label>
                    <input
                      id={`bible-event-background-${file.id}`}
                      type="text"
                      value={eventBackground}
                      onChange={(e) => setEventBackground(e.target.value)}
                      className="toss-bible-form-input"
                      placeholder="예: 2학기 학교 축제 주간"
                    />
                  </div>

                  <div className="toss-bible-form-row">
                    <div className="toss-bible-form-field">
                      <label
                        className="toss-bible-form-label"
                        htmlFor={`bible-event-start-${file.id}`}
                      >
                        시작 회차
                      </label>
                      <input
                        id={`bible-event-start-${file.id}`}
                        type="text"
                        inputMode="numeric"
                        value={eventStartChapter}
                        onChange={(e) => setEventStartChapter(e.target.value)}
                        className="toss-bible-form-input"
                        placeholder="예: 5"
                      />
                    </div>
                    <div className="toss-bible-form-field">
                      <label
                        className="toss-bible-form-label"
                        htmlFor={`bible-event-end-${file.id}`}
                      >
                        종료 회차
                      </label>
                      <input
                        id={`bible-event-end-${file.id}`}
                        type="text"
                        inputMode="numeric"
                        value={eventEndChapter}
                        onChange={(e) => setEventEndChapter(e.target.value)}
                        className="toss-bible-form-input"
                        placeholder="예: 8"
                      />
                    </div>
                  </div>

                  <div className="toss-bible-form-field toss-bible-form-field-block">
                    {characterOptions.length > 0 ? (
                      <TossMultiSelect
                        label="등장 인물"
                        legend="등장 인물"
                        placeholder="인물을 선택하세요"
                        options={characterOptions}
                        selected={eventCharacterIds}
                        onChange={setEventCharacterIds}
                      />
                    ) : (
                      <>
                        <span className="toss-bible-form-label">등장 인물</span>
                        <p className="toss-bible-form-empty-hint">
                          인물 카테고리에 파일을 먼저 추가해 주세요.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="toss-bible-form-field toss-bible-form-field-block">
                    <label
                      className="toss-bible-form-label"
                      htmlFor={`bible-event-settings-${file.id}`}
                    >
                      설정
                    </label>
                    <textarea
                      id={`bible-event-settings-${file.id}`}
                      value={eventSettings}
                      onChange={(e) => setEventSettings(e.target.value)}
                      className="toss-bible-form-textarea"
                    />
                  </div>
                </div>
              </TossSelectProvider>
            ) : (
              <div className="toss-bible-generic-form">
                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`bible-title-${file.id}`}
                  >
                    제목
                  </label>
                  <input
                    id={`bible-title-${file.id}`}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="toss-bible-form-input"
                  />
                </div>
                <div className="toss-bible-form-field toss-bible-form-field-block">
                  <label
                    className="toss-bible-form-label"
                    htmlFor={`bible-content-${file.id}`}
                  >
                    내용
                  </label>
                  <textarea
                    id={`bible-content-${file.id}`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="toss-bible-form-textarea"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
