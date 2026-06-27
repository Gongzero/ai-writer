"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArcCreateModal } from "@/components/ArcCreateModal";
import { ArcEditor } from "@/components/ArcEditor";
import { ArcOutlineList } from "@/components/ArcOutlineList";
import { MicroArcCreateModal } from "@/components/MicroArcCreateModal";
import { MicroArcEditor } from "@/components/MicroArcEditor";
import { BibleFileEditor } from "@/components/BibleFileEditor";
import { BibleTree } from "@/components/BibleTree";
import { ChapterCreateModal, type CreateChapterInput } from "@/components/ChapterCreateModal";
import { PrerequisiteGuideModal } from "@/components/PrerequisiteGuideModal";
import { ChapterEditor } from "@/components/ChapterEditor";
import { ChapterList } from "@/components/ChapterList";
import { ConceptWorkspace } from "@/components/ConceptWorkspace";
import type { ConceptSaveState } from "@/components/ConceptEditor";
import { EditorPrimaryNav } from "@/components/EditorPrimaryNav";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { useSidebarTab } from "@/hooks/useSidebarTab";
import {
  addArc,
  addBibleCategory,
  addBibleFile,
  addBibleSubfolder,
  addChapter,
  deleteChapter,
  addMicroArc,
  deleteBibleFile,
  deleteBibleSubfolder,
  deleteArc,
  deleteMicroArc,
  reorderMacroRisingArc,
} from "@/lib/db";
import type { CreateArcInput } from "@/lib/arc";
import type { CreateMicroArcInput } from "@/lib/micro-arc";
import { findMicroArc } from "@/lib/micro-arc";
import type { ProjectData, SidebarTab } from "@/lib/types";
import type { PanelSaveState } from "@/lib/panel-save-state";

