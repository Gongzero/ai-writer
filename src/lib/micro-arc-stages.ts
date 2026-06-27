import type { MicroArcBlock, MicroArcStage } from "./types";

export const MICRO_ARC_STAGE_OPTIONS: {
  id: MicroArcStage;
  label: string;
}[] = [
  { id: "micro-exposition", label: "소발단" },
  { id: "micro-rising", label: "소전개" },
  { id: "micro-crisis", label: "소위기" },
  { id: "micro-climax", label: "소절정" },
  { id: "micro-resolution", label: "소결말" },
];

const STAGE_SORT_INDEX: Record<MicroArcStage, number> = {
  "micro-exposition": 0,
  "micro-rising": 1,
  "micro-crisis": 2,
  "micro-climax": 3,
  "micro-resolution": 4,
};

export function microArcStageLabel(stage: MicroArcStage): string {
  return MICRO_ARC_STAGE_OPTIONS.find((o) => o.id === stage)?.label ?? stage;
}

export function sortMicroOutline(microOutline: MicroArcBlock[]): MicroArcBlock[] {
  return [...microOutline].sort(
    (a, b) => STAGE_SORT_INDEX[a.stage] - STAGE_SORT_INDEX[b.stage]
  );
}

export function hasMicroArcStage(
  microOutline: MicroArcBlock[],
  stage: MicroArcStage
): boolean {
  return microOutline.some((a) => a.stage === stage);
}

export function allMicroArcStagesFilled(microOutline: MicroArcBlock[]): boolean {
  return MICRO_ARC_STAGE_OPTIONS.every((option) =>
    hasMicroArcStage(microOutline, option.id)
  );
}

function rangesOverlap(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

export function validateMicroArcChapterRange(
  microOutline: MicroArcBlock[],
  fromChapter?: number,
  toChapter?: number,
  excludeMicroArcId?: string
): string | null {
  if (fromChapter == null && toChapter == null) return null;

  if (fromChapter != null && toChapter != null && fromChapter > toChapter) {
    return "시작 회차는 종료 회차보다 클 수 없어요.";
  }

  if (fromChapter == null || toChapter == null) {
    return null;
  }

  for (const arc of microOutline) {
    if (arc.id === excludeMicroArcId) continue;
    if (arc.fromChapter == null || arc.toChapter == null) continue;
    if (rangesOverlap(fromChapter, toChapter, arc.fromChapter, arc.toChapter)) {
      return `「${arc.title}」(${arc.fromChapter}~${arc.toChapter}화)와 회차가 겹쳐요.`;
    }
  }

  return null;
}

export function formatMicroArcChapterRange(arc: MicroArcBlock): string {
  if (arc.fromChapter != null && arc.toChapter != null) {
    return `${arc.fromChapter}~${arc.toChapter}화`;
  }
  if (arc.fromChapter != null) return `${arc.fromChapter}화~`;
  if (arc.toChapter != null) return `~${arc.toChapter}화`;
  return "회차 미정";
}
