import { ensureIdList } from "@/lib/arc-bible-links";
import { getCharacterBibleFiles } from "@/lib/bible-character";
import { getEventBibleFiles } from "@/lib/bible-event";
import { getWorldBibleFiles } from "@/lib/bible-world";
import {
  buildChapterBriefing,
  type ChapterBriefing,
} from "@/lib/chapter-briefing";
import type { ArcBlock, MicroArcBlock, ProjectData, SidebarTab } from "@/lib/types";
import { isConceptFoundationReady } from "@/lib/types";

export type ReadinessStatus = "ok" | "warn" | "missing";

export interface ReadinessCta {
  label: string;
  target: SidebarTab;
}

export interface ReadinessItem {
  id: string;
  label: string;
  status: ReadinessStatus;
  hint?: string;
  cta?: ReadinessCta;
}

export type AiReadinessAction = "open-write" | "outline" | "body";

const AI_ITEM_IDS: Record<AiReadinessAction, string[]> = {
  "open-write": [
    "concept",
    "macro-arc",
    "arc-summary",
    "micro-position",
    "linked-bible",
    "pinned-world",
  ],
  outline: [
    "concept",
    "macro-arc",
    "arc-summary",
    "micro-position",
    "linked-bible",
    "pinned-world",
  ],
  body: [
    "concept",
    "macro-arc",
    "arc-summary",
    "micro-position",
    "linked-bible",
    "pinned-world",
    "outline",
  ],
};

function item(
  id: string,
  label: string,
  status: ReadinessStatus,
  hint?: string,
  cta?: ReadinessCta
): ReadinessItem {
  return { id, label, status, hint, cta };
}

function hasChapterRange(
  from?: number,
  to?: number
): "ok" | "warn" | "missing" {
  if (from != null && to != null) return "ok";
  if (from != null || to != null) return "warn";
  return "missing";
}

function bibleMissingParts(
  characters: number,
  world: number,
  events: number
): string[] {
  const parts: string[] = [];
  if (characters === 0) parts.push("인물");
  if (world === 0) parts.push("세계관");
  if (events === 0) parts.push("사건");
  return parts;
}

/** 작품 전체 — 4단계 */
export function evaluateProjectReadiness(project: ProjectData): ReadinessItem[] {
  const { settings, bibleFiles, categories, arcOutline, chapters } = project;
  const characters = getCharacterBibleFiles(bibleFiles, categories);
  const world = getWorldBibleFiles(bibleFiles, categories);
  const events = getEventBibleFiles(bibleFiles, categories);

  const conceptOk =
    isConceptFoundationReady(settings) || Boolean(settings.styleGuide?.trim());

  const missingBible = bibleMissingParts(
    characters.length,
    world.length,
    events.length
  );
  const bibleOk = missingBible.length === 0;
  const bibleStarted = bibleFiles.length > 0;

  return [
    item(
      "concept",
      "컨셉",
      conceptOk ? "ok" : "warn",
      conceptOk ? undefined : "장르·타겟 입력",
      conceptOk ? undefined : { label: "컨셉", target: "concept" }
    ),
    item(
      "bible",
      "바이블",
      bibleOk ? "ok" : bibleStarted ? "warn" : "warn",
      bibleOk ? undefined : `${missingBible.join(" · ")} 추가`,
      bibleOk ? undefined : { label: "바이블", target: "bible" }
    ),
    item(
      "arc",
      "회차 뼈대",
      arcOutline.length > 0 ? "ok" : "warn",
      arcOutline.length > 0 ? undefined : "아크 추가",
      arcOutline.length > 0 ? undefined : { label: "회차 뼈대", target: "arc" }
    ),
    item(
      "chapters",
      "원고",
      chapters.length > 0 ? "ok" : "warn",
      chapters.length > 0 ? undefined : "화 추가",
      chapters.length > 0 ? undefined : { label: "원고", target: "chapters" }
    ),
  ];
}

/** 탭 진입 전 안내 — 아크 추가 모달과 동일한 콜아웃 패턴 */
export type PrerequisiteCase = "needs-bible" | "needs-arc";

export interface PrerequisiteGuide {
  case: PrerequisiteCase;
  target: SidebarTab;
  title: string;
  description: string;
  callout: string;
  actionLabel: string;
}

/** @deprecated PrerequisiteGuide */
export type ChaptersPrerequisiteGuide = PrerequisiteGuide;

