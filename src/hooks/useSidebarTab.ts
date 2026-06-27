"use client";

import { useCallback, useEffect, useState } from "react";
import { loadProject, updateLastSidebarTab } from "@/lib/db";
import { createEmptyProject } from "@/lib/types";
import {
  DEFAULT_SIDEBAR_TAB,
  resolveInitialSidebarTab,
  SIDEBAR_TABS,
  type ProjectData,
  type SidebarTab,
} from "@/lib/types";

interface UseSidebarTabResult {
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  project: ProjectData | null;
  setProject: (project: ProjectData) => void;
  refreshProject: () => Promise<ProjectData>;
  loading: boolean;
  loadError: string | null;
  retryLoad: () => void;
}

export function useSidebarTab(): UseSidebarTabResult {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [sidebarTab, setSidebarTabState] = useState<SidebarTab>(DEFAULT_SIDEBAR_TAB);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const refreshProject = useCallback(async () => {
    const data = await loadProject();
    setProject(data);
    return data;
  }, []);

  const retryLoad = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await loadProject();
        if (cancelled) return;
        setProject(data);
        setSidebarTabState(resolveInitialSidebarTab(data));
      } catch (e) {
        if (cancelled) return;
        console.error("init load failed:", e);
        const fallback = createEmptyProject();
        setProject(fallback);
        setSidebarTabState(resolveInitialSidebarTab(fallback));
        setLoadError(
          e instanceof Error
            ? e.message
            : "데이터를 불러오지 못했습니다. 새 작품으로 시작합니다."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const setSidebarTab = useCallback(async (tab: SidebarTab) => {
    setSidebarTabState(tab);
    try {
      const updated = await updateLastSidebarTab(tab);
      setProject(updated);
    } catch (e) {
      console.error("updateLastSidebarTab failed:", e);
    }
  }, []);

  return {
    sidebarTab,
    setSidebarTab,
    project,
    setProject,
    refreshProject,
    loading,
    loadError,
    retryLoad,
  };
}

export { SIDEBAR_TABS };
