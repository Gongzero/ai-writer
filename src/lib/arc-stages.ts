import type { ArcBlock, MacroArcStage } from "./types";

export const MACRO_ARC_STAGE_OPTIONS: {
  id: MacroArcStage;
  label: string;
  single: boolean;
}[] = [
  { id: "macro-exposition", label: "대발단", single: true },
  { id: "macro-rising", label: "대전개", single: false },
  { id: "macro-crisis", label: "대위기", single: true },
  { id: "macro-climax", label: "대절정", single: true },
  { id: "macro-resolution", label: "대결말", single: true },
];

const STAGE_SORT_INDEX: Record<MacroArcStage, number> = {
  "macro-exposition": 0,
  "macro-rising": 1,
  "macro-crisis": 2,
  "macro-climax": 3,
  "macro-resolution": 4,
};

export function macroArcStageLabel(stage: MacroArcStage): string {
  return MACRO_ARC_STAGE_OPTIONS.find((o) => o.id === stage)?.label ?? stage;
}

export function sortArcOutline(arcs: ArcBlock[]): ArcBlock[] {
  return [...arcs].sort((a, b) => {
    const stageDiff = STAGE_SORT_INDEX[a.stage] - STAGE_SORT_INDEX[b.stage];
    if (stageDiff !== 0) return stageDiff;
    if (a.stage === "macro-rising" && b.stage === "macro-rising") {
      return a.order - b.order;
    }
    return 0;
  });
}

export function hasMacroArcStage(arcs: ArcBlock[], stage: MacroArcStage): boolean {
  if (stage === "macro-rising") return false;
  return arcs.some((a) => a.stage === stage);
}

export function getNextRisingOrder(arcs: ArcBlock[]): number {
  const orders = arcs
    .filter((a) => a.stage === "macro-rising")
    .map((a) => a.order);
  if (orders.length === 0) return 0;
  return Math.max(...orders) + 1;
}

function rangesOverlap(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

export function validateArcChapterRange(
  arcs: ArcBlock[],
  fromChapter?: number,
  toChapter?: number,
  excludeArcId?: string
): string | null {
  if (fromChapter == null && toChapter == null) return null;

  if (fromChapter != null && toChapter != null && fromChapter > toChapter) {
    return "시작 회차는 종료 회차보다 클 수 없어요.";
  }

  if (fromChapter == null || toChapter == null) {
    return null;
  }

  for (const arc of arcs) {
    if (arc.id === excludeArcId) continue;
    if (arc.fromChapter == null || arc.toChapter == null) continue;
    if (rangesOverlap(fromChapter, toChapter, arc.fromChapter, arc.toChapter)) {
      return `「${arc.title}」(${arc.fromChapter}~${arc.toChapter}화)와 회차가 겹쳐요.`;
    }
  }

  return null;
}

export function formatArcChapterRange(arc: ArcBlock): string {
  if (arc.fromChapter != null && arc.toChapter != null) {
    return `${arc.fromChapter}~${arc.toChapter}화`;
  }
  if (arc.fromChapter != null) return `${arc.fromChapter}화~`;
  if (arc.toChapter != null) return `~${arc.toChapter}화`;
  return "회차 미정";
}

export function parseOptionalChapter(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}