export function getArcPrerequisiteGuide(
  project: ProjectData
): PrerequisiteGuide | null {
  if (project.bibleFiles.length > 0) return null;

  return {
    case: "needs-bible",
    target: "bible",
    title: "회차 뼈대",
    description: "회차 뼈대를 잡으려면 바이블부터 채워주세요.",
    callout: "인물 · 세계관 · 사건 추가",
    actionLabel: "바이블로 이동",
  };
}

export function getChaptersPrerequisiteGuide(
  project: ProjectData
): PrerequisiteGuide | null {
  const hasBible = project.bibleFiles.length > 0;
  const hasArc = project.arcOutline.length > 0;

  if (!hasBible) {
    return {
      case: "needs-bible",
      target: "bible",
      title: "원고",
      description: "집필을 시작하려면 바이블부터 채워주세요.",
      callout: "인물 · 세계관 · 사건 추가",
      actionLabel: "바이블로 이동",
    };
  }
  if (!hasArc) {
    return {
      case: "needs-arc",
      target: "arc",
      title: "원고",
      description: "화를 쓰려면 회차 뼈대가 필요해요.",
      callout: "대발단 · 전개 등 아크 추가",
      actionLabel: "회차 뼈대로 이동",
    };
  }
  return null;
}

export function evaluateArcReadiness(
  arc: ArcBlock,
  project: ProjectData
): ReadinessItem[] {
  const { bibleFiles, categories } = project;
  const characters = getCharacterBibleFiles(bibleFiles, categories);
  const events = getEventBibleFiles(bibleFiles, categories);
  const rangeStatus = hasChapterRange(arc.fromChapter, arc.toChapter);
  const hasSummary = Boolean(arc.summary.trim());
  const linkedChars = ensureIdList(arc.characterIds).length;
  const linkedEvents = ensureIdList(arc.eventIds).length;
  const microCount = arc.microOutline?.length ?? 0;

  const items: ReadinessItem[] = [
    item(
      "arc-range",
      "회차 범위",
      rangeStatus,
      rangeStatus === "ok" ? undefined : "시작·종료 입력"
    ),
    item(
      "arc-summary",
      "줄거리",
      hasSummary ? "ok" : "warn",
      hasSummary ? undefined : "요약 작성"
    ),
  ];

  if (characters.length > 0) {
    items.push(
      item(
        "arc-characters",
        "인물 연결",
        linkedChars > 0 ? "ok" : "warn",
        linkedChars > 0 ? undefined : "아래에서 선택"
      )
    );
  }

  if (events.length > 0) {
    items.push(
      item(
        "arc-events",
        "사건 연결",
        linkedEvents > 0 ? "ok" : "warn",
        linkedEvents > 0 ? undefined : "아래에서 선택"
      )
    );
  }

  items.push(
    item(
      "arc-micro",
      "소아크",
      microCount > 0 ? "ok" : "warn",
      microCount > 0 ? undefined : "왼쪽 목록에서 추가"
    )
  );

  return items;
}

export function evaluateMicroArcReadiness(
  microArc: MicroArcBlock,
  project: ProjectData
): ReadinessItem[] {
  const { bibleFiles, categories } = project;
  const characters = getCharacterBibleFiles(bibleFiles, categories);
  const events = getEventBibleFiles(bibleFiles, categories);
  const rangeStatus = hasChapterRange(microArc.fromChapter, microArc.toChapter);
  const hasSummary = Boolean(microArc.summary.trim());
  const linkedChars = ensureIdList(microArc.characterIds).length;
  const linkedEvents = ensureIdList(microArc.eventIds).length;

  const items: ReadinessItem[] = [
    item(
      "micro-range",
      "회차 범위",
      rangeStatus,
      rangeStatus === "ok" ? undefined : "시작·종료 입력"
    ),
    item(
      "micro-summary",
      "줄거리",
      hasSummary ? "ok" : "warn",
      hasSummary ? undefined : "요약 작성"
    ),
  ];

  if (characters.length > 0) {
    items.push(
      item(
        "micro-characters",
        "인물 연결",
        linkedChars > 0 ? "ok" : "warn",
        linkedChars > 0 ? undefined : "아래에서 선택"
      )
    );
  }

  if (events.length > 0) {
    items.push(
      item(
        "micro-events",
        "사건 연결",
        linkedEvents > 0 ? "ok" : "warn",
        linkedEvents > 0 ? undefined : "아래에서 선택"
      )
    );
  }

  return items;
}

