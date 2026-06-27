"use client";

import { useMemo } from "react";
import { BibleNavIcon } from "@/components/ui/BibleNavIcon";
import { BibleRowDeleteButton } from "@/components/ui/BibleRowDeleteButton";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import type { Chapter } from "@/lib/types";

interface ChapterListProps {
  chapters: Chapter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  adding?: boolean;
}

function ChapterRow({
  chapter,
  selected,
  onSelect,
  onDelete,
  onRequestDelete,
}: {
  chapter: Chapter;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRequestDelete: (onConfirm: () => void) => void;
}) {
  const label = chapter.title.trim() || "제목 없음";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(onDelete);
  };

  return (
    <div className="toss-bible-nav-row-wrap">
      <button
        type="button"
        onClick={onSelect}
        className={`toss-bible-nav-row ${
          selected ? "toss-bible-nav-row-active" : ""
        }`}
      >
        <BibleNavIcon kind="file" />
        <span className="toss-arc-nav-text">
          <span className="toss-bible-nav-label truncate">
            {chapter.number}화 · {label}
          </span>
          <span className="toss-arc-nav-meta">
            {chapter.content.length.toLocaleString()}자
          </span>
        </span>
      </button>

      <BibleRowDeleteButton label={`${chapter.number}화`} onClick={handleDelete} />
    </div>
  );
}

export function ChapterList({
  chapters,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  adding = false,
}: ChapterListProps) {
  const { requestDelete, deleteConfirmModal } = useDeleteConfirm();
  const sorted = useMemo(
    () => [...chapters].sort((a, b) => a.number - b.number),
    [chapters]
  );

  return (
    <>
      <div className="toss-bible-tree toss-chapter-tree">
        {sorted.length > 0 ? (
          <div className="toss-bible-group-items">
            {sorted.map((ch) => (
              <ChapterRow
                key={ch.id}
                chapter={ch}
                selected={selectedId === ch.id}
                onSelect={() => onSelect(ch.id)}
                onDelete={() => onDelete(ch.id)}
                onRequestDelete={requestDelete}
              />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onAdd}
          disabled={adding}
          className="toss-bible-nav-row toss-bible-nav-row-action toss-bible-add-category disabled:opacity-40"
        >
          <BibleNavIcon kind="add" />
          <span className="toss-bible-nav-label">{adding ? "추가 중…" : "화 추가"}</span>
        </button>
      </div>

      {deleteConfirmModal}
    </>
  );
}
