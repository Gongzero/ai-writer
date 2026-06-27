import {
  hasMicroArcStage,
  sortMicroOutline,
  validateMicroArcChapterRange,
} from "./micro-arc-stages";
import { uid } from "./ids";
import type { ArcBlock, MicroArcBlock, MicroArcStage, ProjectData } from "./types";

export interface CreateMicroArcInput {
  stage: MicroArcStage;
  title: string;
  fromChapter?: number;
  toChapter?: number;
  summary?: string;
}

export function ensureMicroOutline(arc: ArcBlock): MicroArcBlock[] {
  return arc.microOutline ?? [];
}

export function createMicroArcBlock(input: CreateMicroArcInput): MicroArcBlock {
  const block: MicroArcBlock = {
    id: uid("marc"),
    stage: input.stage,
    title: input.title.trim() || "새 소아크",
    summary: input.summary?.trim() ?? "",
    characterIds: [],
    eventIds: [],
  };

  if (input.fromChapter != null) block.fromChapter = input.fromChapter;
  if (input.toChapter != null) block.toChapter = input.toChapter;

  return block;
}

export function validateCreateMicroArc(
  macroArc: ArcBlock,
  input: CreateMicroArcInput
): string | null {
  if (!input.title.trim()) return "이름을 입력해 주세요.";

  const microOutline = ensureMicroOutline(macroArc);
  if (hasMicroArcStage(microOutline, input.stage)) {
    return "이 단계는 이미 추가되어 있어요.";
  }

  return validateMicroArcChapterRange(
    microOutline,
    input.fromChapter,
    input.toChapter
  );
}

export function addMicroArcToMacroArc(
  macroArc: ArcBlock,
  input: CreateMicroArcInput
): { macroArc: ArcBlock; microArc: MicroArcBlock } {
  const error = validateCreateMicroArc(macroArc, input);
  if (error) throw new Error(error);

  const microArc = createMicroArcBlock(input);
  return {
    macroArc: {
      ...macroArc,
      microOutline: sortMicroOutline([...ensureMicroOutline(macroArc), microArc]),
    },
    microArc,
  };
}

export function addMicroArcToProject(
  project: ProjectData,
  macroArcId: string,
  input: CreateMicroArcInput
): { project: ProjectData; microArc: MicroArcBlock } {
  const macroArc = project.arcOutline.find((a) => a.id === macroArcId);
  if (!macroArc) throw new Error("거시 아크를 찾을 수 없어요.");

  const { macroArc: nextMacroArc, microArc } = addMicroArcToMacroArc(macroArc, input);

  return {
    project: {
      ...project,
      arcOutline: project.arcOutline.map((a) =>
        a.id === macroArcId ? nextMacroArc : a
      ),
    },
    microArc,
  };
}

export type MicroArcUpdatePatch = Partial<
  Pick<
    MicroArcBlock,
    "title" | "summary" | "fromChapter" | "toChapter" | "characterIds" | "eventIds"
  >
>;

function applyMicroArcPatch(
  microArc: MicroArcBlock,
  patch: MicroArcUpdatePatch
): MicroArcBlock {
  const next: MicroArcBlock = { ...microArc };

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

export function updateMicroArcInProject(
  project: ProjectData,
  macroArcId: string,
  microArcId: string,
  patch: MicroArcUpdatePatch
): ProjectData {
  const macroArc = project.arcOutline.find((a) => a.id === macroArcId);
  if (!macroArc) throw new Error("거시 아크를 찾을 수 없어요.");

  const microOutline = ensureMicroOutline(macroArc);
  const nextMicroOutline = microOutline.map((m) =>
    m.id === microArcId ? applyMicroArcPatch(m, patch) : m
  );

  const target = nextMicroOutline.find((m) => m.id === microArcId);
  if (!target) throw new Error("소아크를 찾을 수 없어요.");

  const error = validateMicroArcChapterRange(
    nextMicroOutline,
    target.fromChapter,
    target.toChapter,
    microArcId
  );
  if (error) throw new Error(error);

  return {
    ...project,
    arcOutline: project.arcOutline.map((a) =>
      a.id === macroArcId
        ? { ...a, microOutline: sortMicroOutline(nextMicroOutline) }
        : a
    ),
  };
}

export function deleteMicroArcFromProject(
  project: ProjectData,
  macroArcId: string,
  microArcId: string
): ProjectData {
  return {
    ...project,
    arcOutline: project.arcOutline.map((a) =>
      a.id === macroArcId
        ? {
            ...a,
            microOutline: ensureMicroOutline(a).filter((m) => m.id !== microArcId),
          }
        : a
    ),
  };
}

export function findMicroArc(
  macroArc: ArcBlock,
  microArcId: string
): MicroArcBlock | null {
  return ensureMicroOutline(macroArc).find((m) => m.id === microArcId) ?? null;
}
