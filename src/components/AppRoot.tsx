"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CreateNovelModal } from "@/components/home/CreateNovelModal";
import { CreateWizardModal } from "@/components/home/CreateWizardModal";
import { HomeScreen } from "@/components/home/HomeScreen";
import { LoadNovelModal } from "@/components/home/LoadNovelModal";
import {
  createNewProject,
  importProjectJson,
  listProjects,
  openProject,
} from "@/lib/db";
import { readJsonFile } from "@/lib/project-transfer";
import { createWizardProject, type ProjectData, type ProjectSummary } from "@/lib/types";

type View = "home" | "editor";

export function AppRoot() {
  const [view, setView] = useState<View>("home");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryReady, setLibraryReady] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDraft, setWizardDraft] = useState<ProjectData | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingJson, setImportingJson] = useState(false);

  const authError = useMemo(() => {
    if (typeof window === "undefined") return null;
    const code = new URLSearchParams(window.location.search).get("auth_error");
    if (!code) return null;
    if (code === "missing_code" || code === "exchange_failed") {
      return "로그인에 실패했어요. 다시 시도해 주세요.";
    }
    if (code === "not_configured") {
      return "로그인 설정이 아직 완료되지 않았어요.";
    }
    return "로그인 중 문제가 생겼어요.";
  }, []);

  useEffect(() => {
    if (!authError) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("auth_error");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [authError]);

  const refreshLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      setProjects(await listProjects());
    } catch (e) {
      console.error("list projects failed:", e);
      setActionError("소설 목록을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setLibraryLoading(false);
      setLibraryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!loadModalOpen) {
      setLibraryReady(false);
      return;
    }
    void refreshLibrary();
  }, [loadModalOpen, refreshLibrary]);

  useEffect(() => {
    document.body.style.overflow = view === "editor" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [view]);

  const enterEditor = () => {
    setEditorKey((k) => k + 1);
    setView("editor");
  };

  const handleQuickCreate = async () => {
    setActionError(null);
    setCreateModalOpen(false);
    try {
      await createNewProject();
      enterEditor();
    } catch (e) {
      console.error("quick create failed:", e);
      setActionError("소설을 만들지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.");
      setView("home");
    }
  };

  const handleStartWizard = () => {
    setCreateModalOpen(false);
    setWizardDraft(createWizardProject("새 작품"));
    setWizardOpen(true);
  };

  const handleWizardComplete = () => {
    setWizardOpen(false);
    setWizardDraft(null);
    enterEditor();
  };

  const handleOpenProject = async (id: string) => {
    setActionError(null);
    try {
      await openProject(id);
      enterEditor();
    } catch (e) {
      console.error("open project failed:", e);
      setActionError("소설을 불러오지 못했어요. 다시 시도해 주세요.");
    }
  };

  const handleImportJson = async (file: File) => {
    setImportError(null);
    setImportingJson(true);
    try {
      const json = await readJsonFile(file);
      await importProjectJson(json);
      setLoadModalOpen(false);
      enterEditor();
    } catch (e) {
      console.error("import json failed:", e);
      setImportError(
        e instanceof Error ? e.message : "JSON 파일을 가져오지 못했어요."
      );
    } finally {
      setImportingJson(false);
    }
  };

  return (
    <>
      {actionError && (
        <div className="fixed inset-x-0 top-0 z-[210] px-4 py-3">
          <p className="mx-auto max-w-md rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700 shadow">
            {actionError}
          </p>
        </div>
      )}

      {view === "editor" ? (
        <AppShell key={editorKey} onExit={() => setView("home")} />
      ) : (
        <HomeScreen
          authError={authError}
          onCreate={() => {
            setActionError(null);
            setCreateModalOpen(true);
          }}
          onLoad={() => {
            setActionError(null);
            setImportError(null);
            setLibraryReady(false);
            setLibraryLoading(true);
            setLoadModalOpen(true);
          }}
        />
      )}

      <LoadNovelModal
        open={loadModalOpen}
        projects={projects}
        loading={libraryLoading}
        ready={libraryReady}
        importing={importingJson}
        importError={importError}
        onClose={() => setLoadModalOpen(false)}
        onSelect={(id) => {
          setLoadModalOpen(false);
          void handleOpenProject(id);
        }}
        onCreate={() => {
          setLoadModalOpen(false);
          setCreateModalOpen(true);
        }}
        onImportJson={(file) => void handleImportJson(file)}
      />

      <CreateNovelModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onWizard={handleStartWizard}
        onQuickCreate={handleQuickCreate}
      />

      {wizardDraft && wizardOpen && (
        <CreateWizardModal
          open={wizardOpen}
          draft={wizardDraft}
          onDraftChange={(next) =>
            setWizardDraft((prev) => {
              if (!prev) return prev;
              return typeof next === "function" ? next(prev) : next;
            })
          }
          onClose={() => {
            setWizardOpen(false);
            setWizardDraft(null);
          }}
          onComplete={handleWizardComplete}
        />
      )}
    </>
  );
}