export function evaluateChapterReadiness(
  project: ProjectData,
  briefing: ChapterBriefing,
  outline?: string
): ReadinessItem[] {
  const { settings, bibleFiles, categories } = project;
  const characters = getCharacterBibleFiles(bibleFiles, categories);
  const world = getWorldBibleFiles(bibleFiles, categories);
  const events = getEventBibleFiles(bibleFiles, categories);

  const conceptOk =
    isConceptFoundationReady(settings) || Boolean(settings.styleGuide?.trim());

  const macroArc = briefing.macroArc;
  const microArc = briefing.microArc;
  const hasMacro = Boolean(macroArc);
  const hasSummary = Boolean(
    microArc?.summary.trim() || macroArc?.summary.trim()
  );

  let microStatus: ReadinessStatus = "warn";
  let microHint: string | undefined = "소아크 추가";
  if (briefing.microPosition) {
    microStatus = "ok";
    microHint = undefined;
  } else if (microArc && !briefing.microPosition) {
    microStatus = "warn";
    microHint = "회차 범위 확인";
  } else if (!hasMacro) {
    microStatus = "missing";
    microHint = "아크 없음";
  }

  const linkedCount =
    briefing.linkedCharacterIds.length + briefing.linkedEventIds.length;
  let linkedStatus: ReadinessStatus = "ok";
  let linkedHint: string | undefined;
  if (linkedCount === 0) {
    linkedStatus = "warn";
    linkedHint =
      characters.length + events.length > 0 ? "아크에서 연결" : "바이블·아크 설정";
  }

  let worldStatus: ReadinessStatus = "ok";
  let worldHint: string | undefined;
  if (world.length > 0 && briefing.pinnedWorldIds.length === 0) {
    worldStatus = "warn";
    worldHint = "아래에서 선택";
  } else if (world.length === 0) {
    worldStatus = "warn";
    worldHint = "바이블에 추가";
  }

  const outlineTrimmed = outline?.trim() ?? "";

  return [
    item(
      "concept",
      "컨셉",
      conceptOk ? "ok" : "warn",
      conceptOk ? undefined : "기본 설정",
      conceptOk ? undefined : { label: "컨셉", target: "concept" }
    ),
    item(
      "macro-arc",
      "회차 뼈대",
      hasMacro ? "ok" : "missing",
      hasMacro ? undefined : `${briefing.chapterNumber}화 범위 없음`,
      hasMacro ? undefined : { label: "회차 뼈대", target: "arc" }
    ),
    item(
      "micro-position",
      "소아크",
      microStatus,
      microHint,
      microStatus !== "ok" ? { label: "회차 뼈대", target: "arc" } : undefined
    ),
    item(
      "arc-summary",
      "줄거리",
      hasSummary ? "ok" : hasMacro ? "warn" : "missing",
      hasSummary ? undefined : "요약 작성"
    ),
    item(
      "linked-bible",
      "바이블 연결",
      linkedStatus,
      linkedHint,
      linkedStatus !== "ok" ? { label: "회차 뼈대", target: "arc" } : undefined
    ),
    item(
      "pinned-world",
      "고정 세계관",
      worldStatus,
      worldHint,
      worldStatus !== "ok" ? { label: "바이블", target: "bible" } : undefined
    ),
    item(
      "outline",
      "아웃라인",
      outlineTrimmed ? "ok" : "warn",
      outlineTrimmed ? undefined : "본문 생성 전 필요"
    ),
  ];
}

export function getAiWarnings(
  project: ProjectData,
  chapterNumber: number,
  action: AiReadinessAction,
  outline?: string
): ReadinessItem[] {
  const briefing = buildChapterBriefing(project, chapterNumber);
  const items = evaluateChapterReadiness(project, briefing, outline);
  const ids = new Set(AI_ITEM_IDS[action]);
  return items.filter((entry) => ids.has(entry.id) && entry.status !== "ok");
}

export function readinessSummary(items: ReadinessItem[]): {
  ok: number;
  warn: number;
  missing: number;
} {
  return items.reduce(
    (acc, entry) => {
      acc[entry.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, missing: 0 }
  );
}

export function getPendingReadinessItems(
  items: ReadinessItem[]
): ReadinessItem[] {
  return items.filter((entry) => entry.status !== "ok");
}

/** 모달 콜아웃용 — missing 우선, 없으면 첫 warn */
export function getPrimaryReadinessIssue(
  items: ReadinessItem[]
): ReadinessItem | null {
  const pending = getPendingReadinessItems(items);
  if (pending.length === 0) return null;
  return pending.find((entry) => entry.status === "missing") ?? pending[0];
}
