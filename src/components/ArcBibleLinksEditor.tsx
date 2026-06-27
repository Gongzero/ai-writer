"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalShell } from "@/components/home/ModalShell";
import { TossMultiSelect } from "@/components/ui/TossMultiSelect";
import { TossSelectProvider } from "@/components/ui/toss-select-context";
import { ensureIdList } from "@/lib/arc-bible-links";
import { findCharactersCategoryId, getCharacterBibleFiles } from "@/lib/bible-character";
import {
  findEventsCategoryId,
  getEventBibleFiles,
  serializeEventContent,
} from "@/lib/bible-event";
import { addBibleFile, updateBibleFile } from "@/lib/db";
import type { BibleCategory, BibleFile, ProjectData } from "@/lib/types";

type CreateKind = "character" | "event";

interface ArcBibleLinkFieldProps {
  label: string;
  hint: string;
  emptyMessage: string;
  createLabel: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onCreate: () => void;
  placeholder: string;
  selectAriaLabel: string;
}

function ArcBibleLinkField({
  label,
  hint,
  emptyMessage,
  createLabel,
  options,
  selected,
  onChange,
  onCreate,
  placeholder,
  selectAriaLabel,
}: ArcBibleLinkFieldProps) {
  if (options.length === 0) {
    return (
      <div className="toss-bible-form-field toss-bible-form-field-block">
        <p className="toss-bible-form-label">{label}</p>
        <div className="toss-arc-bible-empty-state">
          <p className="toss-callout-warning">{emptyMessage}</p>
          <button type="button" className="toss-arc-bible-create-btn" onClick={onCreate}>
            {createLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="toss-bible-form-field toss-bible-form-field-block">
      <TossMultiSelect
        label={selectAriaLabel}
        legend={label}
        hint={hint}
        options={options}
        selected={selected}
        onChange={onChange}
        placeholder={placeholder}
        footerExtra={
          <button type="button" className="toss-arc-bible-create-btn" onClick={onCreate}>
            {createLabel}
          </button>
        }
      />
    </div>
  );
}

interface ArcBibleLinksEditorProps {
  characterIds: string[];
  eventIds: string[];
  onCharacterIdsChange: (ids: string[]) => void;
  onEventIdsChange: (ids: string[]) => void;
  bibleFiles: BibleFile[];
  categories: BibleCategory[];
  chapterFrom?: number;
  chapterTo?: number;
  onProjectUpdated: (project: ProjectData) => void;
}

export function ArcBibleLinksEditor({
  characterIds,
  eventIds,
  onCharacterIdsChange,
  onEventIdsChange,
  bibleFiles,
  categories,
  chapterFrom,
  chapterTo,
  onProjectUpdated,
}: ArcBibleLinksEditorProps) {
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!createKind) {
      setCreateName("");
      setCreateError(null);
    }
  }, [createKind]);

  const characterOptions = useMemo(
    () =>
      getCharacterBibleFiles(bibleFiles, categories).map((file) => ({
        id: file.id,
        label: file.title.trim() || "이름 없음",
      })),
    [bibleFiles, categories]
  );

  const eventOptions = useMemo(
    () =>
      getEventBibleFiles(bibleFiles, categories).map((file) => ({
        id: file.id,
        label: file.title.trim() || "이름 없음",
      })),
    [bibleFiles, categories]
  );

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name || !createKind || creating) return;

    const categoryId =
      createKind === "character"
        ? findCharactersCategoryId(categories)
        : findEventsCategoryId(categories);

    if (!categoryId) {
      setCreateError(
        createKind === "character"
          ? "인물 카테고리를 찾을 수 없어요."
          : "사건 카테고리를 찾을 수 없어요."
      );
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const { project, file } = await addBibleFile(categoryId, null, name);
      let nextProject = project;

      if (createKind === "event") {
        const content = serializeEventContent({
          background: "",
          startChapter: chapterFrom != null ? String(chapterFrom) : "",
          endChapter: chapterTo != null ? String(chapterTo) : "",
          characterIds: ensureIdList(characterIds),
          settings: "",
        });
        nextProject = await updateBibleFile(file.id, { title: name, content });
      }

      onProjectUpdated(nextProject);

      if (createKind === "character") {
        onCharacterIdsChange([...ensureIdList(characterIds), file.id]);
      } else {
        onEventIdsChange([...ensureIdList(eventIds), file.id]);
      }

      setCreateKind(null);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "바이블에 추가하지 못했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const createModalCopy =
    createKind === "character"
      ? {
          title: "새 인물 만들기",
          description: "바이블 인물에 추가되고, 이 아크에도 연결돼요.",
          placeholder: "인물 이름",
        }
      : createKind === "event"
        ? {
            title: "새 사건 만들기",
            description:
              "바이블 사건에 추가되고, 이 아크에도 연결돼요. 아크에 연결된 인물은 사건 등장 인물에 넣어요.",
            placeholder: "사건 이름",
          }
        : null;

  return (
    <>
      <TossSelectProvider>
        <div className="toss-arc-bible-links">
          <ArcBibleLinkField
            label="등장 인물"
            hint="이 아크에 등장하는 인물을 골라요."
            emptyMessage="바이블에 인물이 없어요. 새로 만들거나 바이블 탭에서 추가하세요."
            createLabel="새 인물 만들기"
            options={characterOptions}
            selected={ensureIdList(characterIds)}
            onChange={onCharacterIdsChange}
            onCreate={() => setCreateKind("character")}
            placeholder="인물 선택"
            selectAriaLabel="등장 인물"
          />

          <ArcBibleLinkField
            label="사건"
            hint="이 아크에서 다루는 사건을 골라요."
            emptyMessage="바이블에 사건이 없어요. 새로 만들거나 바이블 탭에서 추가하세요."
            createLabel="새 사건 만들기"
            options={eventOptions}
            selected={ensureIdList(eventIds)}
            onChange={onEventIdsChange}
            onCreate={() => setCreateKind("event")}
            placeholder="사건 선택"
            selectAriaLabel="사건"
          />
        </div>
      </TossSelectProvider>

      {createModalCopy ? (
        <ModalShell
          open
          onClose={() => {
            if (!creating) setCreateKind(null);
          }}
          variant="action"
          title={createModalCopy.title}
          description={createModalCopy.description}
          footer={
            <button
              type="button"
              disabled={!createName.trim() || creating}
              onClick={() => void handleCreate()}
              className="toss-btn-primary w-full py-4 text-[16px]"
            >
              {creating ? "추가 중…" : "바이블에 추가"}
            </button>
          }
        >
          <input
            autoFocus
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
              if (e.key === "Escape" && !creating) setCreateKind(null);
            }}
            placeholder={createModalCopy.placeholder}
            className="toss-input"
          />

          {createError ? (
            <p className="toss-bible-form-error mt-2">{createError}</p>
          ) : null}
        </ModalShell>
      ) : null}
    </>
  );
}
