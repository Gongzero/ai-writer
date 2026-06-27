import {
  getNextRisingOrder,
  sortArcOutline,
  validateArcChapterRange,
} from "./arc-stages";
import { uid } from "./ids";
import type { ArcBlock, MacroArcStage, ProjectData } from "./types";

export interface CreateArcInput {
  stage: MacroArcStage;
  title: string;
  fromChapter?: number;
  toChapter?: number;
  summary?: string;
}

export function createArcBlock(arcs: ArcBlock[], input: CreateArcInput): ArcBlock {
  const order = input.stage === "macro-rising" ? getNextRisingOrder(arcs) : 0;
  const block: ArcBlock = {
    id: uid("arc"),
    stage: input.stage,
    order,
    title: input.title.trim() || "새 아크",
    summary: input.summary?.trim() ?? "",
    microOutline: [],
    characterIds: [],
    eventIds: [],
  };

  if (input.fromChapter != null) block.fromChapter = input.fromChapter;
  if (input.toChapter != null) block.toChapter = input.toChapter;

  return block;
}

export function validateCreateArc(arcs: ArcBlock[], input: CreateArcInput): string | null {
  if (!input.title.trim()) return "이름을 입력해 주세요.";
  if (input.stage !== "macro-rising" && arcs.some((a) => a.stage === input.stage)) {
    return "이 단계는 이미 추가되어 있어요.";
  }
  return validateArcChapterRange(arcs, input.fromChapter, input.toChapter);
}

export function addArcToProject(
  project: ProjectData,
  input: CreateArcInput
): { project: ProjectData; arc: ArcBlock } {
  const error = validateCreateArc(project.arcOutline, input);
  if (error) throw new Error(error);

  const arc = createArcBlock(project.arcOutline, input);
  return {
    project: {
      ...project,
      arcOutline: sortArcOutline([...project.arcOutline, arc]),
    },
    arc,
  };
}

export type ArcUpdatePatch = Partial<
  Pick<ArcBlock, "title" | "summary" | "fromChapter" | "toChapter" | "characterIds" | "eventIds">
>;

function applyArcPatch(arc: ArcBlock, patch: ArcUpdatePatch): ArcBlock {
  const next: ArcBlock = { ...arc };

  if (patch.title !== undefined) next.title = patch.title;
  if (patch.summary !== undefined) next.summary = patch.summary;
  if (patch.characterIds !== undefined) next.characterIds = patch.characterIds;
  if (patch.eventIds !== undefined) next.eventIds = patch.eventIds;

  if ("fromChapter" in patch) {
    if (patch.fromChapter === undefined) delete next.fromChapter;
    else next.fromChapter = patch.fromChapter;
  }
  if ("toChapter" in patch) {
    if (patch.toChapter === undefined) delete next.toChapter;
    else next.toChapter = patch.toChapter;
  }

  return next;
}

export function updateArcInProject(
  project: ProjectData,
  arcId: string,
  patch: ArcUpdatePatch
): ProjectData {
  const next = project.arcOutline.map((a) =>
    a.id === arcId ? applyArcPatch(a, patch) : a
  );

  const target = next.find((a) => a.id === arcId);
  if (target) {
    const error = validateArcChapterRange(
      next,
      target.fromChapter,
      target.toChapter,
      arcId
    );
    if (error) throw new Error(error);
  }

  return { ...project, arcOutline: sortArcOutline(next) };
}

export function reorderMacroRisingInProject(
  project: ProjectData,
  arcId: string,
  direction: "up" | "down"
): ProjectData {
  const rising = sortArcOutline(project.arcOutline).filter(
    (a) => a.stage === "macro-rising"
  );
  const index = rising.findIndex((a) => a.id === arcId);
  if (index < 0) return project;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= rising.length) return project;

  const current = rising[index];
  const sibling = rising[swapIndex];
  const currentOrder = current.order;
  const siblingOrder = sibling.order;

  const arcOutline = project.arcOutline.map((arc) => {
    if (arc.id === current.id) return { ...arc, order: siblingOrder };
    if (arc.id === sibling.id) return { ...arc, order: currentOrder };
    return arc;
  });

  return { ...project, arcOutline: sortArcOutline(arcOutline) };
}

export function deleteArcFromProject(
  project: ProjectData,
  arcId: string
): ProjectData {
  return {
    ...project,
    arcOutline: project.arcOutline.filter((a) => a.id !== arcId),
  };
}

export function migrateLegacyArcBlock(
  arc: ArcBlock & { stage?: MacroArcStage; order?: number },
  risingOrder: number
): { arc: ArcBlock; nextRisingOrder: number } {
  if (arc.stage && typeof arc.order === "number") {
    return { arc, nextRisingOrder: risingOrder };
  }

  return {
    arc: {
      ...arc,
      stage: "macro-rising",
      order: risingOrder,
      microOutline: arc.microOutline ?? [],
    },
    nextRisingOrder: risingOrder + 1,
  };
}
