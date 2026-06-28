import { get, set, del } from "idb-keyval";
import {
  addArcToProject,
  migrateLegacyArcBlock,
  reorderMacroRisingInProject,
  updateArcInProject,
  deleteArcFromProject,
  type ArcUpdatePatch,
  type CreateArcInput,
} from "./arc";
import {
  addMicroArcToProject,
  deleteMicroArcFromProject,
  updateMicroArcInProject,
  type CreateMicroArcInput,
  type MicroArcUpdatePatch,
} from "./micro-arc";
import {
  addBibleFileToProject,
  addCategoryToProject,
  addSubfolderToProject,
  deleteBibleFileFromProject,
  deleteSubfolderFromProject,
  updateBibleFileInProject,
} from "./bible";
import { addChapterToProject, deleteChapterFromProject, updateChapterInProject } from "./chapters";
import {
  createEmptyProject,
  type ArcBlock,
  type BibleFile,
  type Chapter,
  type ProjectData,
  type ProjectSummary,
  type SidebarTab,
} from "./types";
import { uid } from "./ids";

import { normalizeGeminiModel } from "./gemini-models";
import { composeStyleGuide } from "./compose-style-guide";
import { pickStyleGuideConcept } from "./concept-settings";
import {
  DEFAULT_GENRE_ID,
  DEFAULT_MOOD_TONE_ID,
  DEFAULT_PLOT_STRUCTURE_ID,
  DEFAULT_SETTING_ID,
  MECHANIC_NONE_ID,
  NARRATIVE_TRIGGER_NONE_ID,
  targetGroupForGenre,
  settingGroupForSetting,
} from "./concept";

const LEGACY_PROJECT_KEY = "webnovel-project";
const LIBRARY_KEY = "webnovel-library";
const ACTIVE_PROJECT_KEY = "webnovel-active-project-id";

function projectStorageKey(id: string) {
  return `webnovel-project-${id}`;
}

async function readLibrary(): Promise<ProjectSummary[]> {
  return (await get<ProjectSummary[]>(LIBRARY_KEY)) ?? [];
}

async function writeLibrary(entries: ProjectSummary[]) {
  await set(LIBRARY_KEY, entries);
}

async function upsertLibraryEntry(project: ProjectData) {
  const entries = await readLibrary();
  const summary: ProjectSummary = {
    id: project.id,
    title: project.meta.title,
    updatedAt: project.meta.updatedAt,
  };
  const next = [summary, ...entries.filter((e) => e.id !== project.id)].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  await writeLibrary(next);
}

async function migrateLegacySingleProject(): Promise<void> {
  const legacy = await get<ProjectData>(LEGACY_PROJECT_KEY);
  if (!legacy?.version) return;

  const id = legacy.id ?? uid("proj");
  const now = new Date().toISOString();
  const project: ProjectData = {
    ...legacy,
    id,
    meta: {
      ...legacy.meta,
      createdAt: legacy.meta.createdAt ?? now,
      updatedAt: legacy.meta.updatedAt ?? now,
    },
  };
  if (migrateSettings(project)) {
    /* saved below */
  }
  await set(projectStorageKey(id), project);
  await upsertLibraryEntry(project);
  await del(LEGACY_PROJECT_KEY);
}

function migrateProjectShape(project: ProjectData): boolean {
  let changed = false;
  if (!project.id) {
    project.id = uid("proj");
    changed = true;
  }
  if (!project.meta.createdAt) {
    project.meta.createdAt = project.meta.updatedAt ?? new Date().toISOString();
    changed = true;
  }
  if (migrateSettings(project)) {
    changed = true;
  }
  if (migrateArcOutline(project)) {
    changed = true;
  }
  return changed;
}

function migrateArcBibleLinks(arc: ArcBlock): { arc: ArcBlock; changed: boolean } {
  let changed = false;
  let next = arc;

  if (!next.characterIds) {
    next = { ...next, characterIds: [] };
    changed = true;
  }
  if (!next.eventIds) {
    next = { ...next, eventIds: [] };
    changed = true;
  }

  const microOutline = next.microOutline ?? [];
  let microChanged = false;
  const nextMicro = microOutline.map((micro) => {
    let m = micro;
    if (!m.characterIds) {
      m = { ...m, characterIds: [] };
      microChanged = true;
    }
    if (!m.eventIds) {
      m = { ...m, eventIds: [] };
      microChanged = true;
    }
    return m;
  });

  if (microChanged) {
    next = { ...next, microOutline: nextMicro };
    changed = true;
  }

  return { arc: next, changed };
}

