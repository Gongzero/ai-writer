import { filePathLabel } from "./bible";
import { formatArcChapterRange } from "./arc-stages";
import { buildChapterBriefing } from "./chapter-briefing";
import { formatMicroArcChapterRange, microArcStageLabel } from "./micro-arc-stages";
import type {
  ArcBlock,
  BibleCategory,
  BibleFile,
  Chapter,
  ProjectData,
} from "./types";

export interface ContextChip {
  id: string;
  label: string;
  category: string;
  tokens: number;
  selected: boolean;
  source: "bible" | "synopsis" | "tail" | "arc";
  /** 아크 연결·고정 세계관 등 해제 불가 */
  locked?: boolean;
}

export function estimateTokens(text: string): number {
  return Math.max(80, Math.round(text.length / 3));
}

export function getActiveArc(
  chapterNumber: number,
  arcs: ArcBlock[]
): ArcBlock | null {
  return (
    arcs.find(
      (a) =>
        a.fromChapter != null &&
        a.toChapter != null &&
        chapterNumber >= a.fromChapter &&
        chapterNumber <= a.toChapter
    ) ?? null
  );
}

export function getPrevChapterTail(
  chapters: Chapter[],
  currentNumber: number,
  maxLength: number
): string {
  const prev = chapters
    .filter((c) => c.number < currentNumber && c.content.trim())
    .sort((a, b) => b.number - a.number)[0];
  if (!prev) return "";
  const tail = prev.content.slice(-maxLength);
  return `【직전 화(${prev.number}화) 말미】\n${tail}`;
}

export function buildSynopsisContext(
  project: ProjectData,
  chapterNumber: number
): string {
  const { synopsis } = project;
  const parts: string[] = [];

  const rollups = synopsis.rollups
    .filter((r) => r.toChapter < chapterNumber)
    .sort((a, b) => b.toChapter - a.toChapter)
    .slice(0, 2);
  for (const r of rollups) {
    parts.push(`【${r.fromChapter}~${r.toChapter}화 통합 요약】\n${r.content}`);
  }

  const recent = synopsis.perChapter
    .filter((s) => s.chapterNumber < chapterNumber)
    .sort((a, b) => b.chapterNumber - a.chapterNumber)
    .slice(0, 5);
  for (const s of recent) {
    parts.push(`【${s.chapterNumber}화 요약】\n${s.content}`);
  }

  if (parts.length === 0 && chapterNumber > 1) {
    return `【줄거리】 ${chapterNumber}화 이전 요약이 아직 없습니다.`;
  }
  return parts.join("\n\n");
}

export function buildBibleChips(
  project: ProjectData,
  selectedIds?: Set<string>
): ContextChip[] {
  const { bibleFiles, categories, subfolders } = project;
  return bibleFiles.map((f) => {
    const path = filePathLabel(f, categories, subfolders);
    const cat = categories.find((c) => c.id === f.categoryId)?.title ?? "기타";
    return {
      id: f.id,
      label: `${path} · ${f.title}`,
      category: cat,
      tokens: estimateTokens(f.content),
      selected: selectedIds ? selectedIds.has(f.id) : true,
      source: "bible" as const,
    };
  });
}

function scoreFile(
  file: BibleFile,
  categories: BibleCategory[],
  instruction: string
): number {
  const cat = categories.find((c) => c.id === file.categoryId)?.title ?? "";
  const haystack = `${cat} ${file.title} ${file.content}`.toLowerCase();
  const words = instruction
    .toLowerCase()
    .split(/[\s,./·]+/)
    .filter((w) => w.length >= 2);
  let score = 0;
  for (const w of words) {
    if (haystack.includes(w)) score += 2;
  }
  if (file.content.trim()) score += 1;
  return score;
}

/** 키워드 매칭 기반 추천 (API 키 없을 때) */
export function recommendContextHeuristic(
  project: ProjectData,
  instruction: string,
  chapterNumber: number
): ContextChip[] {
  const bibleChips = project.bibleFiles.map((f) => {
    const path = filePathLabel(f, project.categories, project.subfolders);
    const cat =
      project.categories.find((c) => c.id === f.categoryId)?.title ?? "기타";
    const score = scoreFile(f, project.categories, instruction);
    return {
      id: f.id,
      label: `${path} · ${f.title}`,
      category: cat,
      tokens: estimateTokens(f.content),
      selected: false,
      source: "bible" as const,
      score,
    };
  });

  const sorted = [...bibleChips].sort((a, b) => b.score - a.score);
  const pickCount = Math.min(Math.max(2, sorted.length), 6);
  const selectedIds = new Set(
    sorted.slice(0, pickCount).map((c) => c.id)
  );

  const chips: ContextChip[] = sorted.map((item) => {
    const { score, ...chip } = item;
    void score;
    return {
      ...chip,
      selected: selectedIds.has(chip.id),
    };
  });

  const synopsisText = buildSynopsisContext(project, chapterNumber);
  if (project.synopsis.perChapter.length > 0 || project.synopsis.rollups.length > 0) {
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

export function getSelectedContextText(
  project: ProjectData,
  chips: ContextChip[],
  chapterNumber: number
): string {
  const parts: string[] = [];

  const arc = getActiveArc(chapterNumber, project.arcOutline);
  const briefing = buildChapterBriefing(project, chapterNumber);
  const arcChip = chips.find((c) => c.id === "arc" && c.selected);

  if (arcChip) {
    const { microArc } = briefing;
    if (microArc?.summary.trim()) {
      const stage = microArcStageLabel(microArc.stage);
      parts.push(
        `【소아크: ${microArc.title} (${stage}, ${formatMicroArcChapterRange(microArc)})】\n${microArc.summary.trim()}`
      );
      if (briefing.microPosition) {
        const p = briefing.microPosition;
        parts.push(
          `【이번 화 위치】 ${chapterNumber}화 — 소아크 ${p.fromChapter}~${p.toChapter}화 중 ${p.index}/${p.total}번째`
        );
      }
    } else if (arc && arc.summary.trim()) {
      parts.push(
        `【활성 아크: ${arc.title} (${formatArcChapterRange(arc)})】\n${arc.summary}`
      );
    }
  }

  for (const chip of chips.filter((c) => c.selected && c.source === "bible")) {
    const file = project.bibleFiles.find((f) => f.id === chip.id);
    if (file) {
      parts.push(`【${chip.label}】\n${file.content}`);
    }
  }

  if (chips.find((c) => c.id === "synopsis" && c.selected)) {
    const syn = buildSynopsisContext(project, chapterNumber);
    if (syn) parts.push(syn);
  }

  if (chips.find((c) => c.id === "tail" && c.selected)) {
    const tail = getPrevChapterTail(
      project.chapters,
      chapterNumber,
      project.settings.prevChapterTailLength
    );
    if (tail) parts.push(tail);
  }

  return parts.join("\n\n");
}

export function computeUsedTokens(chips: ContextChip[]): number {
  return chips.filter((c) => c.selected).reduce((s, c) => s + c.tokens, 0);
}

export function extractOpenClues(project: ProjectData): string[] {
  const clues: string[] = [];
  for (const f of project.bibleFiles) {
    const cat = project.categories.find((c) => c.id === f.categoryId);
    const sub = f.subfolderId
      ? project.subfolders.find((s) => s.id === f.subfolderId)
      : null;
    const inEvents = cat?.title === "사건" || sub?.title.includes("복선");
    if (!inEvents) continue;
    if (/status:\s*open/i.test(f.content) || f.content.includes("[status: open]")) {
      clues.push(`${f.title}: ${f.content.slice(0, 120)}…`);
    }
  }
  return clues;
}
