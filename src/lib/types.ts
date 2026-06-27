import { DEFAULT_GEMINI_MODEL } from "./gemini-models";
import { composeStyleGuide } from "./compose-style-guide";
import {
  DEFAULT_GENRE_ID,
  DEFAULT_MOOD_TONE_ID,
  DEFAULT_PLOT_STRUCTURE_ID,
  DEFAULT_SETTING_GROUP_ID,
  DEFAULT_SETTING_ID,
  DEFAULT_TARGET_GROUP_ID,
} from "./concept";

import { uid } from "./ids";

export type ContentRating = "all" | "12" | "15" | "19";
export type SidebarTab = "concept" | "bible" | "arc" | "chapters";

export interface ProjectMeta {
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ProjectSettings {
  apiKey: string;
  apiKeyStorage: "localStorage" | "sessionStorage";
  model: string;
  styleGuide: string;
  contentRating: ContentRating;
  targetGroupId: string;
  genreId: string;
  settingGroupId: string;
  settingId: string;
  mechanicIds: string[];
  narrativeTriggerIds: string[];
  plotStructureId: string;
  tropeIds: string[];
  moodToneId: string;
  defaultChapterLength: number;
  prevChapterTailLength: number;
  rollupInterval: number;
  tokenWarningThreshold: number;
  maxChapterVersions: number;
  lastSidebarTab?: SidebarTab;
  /** 원고 집필 시 항상 컨텍스트에 포함할 세계관 바이블 파일 ID */
  pinnedWorldBibleIds?: string[];
}

export type MacroArcStage =
  | "macro-exposition"
  | "macro-rising"
  | "macro-crisis"
  | "macro-climax"
  | "macro-resolution";

export type MicroArcStage =
  | "micro-exposition"
  | "micro-rising"
  | "micro-crisis"
  | "micro-climax"
  | "micro-resolution";

export interface MicroArcBlock {
  id: string;
  stage: MicroArcStage;
  title: string;
  summary: string;
  fromChapter?: number;
  toChapter?: number;
  /** 바이블 인물 파일 ID */
  characterIds?: string[];
  /** 바이블 사건 파일 ID */
  eventIds?: string[];
}

export interface ArcBlock {
  id: string;
  stage: MacroArcStage;
  /** 대전개(`macro-rising`) 내 정렬 순서. 그 외 단계는 0 */
  order: number;
  title: string;
  summary: string;
  fromChapter?: number;
  toChapter?: number;
  /** 거시 아크 안의 소단계(소발단~소결말) */
  microOutline?: MicroArcBlock[];
  /** 바이블 인물 파일 ID */
  characterIds?: string[];
  /** 바이블 사건 파일 ID */
  eventIds?: string[];
}

export interface BibleCategory {
  id: string;
  title: string;
}

export interface BibleSubfolder {
  id: string;
  categoryId: string;
  title: string;
}

export interface BibleFile {
  id: string;
  categoryId: string;
  subfolderId: string | null;
  title: string;
  content: string;
  tags?: string[];
}

export interface ChapterVersion {
  content: string;
  savedAt: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  outline: string;
  content: string;
  instruction?: string;
  versions: ChapterVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface SynopsisEntry {
  id: string;
  chapterNumber: number;
  content: string;
}

export interface SynopsisRollup {
  id: string;
  fromChapter: number;
  toChapter: number;
  content: string;
}

export interface ProjectData {
  id: string;
  version: 1;
  meta: ProjectMeta;
  settings: ProjectSettings;
  arcOutline: ArcBlock[];
  categories: BibleCategory[];
  subfolders: BibleSubfolder[];
  bibleFiles: BibleFile[];
  synopsis: {
    perChapter: SynopsisEntry[];
    rollups: SynopsisRollup[];
  };
  chapters: Chapter[];
}

export const SIDEBAR_TABS: { id: SidebarTab; label: string }[] = [
  { id: "concept", label: "소설 컨셉" },
  { id: "bible", label: "바이블" },
  { id: "arc", label: "회차 뼈대" },
  { id: "chapters", label: "원고" },
];

export const DEFAULT_SIDEBAR_TAB: SidebarTab = "chapters";

const DEFAULT_CONCEPT = {
  targetGroupId: DEFAULT_TARGET_GROUP_ID,
  genreId: DEFAULT_GENRE_ID,
  settingGroupId: DEFAULT_SETTING_GROUP_ID,
  settingId: DEFAULT_SETTING_ID,
  mechanicIds: [] as string[],
  narrativeTriggerIds: [] as string[],
  plotStructureId: DEFAULT_PLOT_STRUCTURE_ID,
  tropeIds: [] as string[],
  moodToneId: DEFAULT_MOOD_TONE_ID,
};

/** Wizard용 — 컨셉 필드를 비워 두어 단계별로 선택하게 합니다. */
export function createWizardProject(title = "새 작품", id?: string): ProjectData {
  const project = createEmptyProject(title, id);
  return {
    ...project,
    settings: {
      ...project.settings,
      targetGroupId: "",
      genreId: "",
      settingGroupId: "",
      settingId: "",
      mechanicIds: [],
      narrativeTriggerIds: [],
      tropeIds: [],
      plotStructureId: "",
      moodToneId: "",
      styleGuide: "",
    },
  };
}

export function createEmptyProject(title = "새 작품", id?: string): ProjectData {
  const now = new Date().toISOString();
  const projectId = id ?? uid("proj");
  return {
    id: projectId,
    version: 1,
    meta: { title, updatedAt: now, createdAt: now },
    settings: {
      apiKey: "",
      apiKeyStorage: "localStorage",
      model: DEFAULT_GEMINI_MODEL,
      contentRating: "15",
      ...DEFAULT_CONCEPT,
      styleGuide: composeStyleGuide(DEFAULT_CONCEPT),
      defaultChapterLength: 3000,
      prevChapterTailLength: 700,
      rollupInterval: 10,
      tokenWarningThreshold: 12000,
      maxChapterVersions: 5,
      lastSidebarTab: DEFAULT_SIDEBAR_TAB,
    },
    arcOutline: [],
    categories: [
      { id: "characters", title: "인물" },
      { id: "world", title: "세계관" },
      { id: "events", title: "사건" },
    ],
    subfolders: [],
    bibleFiles: [],
    synopsis: { perChapter: [], rollups: [] },
    chapters: [],
  };
}

export function isFirstRun(project: ProjectData): boolean {
  return project.bibleFiles.length === 0 && project.arcOutline.length === 0;
}

export function resolveInitialSidebarTab(project: ProjectData): SidebarTab {
  if (isFirstRun(project)) {
    return "concept";
  }
  const tab = project.settings.lastSidebarTab ?? DEFAULT_SIDEBAR_TAB;
  if (tab === "concept" || tab === "bible" || tab === "arc" || tab === "chapters") {
    return tab;
  }
  return DEFAULT_SIDEBAR_TAB;
}

export function isConceptFoundationReady(settings: ProjectSettings): boolean {
  return Boolean(
    settings.targetGroupId &&
      settings.genreId &&
      settings.settingGroupId &&
      settings.settingId
  );
}