function migrateArcOutline(project: ProjectData): boolean {
  let changed = false;
  let risingOrder = 0;
  project.arcOutline = project.arcOutline.map((arc) => {
    const result = migrateLegacyArcBlock(arc, risingOrder);
    let nextArc = result.arc;
    if (result.arc !== arc) changed = true;
    if (!nextArc.microOutline) {
      nextArc = { ...nextArc, microOutline: [] };
      changed = true;
    }
    const linkResult = migrateArcBibleLinks(nextArc);
    if (linkResult.changed) {
      nextArc = linkResult.arc;
      changed = true;
    }
    risingOrder = result.nextRisingOrder;
    return nextArc;
  });
  return changed;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await migrateLegacySingleProject();
  return readLibrary();
}

export async function setActiveProjectId(id: string) {
  await set(ACTIVE_PROJECT_KEY, id);
}

export async function getActiveProjectId(): Promise<string | null> {
  await migrateLegacySingleProject();
  return (await get<string>(ACTIVE_PROJECT_KEY)) ?? null;
}

export async function loadProjectById(id: string): Promise<ProjectData | null> {
  const stored = await get<ProjectData>(projectStorageKey(id));
  if (!stored?.version) return null;
  if (migrateProjectShape(stored)) {
    await saveProject(stored);
  }
  return stored;
}

export async function createNewProject(title = "새 작품"): Promise<ProjectData> {
  const project = createEmptyProject(title);
  await saveProject(project);
  await setActiveProjectId(project.id);
  return project;
}

export async function openProject(id: string): Promise<ProjectData> {
  const project = await loadProjectById(id);
  if (!project) {
    throw new Error("소설을 찾을 수 없습니다.");
  }
  await setActiveProjectId(id);
  return project;
}

type LegacySettings = ProjectData["settings"] & {
  conceptId?: string;
  rootCategoryId?: string;
  proseStyleId?: string;
  narrativeDeviceIds?: string[];
  worldSystemIds?: string[];
};

const GENRE_TO_ROOT: Record<string, string> = {
  medieval: "female-oriental-romantasy",
  fantasy: "male-fantasy-classic",
  wuxia: "male-wuxia-classic",
  historical: "male-alt-history",
  modern: "male-fantasy-modern",
  school: "female-modern-romance",
  romance: "female-romantasy",
  sf: "male-sf-game",
  horror: "other-horror",
  sports: "male-fantasy-modern",
};

const GENRE_TO_SETTING: Record<string, string> = {
  medieval: "fantasy-medieval",
  fantasy: "fantasy-medieval",
  wuxia: "wuxia-central",
  historical: "history-korea",
  modern: "modern-pure",
  school: "modern-pure",
  romance: "modern-pure",
  sf: "future-space",
  horror: "modern-pure",
  sports: "modern-pure",
};

const PROSE_TO_MOOD: Record<string, string> = {
  omniscient: "fast-thrilling",
  first: "epic-serious",
  limited: "epic-serious",
  fast: "fast-thrilling",
  lyrical: "healing-cozy",
  dialogue: "light-comic",
  formal: "epic-serious",
};