import { SettingsModal } from "@/components/SettingsModal";
import { EditorEmptyIcon } from "@/components/ui/EditorEmptyIcon";
import { ReadinessChecklist } from "@/components/ui/ReadinessChecklist";
import { MobileTopbarNav } from "@/components/ui/MobileDetailHeader";
import { MobileDetailBottomSave } from "@/components/ui/MobileDetailBottomSave";
import { Tossface } from "@/components/ui/Tossface";
import { displayNovelTitle } from "@/lib/project-title";
import {
  evaluateProjectReadiness,
  getArcPrerequisiteGuide,
  getChaptersPrerequisiteGuide,
  type PrerequisiteGuide,
} from "@/lib/readiness";

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppShell({ onExit }: { onExit?: () => void }) {
  const { sidebarTab, setSidebarTab, project, setProject, loading, loadError, retryLoad } =
    useSidebarTab();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedBibleFileId, setSelectedBibleFileId] = useState<string | null>(
    null
  );
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);
  const [selectedMicroArcId, setSelectedMicroArcId] = useState<string | null>(null);
  const [addingChapter, setAddingChapter] = useState(false);
  const [addingArc, setAddingArc] = useState(false);
  const [addingMicroArc, setAddingMicroArc] = useState(false);
  const [arcCreateOpen, setArcCreateOpen] = useState(false);
  const [chapterCreateOpen, setChapterCreateOpen] = useState(false);
  const [prerequisiteOpen, setPrerequisiteOpen] = useState(false);
  const [prerequisiteGuide, setPrerequisiteGuide] = useState<PrerequisiteGuide | null>(
    null
  );
  const [microArcCreateOpen, setMicroArcCreateOpen] = useState(false);
  const [microArcCreateParentId, setMicroArcCreateParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conceptSave, setConceptSave] = useState<ConceptSaveState | null>(null);
  const [detailSave, setDetailSave] = useState<PanelSaveState | null>(null);
  const { requestDelete, deleteConfirmModal } = useDeleteConfirm();
  const onConceptSaveStateChange = useCallback((state: ConceptSaveState | null) => {
    setConceptSave((prev) => {
      if (state === null) return null;
      if (prev?.dirty === state.dirty && prev?.saving === state.saving) return prev;
      return state;
    });
  }, []);
  const onDetailSaveStateChange = useCallback((state: PanelSaveState | null) => {
    setDetailSave((prev) => {
      if (state === null) return null;
      if (
        prev?.dirty === state.dirty &&
        prev?.saving === state.saving &&
        prev?.label === state.label
      ) {
        return prev;
      }
      return state;
    });
  }, []);
  const handleNavigateTab = useCallback(
    (tab: SidebarTab) => {
      void setSidebarTab(tab);
    },
    [setSidebarTab]
  );

  const openPrerequisite = useCallback((guide: PrerequisiteGuide) => {
    setPrerequisiteGuide(guide);
    setPrerequisiteOpen(true);
  }, []);

  const handleTabChange = useCallback(
    (tab: SidebarTab) => {
      if (!project) {
        void setSidebarTab(tab);
        return;
      }
      if (tab === "chapters") {
        const guide = getChaptersPrerequisiteGuide(project);
        if (guide) {
          void setSidebarTab("chapters");
          openPrerequisite(guide);
          return;
        }
      }
      if (tab === "arc") {
        const guide = getArcPrerequisiteGuide(project);
        if (guide) {
          void setSidebarTab("arc");
          openPrerequisite(guide);
          return;
        }
      }
      void setSidebarTab(tab);
    },
    [openPrerequisite, project, setSidebarTab]
  );

  const requestChapterCreate = useCallback(() => {
    if (!project) return;
    const guide = getChaptersPrerequisiteGuide(project);
    if (guide) {
      openPrerequisite(guide);
      return;
    }
    setChapterCreateOpen(true);
  }, [openPrerequisite, project]);

  const requestArcCreate = useCallback(() => {
    if (!project) return;
    const guide = getArcPrerequisiteGuide(project);
    if (guide) {
      openPrerequisite(guide);
      return;
    }
    setArcCreateOpen(true);
  }, [openPrerequisite, project]);

  const initialPrerequisiteChecked = useRef(false);
  useEffect(() => {
    if (!project || initialPrerequisiteChecked.current) return;
    initialPrerequisiteChecked.current = true;
    if (sidebarTab === "chapters") {
      const guide = getChaptersPrerequisiteGuide(project);
      if (guide) openPrerequisite(guide);
    } else if (sidebarTab === "arc") {
      const guide = getArcPrerequisiteGuide(project);
      if (guide) openPrerequisite(guide);
    }
  }, [openPrerequisite, project, sidebarTab]);

  const projectReadiness = useMemo(
    () => (project ? evaluateProjectReadiness(project) : []),
    [project]
  );
  const handleProjectSaved = useCallback((updated: ProjectData) => {
    setProject(updated);
  }, [setProject]);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [tabEnter, setTabEnter] = useState(false);
  const isFirstTabRender = useRef(true);

  useEffect(() => {
    if (isFirstTabRender.current) {
      isFirstTabRender.current = false;
      return;
    }
    setTabEnter(true);
    workspaceRef.current?.querySelectorAll(".toss-editor-scroll").forEach((el) => {
      el.scrollTop = 0;
    });
    const timer = window.setTimeout(() => setTabEnter(false), 340);
    return () => window.clearTimeout(timer);
  }, [sidebarTab]);

  if (loading || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[var(--toss-gray-100)] text-[15px] text-[var(--toss-gray-600)]">
        <p>불러오는 중…</p>
        <p className="text-[13px] text-[var(--toss-gray-400)]">
          오래 걸리면 새로고침(Cmd+Shift+R) 또는 개발 서버(npm run dev)를 확인하세요.
        </p>
      </div>
    );
  }

  const selectedChapter =
    project.chapters.find((ch) => ch.id === selectedChapterId) ?? null;
  const selectedBibleFile =
    project.bibleFiles.find((f) => f.id === selectedBibleFileId) ?? null;
  const selectedArc =
    project.arcOutline.find((a) => a.id === selectedArcId) ?? null;
  const selectedMicroArc =
    selectedArc && selectedMicroArcId
      ? findMicroArc(selectedArc, selectedMicroArcId)
      : null;
  const microArcCreateParent =
    project.arcOutline.find((a) => a.id === microArcCreateParentId) ?? null;

  const handleError = (e: unknown, fallback: string) => {
    const message = e instanceof Error ? e.message : fallback;
    setError(message);
    console.error(fallback, e);
  };

  const handleAddChapter = async (input: CreateChapterInput) => {
    setAddingChapter(true);
    setError(null);
    try {
      const { project: updated, chapter } = await addChapter({
        title: input.title,
        instruction: input.instruction || undefined,
      });
      setProject(updated);
      setSelectedChapterId(chapter.id);
      setChapterCreateOpen(false);
      if (sidebarTab !== "chapters") await setSidebarTab("chapters");
    } catch (e) {
      handleError(e, "새 화를 추가하지 못했습니다.");
    } finally {
      setAddingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    setError(null);
    try {
      const updated = await deleteChapter(chapterId);
      setProject(updated);
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(null);
      }
    } catch (e) {
      handleError(e, "화를 삭제하지 못했습니다.");
    }
  };

  const handleAddArc = async (input: CreateArcInput) => {
    setAddingArc(true);
    setError(null);
    try {
      const { project: updated, arc } = await addArc(input);
      setProject(updated);
      setSelectedArcId(arc.id);
      setSelectedMicroArcId(null);
      setArcCreateOpen(false);
      if (sidebarTab !== "arc") await setSidebarTab("arc");
    } catch (e) {
      handleError(e, "아크를 추가하지 못했습니다.");
    } finally {
      setAddingArc(false);
    }
  };

  const handleAddMicroArc = async (input: CreateMicroArcInput) => {
    if (!microArcCreateParentId) return;
    setAddingMicroArc(true);
    setError(null);
    try {
      const { project: updated, microArc } = await addMicroArc(
        microArcCreateParentId,
        input
      );
      setProject(updated);
      setSelectedArcId(microArcCreateParentId);
      setSelectedMicroArcId(microArc.id);
      setMicroArcCreateOpen(false);
      setMicroArcCreateParentId(null);
      if (sidebarTab !== "arc") await setSidebarTab("arc");
    } catch (e) {
      handleError(e, "소아크를 추가하지 못했습니다.");
    } finally {
      setAddingMicroArc(false);
    }
  };

  const handleOpenMicroArcCreate = (macroArcId: string) => {
    setMicroArcCreateParentId(macroArcId);
    setMicroArcCreateOpen(true);
  };

  const handleSelectMacroArc = (arcId: string) => {
    setSelectedArcId(arcId);
    setSelectedMicroArcId(null);
  };

  const handleSelectMicroArc = (macroArcId: string, microArcId: string) => {
    setSelectedArcId(macroArcId);
    setSelectedMicroArcId(microArcId);
  };

  const handleReorderRisingArc = async (arcId: string, direction: "up" | "down") => {
    setError(null);
    try {
      const updated = await reorderMacroRisingArc(arcId, direction);
      setProject(updated);
    } catch (e) {
      handleError(e, "순서를 바꾸지 못했습니다.");
    }
  };

  const handleDeleteArc = async (arcId: string) => {
    setError(null);
    try {
      const updated = await deleteArc(arcId);
      setProject(updated);
      if (selectedArcId === arcId) {
        setSelectedArcId(null);
        setSelectedMicroArcId(null);
      }
    } catch (e) {
      handleError(e, "아크를 삭제하지 못했습니다.");
    }
  };

  const handleDeleteMicroArc = async (macroArcId: string, microArcId: string) => {
    setError(null);
    try {
      const updated = await deleteMicroArc(macroArcId, microArcId);
      setProject(updated);
      if (selectedMicroArcId === microArcId) {
        setSelectedMicroArcId(null);
      }
    } catch (e) {
      handleError(e, "소아크를 삭제하지 못했습니다.");
    }
  };

  const handleAddCategory = async (title: string) => {
    setError(null);
    const { project: updated } = await addBibleCategory(title);
    setProject(updated);
  };

  const handleAddSubfolder = async (categoryId: string, title: string) => {
    setError(null);
    const { project: updated } = await addBibleSubfolder(categoryId, title);
    setProject(updated);
  };

  const handleAddFile = async (
    categoryId: string,
    subfolderId: string,
    title: string
  ) => {
    setError(null);
    const { project: updated, file } = await addBibleFile(
      categoryId,
      subfolderId,
      title
    );
    setProject(updated);
    setSelectedBibleFileId(file.id);
  };

  const handleDeleteFile = async (fileId: string) => {
    setError(null);
    const updated = await deleteBibleFile(fileId);
    setProject(updated);
    if (selectedBibleFileId === fileId) {
      setSelectedBibleFileId(null);
    }
  };

  const handleDeleteSubfolder = async (subfolderId: string) => {
    setError(null);
    const deletedFileIds = new Set(
      project.bibleFiles
        .filter((f) => f.subfolderId === subfolderId)
        .map((f) => f.id)
    );
    const updated = await deleteBibleSubfolder(subfolderId);
    setProject(updated);
    if (selectedBibleFileId && deletedFileIds.has(selectedBibleFileId)) {
      setSelectedBibleFileId(null);
    }
  };

  const handleMobileBack = () => {
    if (sidebarTab === "bible") setSelectedBibleFileId(null);
    if (sidebarTab === "arc") {
      setSelectedArcId(null);
      setSelectedMicroArcId(null);
    }
    if (sidebarTab === "chapters") setSelectedChapterId(null);
  };

  const hasMobileDetail =
    sidebarTab === "bible"
      ? Boolean(selectedBibleFile)
      : sidebarTab === "arc"
        ? Boolean(selectedArc)
        : sidebarTab === "chapters"
          ? Boolean(selectedChapter)
          : false;

  const mobileDetailTitle = (() => {
    if (sidebarTab === "bible" && selectedBibleFile) return selectedBibleFile.title;
    if (sidebarTab === "arc" && selectedMicroArc) return selectedMicroArc.title;
    if (sidebarTab === "arc" && selectedArc) return selectedArc.title;
    if (sidebarTab === "chapters" && selectedChapter) {
      const label = selectedChapter.title.trim();
      return label ? `${selectedChapter.number}화 · ${label}` : `${selectedChapter.number}화`;
    }
    return "";
  })();

  const handleMobileDelete = () => {
    if (sidebarTab === "bible" && selectedBibleFileId) {
      const fileId = selectedBibleFileId;
      requestDelete(async () => {
        await handleDeleteFile(fileId);
      });
      return;
    }
    if (sidebarTab === "arc" && selectedArcId && selectedMicroArcId) {
      const macroId = selectedArcId;
      const microId = selectedMicroArcId;
      requestDelete(async () => {
        await handleDeleteMicroArc(macroId, microId);
      });
      return;
    }
    if (sidebarTab === "arc" && selectedArcId) {
      const arcId = selectedArcId;
      requestDelete(async () => {
        await handleDeleteArc(arcId);
      });
    }
  };

  const canMobileDelete = sidebarTab === "bible" || sidebarTab === "arc";

  const renderListPanel = () => {
    if (sidebarTab === "bible") {
      return (
        <BibleTree
          categories={project.categories}
          subfolders={project.subfolders}
          bibleFiles={project.bibleFiles}
          selectedFileId={selectedBibleFileId}
          onSelectFile={setSelectedBibleFileId}
          onAddCategory={handleAddCategory}
          onAddSubfolder={handleAddSubfolder}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          onDeleteSubfolder={handleDeleteSubfolder}
        />
      );
    }
    if (sidebarTab === "arc") {
      return (
        <ArcOutlineList
          arcs={project.arcOutline}
          selectedArcId={selectedArcId}
          selectedMicroArcId={selectedMicroArcId}
          onSelectMacro={handleSelectMacroArc}
          onSelectMicro={handleSelectMicroArc}
          onAdd={requestArcCreate}
          onAddMicro={handleOpenMicroArcCreate}
          onDelete={(arcId) => void handleDeleteArc(arcId)}
          onDeleteMicro={(macroArcId, microArcId) =>
            void handleDeleteMicroArc(macroArcId, microArcId)
          }
          onReorderRising={(arcId, direction) =>
            void handleReorderRisingArc(arcId, direction)
          }
          adding={addingArc}
        />
      );
    }
    if (sidebarTab === "chapters") {
      return (
        <ChapterList
          chapters={project.chapters}
          selectedId={selectedChapterId}
          onSelect={setSelectedChapterId}
          onAdd={requestChapterCreate}
          onDelete={handleDeleteChapter}
          adding={addingChapter}
        />
      );
    }
    return null;
  };

  const renderEditorContent = () => {
    if (sidebarTab === "chapters" && selectedChapter) {
      return (
        <ChapterEditor
          project={project}
          chapter={selectedChapter}
          onSaved={handleProjectSaved}
          onSaveStateChange={onDetailSaveStateChange}
        />
      );
    }
    if (sidebarTab === "bible" && selectedBibleFile) {
      return (
        <BibleFileEditor
          file={selectedBibleFile}
          categories={project.categories}
          subfolders={project.subfolders}
          bibleFiles={project.bibleFiles}
          onSaved={handleProjectSaved}
          onSaveStateChange={onDetailSaveStateChange}
        />
      );
    }
    if (sidebarTab === "arc" && selectedMicroArc && selectedArc) {
      return (
        <MicroArcEditor
          parentArc={selectedArc}
          microArc={selectedMicroArc}
          categories={project.categories}
          bibleFiles={project.bibleFiles}
          onSaved={handleProjectSaved}
          onSaveStateChange={onDetailSaveStateChange}
        />
      );
    }
    if (sidebarTab === "arc" && selectedArc) {
      return (
        <ArcEditor
          arc={selectedArc}
          categories={project.categories}
          bibleFiles={project.bibleFiles}
          onSaved={handleProjectSaved}
          onSaveStateChange={onDetailSaveStateChange}
        />
      );
    }

    return (
      <div className="toss-editor-empty">
        <EditorEmptyIcon />
        <div className="toss-editor-empty-copy">
          <p>
            {sidebarTab === "bible" && "바이블 파일을 선택하세요"}
            {sidebarTab === "arc" &&
              (addingArc
                ? "아크를 추가하는 중…"
                : project.arcOutline.length === 0
                  ? "아크를 추가해 보세요"
                  : "아크를 선택하세요")}
            {sidebarTab === "chapters" &&
              (addingChapter
                ? "새 화를 추가하는 중…"
                : project.chapters.length === 0
                  ? "첫 화를 추가해 보세요"
                  : "집필할 화를 선택하세요")}
          </p>
          <span>
            {sidebarTab === "bible" && "목록에서 파일·폴더·카테고리를 추가할 수 있어요."}
            {sidebarTab === "arc" &&
              (project.arcOutline.length === 0
                ? "목록에서 「+ 아크 추가」로 회차 뼈대를 잡아보세요."
                : "목록에서 아크를 고르면 편집할 수 있어요.")}
            {sidebarTab === "chapters" &&
              (project.chapters.length === 0
                ? "목록에서 「+ 새 화」를 눌러 집필을 시작하세요."
                : "목록에서 화를 고르면 에디터가 열려요.")}
          </span>
        </div>

        {(sidebarTab === "bible" ||
          sidebarTab === "arc" ||
          sidebarTab === "chapters") && (
          <ReadinessChecklist
            items={projectReadiness}
            onNavigate={handleNavigateTab}
            variant="steps"
          />
        )}
      </div>
    );
  };

  const novelTitle = displayNovelTitle(project.meta.title);
  const showConceptSave = sidebarTab === "concept" && conceptSave;

  return (
    <div className="toss-editor-shell">
      <header
        className={`toss-editor-topbar ${hasMobileDetail ? "toss-editor-topbar-detail" : ""}`}
      >
        <div className="toss-editor-topbar-root">
          <h1 className="toss-editor-topbar-title">{novelTitle}</h1>

          <div className="toss-editor-topbar-actions">
            {showConceptSave && (
              <button
                type="button"
                onClick={conceptSave.save}
                disabled={!conceptSave.dirty || conceptSave.saving}
                className="toss-editor-topbar-save"
              >
                {conceptSave.saving ? "저장 중…" : "저장"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="toss-editor-topbar-icon"
              aria-label="설정"
            >
              <Tossface emoji="⚙️" size="sm" />
            </button>
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="toss-editor-topbar-icon"
                aria-label="나가기"
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>
        </div>

        {hasMobileDetail ? (
          <MobileTopbarNav
            title={mobileDetailTitle}
            onBack={handleMobileBack}
            onDelete={canMobileDelete ? handleMobileDelete : undefined}
          />
        ) : null}
      </header>

      {(loadError || error) && (
        <div className="toss-editor-alerts">
          {loadError && (
            <div className="toss-callout-warning text-[12px]">
              {loadError}
              <button type="button" onClick={retryLoad} className="toss-text-link ml-2">
                다시 시도
              </button>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="toss-editor-body">
        <EditorPrimaryNav
          activeTab={sidebarTab}
          onTabChange={handleTabChange}
          className={hasMobileDetail ? "toss-hide-on-mobile-detail" : undefined}
        />

        {hasMobileDetail ? <MobileDetailBottomSave save={detailSave} /> : null}

        <div
          ref={workspaceRef}
          className={`toss-editor-workspace ${tabEnter ? "toss-editor-tab-enter" : ""}`}
        >
          {sidebarTab === "concept" ? (
            <div className="toss-editor-scroll">
              <ConceptWorkspace
                settings={project.settings}
                onSaved={handleProjectSaved}
                onSaveStateChange={onConceptSaveStateChange}
              />
            </div>
          ) : (
            <div
              className={`toss-editor-split ${hasMobileDetail ? "toss-editor-split-detail" : ""}`}
            >
              <aside className="toss-editor-list-panel">
                <div className="toss-editor-scroll">{renderListPanel()}</div>
              </aside>
              <div className="toss-editor-content-panel">{renderEditorContent()}</div>
            </div>
          )}
        </div>
      </div>

      <PrerequisiteGuideModal
        open={prerequisiteOpen}
        guide={prerequisiteGuide}
        onClose={() => setPrerequisiteOpen(false)}
        onNavigate={handleNavigateTab}
      />

      <ChapterCreateModal
        open={chapterCreateOpen}
        chapters={project.chapters}
        project={project}
        busy={addingChapter}
        onClose={() => setChapterCreateOpen(false)}
        onSubmit={(input) => void handleAddChapter(input)}
        onNavigateTab={handleNavigateTab}
      />

      <ArcCreateModal
        open={arcCreateOpen}
        arcs={project.arcOutline}
        project={project}
        busy={addingArc}
        onClose={() => setArcCreateOpen(false)}
        onSubmit={(input) => void handleAddArc(input)}
        onNavigateTab={handleNavigateTab}
      />

      <MicroArcCreateModal
        open={microArcCreateOpen}
        parentArc={microArcCreateParent}
        project={project}
        busy={addingMicroArc}
        onClose={() => {
          setMicroArcCreateOpen(false);
          setMicroArcCreateParentId(null);
        }}
        onSubmit={(input) => void handleAddMicroArc(input)}
      />

      <SettingsModal
        open={settingsOpen}
        project={project}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleProjectSaved}
        onDeleted={onExit}
      />

      {deleteConfirmModal}
    </div>
  );
}
