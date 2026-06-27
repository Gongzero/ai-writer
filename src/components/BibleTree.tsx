"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ModalShell } from "@/components/home/ModalShell";
import { BibleNavIcon } from "@/components/ui/BibleNavIcon";
import { BibleRowDeleteButton } from "@/components/ui/BibleRowDeleteButton";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import type { BibleCategory, BibleFile, BibleSubfolder } from "@/lib/types";

type AddTarget =
  | { type: "file"; categoryId: string; subfolderId: string }
  | { type: "folder"; categoryId: string }
  | { type: "category" };

interface BibleTreeProps {
  categories: BibleCategory[];
  subfolders: BibleSubfolder[];
  bibleFiles: BibleFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddCategory: (title: string) => Promise<void>;
  onAddSubfolder: (categoryId: string, title: string) => Promise<void>;
  onAddFile: (
    categoryId: string,
    subfolderId: string,
    title: string
  ) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onDeleteSubfolder: (subfolderId: string) => Promise<void>;
}

function CollapseChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`toss-bible-chevron shrink-0 ${open ? "toss-bible-chevron-open" : ""}`}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RowDeleteButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return <BibleRowDeleteButton label={label} onClick={onClick} className={className} />;
}

function BibleFileRow({
  file,
  selected,
  onSelect,
  onDelete,
  onRequestDelete,
}: {
  file: BibleFile;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRequestDelete: (onConfirm: () => void) => void;
}) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(() => void onDelete());
  };

  return (
    <div className="toss-bible-nav-row-wrap">
      <button
        type="button"
        onClick={onSelect}
        className={`toss-bible-nav-row ${selected ? "toss-bible-nav-row-active" : ""}`}
      >
        <BibleNavIcon kind="file" />
        <span className="toss-bible-nav-label truncate">{file.title}</span>
      </button>
      <RowDeleteButton label={file.title} onClick={handleDelete} />
    </div>
  );
}

function NamePromptModal({
  open,
  title,
  description,
  placeholder,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  placeholder: string;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  extra?: ReactNode;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      title={title}
      description={description}
      footer={
        <button
          type="button"
          disabled={!value.trim() || busy}
          onClick={handleSubmit}
          className="toss-btn-primary w-full py-4 text-[17px] disabled:opacity-40"
        >
          {busy ? "추가 중…" : "추가"}
        </button>
      }
    >
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onClose();
        }}
        placeholder={placeholder}
        className="toss-input"
      />
    </ModalShell>
  );
}

function countCategoryItems(categoryId: string, bibleFiles: BibleFile[]) {
  return bibleFiles.filter((f) => f.categoryId === categoryId).length;
}