function migrateLegacyConcept(s: LegacySettings): boolean {
  let changed = false;

  if (!s.genreId) {
    const legacyGenre = s.rootCategoryId;
    s.genreId =
      (legacyGenre && GENRE_TO_ROOT[legacyGenre]) ||
      legacyGenre ||
      DEFAULT_GENRE_ID;
    changed = true;
  }
  if (s.rootCategoryId !== undefined) {
    delete s.rootCategoryId;
    changed = true;
  }
  if (s.settingId === "history-world") {
    s.settingId = "history-western";
    changed = true;
  }
  if (!s.targetGroupId && s.genreId) {
    s.targetGroupId = targetGroupForGenre(s.genreId);
    changed = true;
  }
  if (!s.settingGroupId && s.settingId) {
    s.settingGroupId = settingGroupForSetting(s.settingId);
    changed = true;
  }
  if (!s.settingId) {
    const legacyGenre = (s as { genreId?: string }).genreId;
    s.settingId =
      (legacyGenre && GENRE_TO_SETTING[legacyGenre]) || DEFAULT_SETTING_ID;
    changed = true;
  }
  if (!Array.isArray(s.mechanicIds)) {
    const mechanics: string[] = [];
    const legacyWorld = s.worldSystemIds ?? [];
    if (legacyWorld.includes("system")) mechanics.push("game-system");
    if (legacyWorld.length === 0) {
      /* keep empty */
    }
    s.mechanicIds = mechanics;
    changed = true;
  }
  if (!Array.isArray(s.narrativeTriggerIds)) {
    const triggers: string[] = [];
    const legacy = s.conceptId;
    const devices = s.narrativeDeviceIds ?? [];
    const all = [...devices, ...(legacy ? [legacy] : [])];
    for (const id of all) {
      if (id === "regression") triggers.push("regression");
      if (id === "possession") triggers.push("possession-book");
      if (id === "reincarnation") triggers.push("reincarnation");
      if (id === "isekai") triggers.push("dimension-summon");
      if (id === "awakening") triggers.push("awakening");
    }
    s.narrativeTriggerIds = [...new Set(triggers)];
    changed = true;
  }
  if (!Array.isArray(s.tropeIds)) {
    const tropes: string[] = [];
    const legacyWorld = s.worldSystemIds ?? [];
    if (legacyWorld.includes("villainess")) tropes.push("villainess");
    if (legacyWorld.includes("tower")) tropes.push("tower");
    s.tropeIds = tropes;
    changed = true;
  }
  if (!s.plotStructureId) {
    s.plotStructureId = DEFAULT_PLOT_STRUCTURE_ID;
    changed = true;
  }
  if (!s.moodToneId) {
    s.moodToneId =
      (s.proseStyleId && PROSE_TO_MOOD[s.proseStyleId]) || DEFAULT_MOOD_TONE_ID;
    changed = true;
  }

  const legacyKeys = [
    "conceptId",
    "proseStyleId",
    "narrativeDeviceIds",
    "worldSystemIds",
  ] as const;
  for (const key of legacyKeys) {
    if (key in s) {
      delete s[key];
      changed = true;
    }
  }

  if (s.mechanicIds.includes(MECHANIC_NONE_ID) && s.mechanicIds.length > 1) {
    s.mechanicIds = s.mechanicIds.filter((id) => id !== MECHANIC_NONE_ID);
    changed = true;
  }
  if (
    s.narrativeTriggerIds.includes(NARRATIVE_TRIGGER_NONE_ID) &&
    s.narrativeTriggerIds.length > 1
  ) {
    s.narrativeTriggerIds = s.narrativeTriggerIds.filter(
      (id) => id !== NARRATIVE_TRIGGER_NONE_ID
    );
    changed = true;
  }

  return changed;
}

function migrateSettings(project: ProjectData): boolean {
  if (!project.settings) {
    project.settings = createEmptyProject().settings;
    return true;
  }

  const s = project.settings;
  let changed = false;

  const normalized = normalizeGeminiModel(s.model ?? "");
  if (normalized !== s.model) {
    s.model = normalized;
    changed = true;
  }

  if (migrateLegacyConcept(s as LegacySettings)) {
    changed = true;
  }

  if (!s.styleGuide?.trim()) {
    s.styleGuide = composeStyleGuide(pickStyleGuideConcept(s));
    changed = true;
  }

  if (!s.pinnedWorldBibleIds) {
    s.pinnedWorldBibleIds = [];
    changed = true;
  }

  return changed;
}

export async function loadProject(): Promise<ProjectData> {
  try {
    await migrateLegacySingleProject();
    const activeId = await getActiveProjectId();
    if (activeId) {
      const stored = await loadProjectById(activeId);
      if (stored) return stored;
    }
    const library = await readLibrary();
    if (library[0]) {
      return openProject(library[0].id);
    }
    return createNewProject();
  } catch (e) {
    console.error("loadProject failed, using empty project:", e);
    const project = createEmptyProject();
    try {
      await saveProject(project);
      await setActiveProjectId(project.id);
    } catch {
      // IndexedDB unavailable
    }
    return project;
  }
}

export async function saveProject(project: ProjectData): Promise<void> {
  if (!project.id) project.id = uid("proj");
  project.meta.updatedAt = new Date().toISOString();
  if (!project.meta.createdAt) {
    project.meta.createdAt = project.meta.updatedAt;
  }
  await set(projectStorageKey(project.id), project);
  await upsertLibraryEntry(project);
}

export async function deleteProject(id: string): Promise<void> {
  await migrateLegacySingleProject();
  const activeId = await getActiveProjectId();
  await del(projectStorageKey(id));
  const entries = await readLibrary();
  await writeLibrary(entries.filter((e) => e.id !== id));
  if (activeId === id) {
    await del(ACTIVE_PROJECT_KEY);
  }
}

export async function updateSettings(
  patch: Partial<ProjectData["settings"]>
): Promise<ProjectData> {
  const project = await loadProject();
  project.settings = { ...project.settings, ...patch };
  await saveProject(project);
  return project;
}

export async function updateLastSidebarTab(tab: SidebarTab): Promise<ProjectData> {
  const project = await loadProject();
  project.settings.lastSidebarTab = tab;
  await saveProject(project);
  return project;
}

export async function exportProjectJson(): Promise<string> {
  const project = await loadProject();
  return JSON.stringify(project, null, 2);
}

