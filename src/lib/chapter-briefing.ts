import { ensureIdList } from "@/lib/arc-bible-links";
import { formatArcChapterRange } from "@/lib/arc-stages";
import {
  formatMicroArcChapterRange,
  microArcStageLabel,
} from "@/lib/micro-arc-stages";
import { filePathLabel } from "@/lib/bible";
import {
  buildSynopsisContext,
  estimateTokens,
  getActiveArc,
  getPrevChapterTail,
  type ContextChip,
} from "@/lib/context";
import type { ArcBlock, MicroArcBlock, ProjectData } from "@/lib/types";

export interface MicroArcChapterPosition {
  /** 소아크 내 몇 번째 화 (1-based) */
  index: number;
  /** 소아크에 배정된 총 화 수 */
  total: number;
  fromChapter: number;
  toChapter: number;
}

export interface ChapterBriefing {
  chapterNumber: number;
  macroArc: ArcBlock | null;
  microArc: MicroArcBlock | null;
  microPosition: MicroArcChapterPosition | null;
  linkedCharacterIds: string[];
  linkedEventIds: string[];
  pinnedWorldIds: string[];
}

export function getActiveMicroArc(
  chapterNumber: number,
  macroArc: ArcBlock | null
): MicroArcBlock | null {
  if (!macroArc?.microOutline?.length) return null;

  const sorted = [...macroArc.microOutline];
  const withRange = sorted.filter(
    (m) => m.fromChapter != null && m.toChapter != null
  );

  const exact = withRange.find(
    (m) =>
      chapterNumber >= m.fromChapter! && chapterNumber <= m.toChapter!
  );
  if (exact) return exact;

  if (
    macroArc.fromChapter != null &&
    macroArc.toChapter != null &&
    chapterNumber >= macroArc.fromChapter &&
    chapterNumber <= macroArc.toChapter
  ) {
    const totalChapters = macroArc.toChapter - macroArc.fromChapter + 1;
    const indexInMacro = chapterNumber - macroArc.fromChapter;
    const microIndex = Math.min(
      sorted.length - 1,
      Math.floor((indexInMacro / totalChapters) * sorted.length)
    );
    return sorted[microIndex] ?? null;
  }

  return sorted[0] ?? null;
}

export function getMicroArcChapterPosition(
  chapterNumber: number,
  microArc: MicroArcBlock | null
): MicroArcChapterPosition | null {
  if (!microArc) return null;

  if (microArc.fromChapter != null && microArc.toChapter != null) {
    const from = microArc.fromChapter;
    const to = microArc.toChapter;
    if (chapterNumber < from || chapterNumber > to) return null;
    return {
      index: chapterNumber - from + 1,
      total: to - from + 1,
      fromChapter: from,
      toChapter: to,
    };
  }

  return null;
}

function mergeLinkIds(
  macroArc: ArcBlock | null,
  microArc: MicroArcBlock | null
): { characterIds: string[]; eventIds: string[] } {
  const characterIds = [
    ...new Set([
      ...ensureIdList(macroArc?.characterIds),
      ...ensureIdList(microArc?.characterIds),
    ]),
  ];
  const eventIds = [
    ...new Set([
      ...ensureIdList(macroArc?.eventIds),
      ...ensureIdList(microArc?.eventIds),
    ]),
  ];
  return { characterIds, eventIds };
}

export function buildChapterBriefing(
  project: ProjectData,
  chapterNumber: number
): ChapterBriefing {
  const macroArc = getActiveArc(chapterNumber, project.arcOutline);
  const microArc = getActiveMicroArc(chapterNumber, macroArc);
  const microPosition = getMicroArcChapterPosition(chapterNumber, microArc);
  const { characterIds, eventIds } = mergeLinkIds(macroArc, microArc);
  const pinnedWorldIds = ensureIdList(project.settings.pinnedWorldBibleIds);

  return {
    chapterNumber,
    macroArc,
    microArc,
    microPosition,
    linkedCharacterIds: characterIds,
    linkedEventIds: eventIds,
    pinnedWorldIds,
  };
}

export function buildBriefingSummary(briefing: ChapterBriefing): string {
  const { macroArc, microArc, microPosition, chapterNumber } = briefing;

  if (microArc?.summary.trim()) {
    const stage = microArcStageLabel(microArc.stage);
    const range = formatMicroArcChapterRange(microArc);
    let head = `【소아크 · ${microArc.title} (${stage}, ${range})】\n${microArc.summary.trim()}`;
    if (microPosition) {
      head += `\n\n이번 ${chapterNumber}화는 이 소아크(${microPosition.fromChapter}~${microPosition.toChapter}화) 중 ${microPosition.index}/${microPosition.total}번째 화입니다.`;
    }
    return head;
  }

  if (macroArc?.summary.trim()) {
    return `【거시 아크 · ${macroArc.title} (${formatArcChapterRange(macroArc)})】\n${macroArc.summary.trim()}\n\n(소아크 요약이 없어 거시 아크 기준으로 집필합니다.)`;
  }

  return `${chapterNumber}화 — 회차 뼈대에 이 화가 속한 소아크·아크를 먼저 잡아 주세요.`;
}

export function buildDefaultContextChips(
  project: ProjectData,
  briefing: ChapterBriefing
): ContextChip[] {
  const chips: ContextChip[] = [];
  const { chapterNumber, macroArc, microArc, linkedCharacterIds, linkedEventIds, pinnedWorldIds } =
    briefing;

  if (microArc || macroArc) {
    const label = microArc
      ? `소아크 · ${microArc.title}`
      : `아크 · ${macroArc!.title}`;
    const summary = microArc?.summary.trim() || macroArc?.summary.trim() || "";
    chips.push({
      id: "arc",
      label,
      category: "arc",
      tokens: estimateTokens(summary),
      selected: true,
      source: "arc",
      locked: true,
    });
  }

  const lockedBibleIds = new Set([
    ...linkedCharacterIds,
    ...linkedEventIds,
    ...pinnedWorldIds,
  ]);

  for (const fileId of lockedBibleIds) {
    const file = project.bibleFiles.find((f) => f.id === fileId);
    if (!file) continue;
    const path = filePathLabel(file, project.categories, project.subfolders);
    const cat =
      project.categories.find((c) => c.id === file.categoryId)?.title ?? "기타";
    chips.push({
      id: file.id,
      label: `${path} · ${file.title}`,
      category: cat,
      tokens: estimateTokens(file.content),
      selected: true,
      source: "bible",
      locked: true,
    });
  }

  const tail = getPrevChapterTail(
    project.chapters,
    chapterNumber,
    project.settings.prevChapterTailLength
  );
  if (tail) {
    chips.push({
      id: "tail",
      label: "직전 화 말미",
      category: "synopsis",
      tokens: estimateTokens(tail),
      selected: true,
      source: "tail",
    });
  }

  const synopsisText = buildSynopsisContext(project, chapterNumber);
  if (
    project.synopsis.perChapter.length > 0 ||
    project.synopsis.rollups.length > 0
  ) {
    chips.push({
      id: "synopsis",
      label: "줄거리 로그",
      category: "synopsis",
      tokens: estimateTokens(synopsisText),
      selected: true,
      source: "synopsis",
    });
  }

  return chips;
}

export function buildAdditionalInstructionDefault(
  briefing: ChapterBriefing
): string {
  const summary = buildBriefingSummary(briefing);
  if (summary.includes("회차 뼈대에")) return "";
  return "";
}