export function BibleTree({
  categories,
  subfolders,
  bibleFiles,
  selectedFileId,
  onSelectFile,
  onAddCategory,
  onAddSubfolder,
  onAddFile,
  onDeleteFile,
  onDeleteSubfolder,
}: BibleTreeProps) {
  const { requestDelete, deleteConfirmModal } = useDeleteConfirm();
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    () => new Set()
  );
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    () => new Set()
  );

  const isCategoryOpen = useCallback(
    (categoryId: string) => !collapsedCategories.has(categoryId),
    [collapsedCategories]
  );

  const isFolderOpen = useCallback(
    (folderId: string) => !collapsedFolders.has(folderId),
    [collapsedFolders]
  );

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  useEffect(() => {
    if (!selectedFileId) return;
    const file = bibleFiles.find((f) => f.id === selectedFileId);
    if (!file) return;

    setCollapsedCategories((prev) => {
      if (!prev.has(file.categoryId)) return prev;
      const next = new Set(prev);
      next.delete(file.categoryId);
      return next;
    });

    if (file.subfolderId) {
      setCollapsedFolders((prev) => {
        if (!prev.has(file.subfolderId!)) return prev;
        const next = new Set(prev);
        next.delete(file.subfolderId!);
        return next;
      });
    }
  }, [selectedFileId, bibleFiles]);

  const resetAdd = () => {
    setAddTarget(null);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      resetAdd();
    } finally {
      setBusy(false);
    }
  };

  const openFileAdd = (categoryId: string, subfolderId: string) => {
    setCollapsedCategories((prev) => {
      if (!prev.has(categoryId)) return prev;
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
    setCollapsedFolders((prev) => {
      if (!prev.has(subfolderId)) return prev;
      const next = new Set(prev);
      next.delete(subfolderId);
      return next;
    });
    setAddTarget({ type: "file", categoryId, subfolderId });
  };

  const activeCategory =
    addTarget?.type === "file" || addTarget?.type === "folder"
      ? categories.find((c) => c.id === addTarget.categoryId)
      : null;
  const activeSubfolder =
    addTarget?.type === "file"
      ? subfolders.find((s) => s.id === addTarget.subfolderId)
      : null;

  const modalTitle =
    addTarget?.type === "file"
      ? "파일 추가"
      : addTarget?.type === "folder"
        ? "폴더 추가"
        : addTarget?.type === "category"
          ? "카테고리 추가"
          : "";

  const modalDescription =
    addTarget?.type === "file" && activeCategory && activeSubfolder
      ? `${activeCategory.title} · ${activeSubfolder.title}`
      : addTarget?.type === "folder" && activeCategory
        ? activeCategory.title
        : addTarget?.type === "category"
          ? "바이블 상단에 새 섹션을 만듭니다"
          : undefined;

  const modalPlaceholder =
    addTarget?.type === "file"
      ? "파일 이름"
      : addTarget?.type === "folder"
        ? "폴더 이름"
        : "카테고리 이름 (예: 능력)";

  return (
    <>
      <div className="toss-bible-tree">
        {categories.length === 0 ? (
          <p className="toss-bible-section-empty">카테고리가 없어요</p>
        ) : (
          <div className="toss-bible-category-list">
            {categories.map((cat) => {
            const catSubs = subfolders.filter((s) => s.categoryId === cat.id);
            const rootFiles = bibleFiles.filter(
              (f) => f.categoryId === cat.id && !f.subfolderId
            );
            const categoryOpen = isCategoryOpen(cat.id);
            const itemCount = countCategoryItems(cat.id, bibleFiles);

            return (
              <section key={cat.id} className="toss-bible-group">
                <div className="toss-bible-category-row">
                  <button
                    type="button"
                    className="toss-bible-category-toggle"
                    aria-expanded={categoryOpen}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className="toss-bible-category-name truncate">{cat.title}</span>
                    {!categoryOpen && itemCount > 0 ? (
                      <span className="toss-bible-collapse-count">{itemCount}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="toss-bible-nav-chevron-btn"
                    aria-expanded={categoryOpen}
                    aria-label={categoryOpen ? `${cat.title} 접기` : `${cat.title} 펼치기`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <CollapseChevron open={categoryOpen} />
                  </button>
                </div>

                <div
                  className={`toss-bible-collapse-panel ${
                    categoryOpen ? "toss-bible-collapse-panel-open" : ""
                  }`}
                >
                  <div className="toss-bible-collapse-panel-inner">
                    <div className="toss-bible-group-items">
                      {catSubs.map((sub) => {
                        const files = bibleFiles.filter(
                          (f) => f.subfolderId === sub.id
                        );
                        const folderOpen = isFolderOpen(sub.id);

                        return (
                          <div key={sub.id} className="toss-bible-folder-block">
                            <div className="toss-bible-folder-row">
                              <button
                                type="button"
                                className="toss-bible-nav-row"
                                onClick={() => toggleFolder(sub.id)}
                              >
                                <BibleNavIcon kind="folder" />
                                <span className="toss-bible-nav-title-group">
                                  <span className="toss-bible-nav-label truncate">
                                    {sub.title}
                                  </span>
                                  {!folderOpen && files.length > 0 ? (
                                    <span className="toss-bible-collapse-count">
                                      {files.length}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                              <div className="toss-bible-folder-trail">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFileAdd(cat.id, sub.id);
                                  }}
                                  aria-label={`${sub.title}에 파일 추가`}
                                  className="toss-bible-nav-mini-btn toss-bible-nav-action-reveal disabled:opacity-40"
                                >
                                  +
                                </button>
                                <RowDeleteButton
                                  label={sub.title}
                                  className="toss-bible-nav-action-reveal"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(() => void onDeleteSubfolder(sub.id));
                                  }}
                                />
                                <button
                                  type="button"
                                  className="toss-bible-nav-chevron-btn"
                                  aria-expanded={folderOpen}
                                  aria-label={
                                    folderOpen ? `${sub.title} 접기` : `${sub.title} 펼치기`
                                  }
                                  onClick={() => toggleFolder(sub.id)}
                                >
                                  <CollapseChevron open={folderOpen} />
                                </button>
                              </div>
                            </div>

                            <div
                              className={`toss-bible-collapse-panel ${
                                folderOpen ? "toss-bible-collapse-panel-open" : ""
                              }`}
                            >
                              <div className="toss-bible-collapse-panel-inner">
                                <div className="toss-bible-folder-children">
                                  {files.length === 0 ? (
                                    <p className="toss-bible-muted">파일 없음</p>
                                  ) : (
                                    files.map((f) => (
                                      <BibleFileRow
                                        key={f.id}
                                        file={f}
                                        selected={selectedFileId === f.id}
                                        onSelect={() => onSelectFile(f.id)}
                                        onDelete={() => onDeleteFile(f.id)}
                                        onRequestDelete={requestDelete}
                                      />
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {rootFiles.map((f) => (
                        <BibleFileRow
                          key={f.id}
                          file={f}
                          selected={selectedFileId === f.id}
                          onSelect={() => onSelectFile(f.id)}
                          onDelete={() => onDeleteFile(f.id)}
                          onRequestDelete={requestDelete}
                        />
                      ))}

                      {catSubs.length === 0 && rootFiles.length === 0 ? (
                        <p className="toss-bible-muted">폴더 없음</p>
                      ) : null}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setCollapsedCategories((prev) => {
                            if (!prev.has(cat.id)) return prev;
                            const next = new Set(prev);
                            next.delete(cat.id);
                            return next;
                          });
                          setAddTarget({ type: "folder", categoryId: cat.id });
                        }}
                        className="toss-bible-nav-row toss-bible-nav-row-action disabled:opacity-40"
                      >
                        <BibleNavIcon kind="add" />
                        <span className="toss-bible-nav-label">폴더 만들기</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => setAddTarget({ type: "category" })}
          className="toss-bible-nav-row toss-bible-nav-row-action toss-bible-add-category disabled:opacity-40"
        >
          <BibleNavIcon kind="add" />
          <span className="toss-bible-nav-label">카테고리 추가</span>
        </button>
      </div>

      <NamePromptModal
        open={addTarget !== null}
        title={modalTitle}
        description={modalDescription}
        placeholder={modalPlaceholder}
        busy={busy}
        onClose={resetAdd}
        onSubmit={(title) => {
          if (!addTarget) return;
          if (addTarget.type === "category") {
            void run(() => onAddCategory(title));
            return;
          }
          if (addTarget.type === "folder") {
            void run(() => onAddSubfolder(addTarget.categoryId, title));
            return;
          }
          void run(() =>
            onAddFile(addTarget.categoryId, addTarget.subfolderId, title)
          );
        }}
      />
      {deleteConfirmModal}
    </>
  );
}