export async function importProjectJson(json: string): Promise<ProjectData> {
  let parsed: ProjectData;
  try {
    parsed = JSON.parse(json) as ProjectData;
  } catch {
    throw new Error("JSON 파일을 읽을 수 없어요.");
  }
  if (parsed.version !== 1) {
    throw new Error("지원하지 않는 프로젝트 버전입니다.");
  }
  if (!parsed.meta || !parsed.settings || !Array.isArray(parsed.chapters)) {
    throw new Error("작품 파일 형식이 올바르지 않아요.");
  }
  if (!parsed.id) parsed.id = uid("proj");
  if (!parsed.arcOutline) parsed.arcOutline = [];
  if (!parsed.bibleFiles) parsed.bibleFiles = [];
  if (!parsed.categories) parsed.categories = [];
  if (!parsed.subfolders) parsed.subfolders = [];
  if (!parsed.synopsis) parsed.synopsis = { perChapter: [], rollups: [] };

  migrateProjectShape(parsed);
  await saveProject(parsed);
  await setActiveProjectId(parsed.id);
  return parsed;
}

export async function addChapter(options?: {
  title?: string;
  instruction?: string;
}): Promise<{
  project: ProjectData;
  chapter: Chapter;
}> {
  const project = await loadProject();
  const result = addChapterToProject(project, options);
  await saveProject(result.project);
  return result;
}

export async function updateChapter(
  chapterId: string,
  patch: Partial<Pick<Chapter, "title" | "outline" | "content" | "instruction">>
): Promise<ProjectData> {
  const project = await loadProject();
  const updated = updateChapterInProject(project, chapterId, patch);
  await saveProject(updated);
  return updated;
}

export async function deleteChapter(chapterId: string): Promise<ProjectData> {
  const project = await loadProject();
  const updated = deleteChapterFromProject(project, chapterId);
  await saveProject(updated);
  return updated;
}

export async function addBibleCategory(title: string) {
  const project = await loadProject();
  const result = addCategoryToProject(project, title);
  await saveProject(result.project);
  return result;
}

export async function addBibleSubfolder(categoryId: string, title: string) {
  const project = await loadProject();
  const result = addSubfolderToProject(project, categoryId, title);
  await saveProject(result.project);
  return result;
}

export async function addBibleFile(
  categoryId: string,
  subfolderId: string | null,
  title: string
) {
  const project = await loadProject();
  const result = addBibleFileToProject(project, categoryId, subfolderId, title);
  await saveProject(result.project);
  return result;
}

export async function updateBibleFile(
  fileId: string,
  patch: Partial<Pick<BibleFile, "title" | "content">>
): Promise<ProjectData> {
  const project = await loadProject();
  const updated = updateBibleFileInProject(project, fileId, patch);
  await saveProject(updated);
  return updated;
}

export async function deleteBibleFile(fileId: string): Promise<ProjectData> {
  const project = await loadProject();
  const updated = deleteBibleFileFromProject(project, fileId);
  await saveProject(updated);
  return updated;
}

export async function deleteBibleSubfolder(
  subfolderId: string
): Promise<ProjectData> {
  const project = await loadProject();
  const updated = deleteSubfolderFromProject(project, subfolderId);
  await saveProject(updated);
  return updated;
}

export async function addArc(input: CreateArcInput) {
  const project = await loadProject();
  const result = addArcToProject(project, input);
  await saveProject(result.project);
  return result;
}

export async function updateArc(
  arcId: string,
  patch: ArcUpdatePatch
): Promise<ProjectData> {
  const project = await loadProject();
  const updated = updateArcInProject(project, arcId, patch);
  await saveProject(updated);
  return updated;
}

export async function reorderMacroRisingArc(
  arcId: string,
  direction: "up" | "down"
): Promise<ProjectData> {
  const project = await loadProject();
  const updated = reorderMacroRisingInProject(project, arcId, direction);
  await saveProject(updated);
  return updated;
}

export async function deleteArc(arcId: string): Promise<ProjectData> {
  const project = await loadProject();
  const updated = deleteArcFromProject(project, arcId);
  await saveProject(updated);
  return updated;
}

export async function addMicroArc(macroArcId: string, input: CreateMicroArcInput) {
  const project = await loadProject();
  const result = addMicroArcToProject(project, macroArcId, input);
  await saveProject(result.project);
  return result;
}

export async function updateMicroArc(
  macroArcId: string,
  microArcId: string,
  patch: MicroArcUpdatePatch
): Promise<ProjectData> {
  const project = await loadProject();
  const updated = updateMicroArcInProject(project, macroArcId, microArcId, patch);
  await saveProject(updated);
  return updated;
}

export async function deleteMicroArc(
  macroArcId: string,
  microArcId: string
): Promise<ProjectData> {
  const project = await loadProject();
  const updated = deleteMicroArcFromProject(project, macroArcId, microArcId);
  await saveProject(updated);
  return updated;
}
