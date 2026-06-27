import type { BibleCategory, BibleFile } from "./types";

const BACKGROUND_PREFIX = "배경:";
const START_PREFIX = "시작 회차:";
const END_PREFIX = "종료 회차:";
const CHARACTERS_PREFIX = "등장 인물:";

export interface EventBibleFields {
  name: string;
  background: string;
  startChapter: string;
  endChapter: string;
  characterIds: string[];
  settings: string;
}

const EMPTY_EVENT_FIELDS: EventBibleFields = {
  name: "",
  background: "",
  startChapter: "",
  endChapter: "",
  characterIds: [],
  settings: "",
};

function isMetaLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith(BACKGROUND_PREFIX) ||
    trimmed.startsWith(START_PREFIX) ||
    trimmed.startsWith(END_PREFIX) ||
    trimmed.startsWith(CHARACTERS_PREFIX)
  );
}

export function isEventCategory(
  file: BibleFile,
  categories: BibleCategory[]
): boolean {
  const cat = categories.find((c) => c.id === file.categoryId);
  return cat?.id === "events" || cat?.title === "사건";
}

export function getEventBibleFiles(
  bibleFiles: BibleFile[],
  categories: BibleCategory[]
): BibleFile[] {
  const eventCategoryIds = new Set(
    categories
      .filter((c) => c.id === "events" || c.title === "사건")
      .map((c) => c.id)
  );
  return bibleFiles.filter((f) => eventCategoryIds.has(f.categoryId));
}

export function findEventsCategoryId(categories: BibleCategory[]): string | null {
  const cat = categories.find((c) => c.id === "events" || c.title === "사건");
  return cat?.id ?? null;
}

function parseCharacterIds(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function parseEventContent(file: BibleFile): EventBibleFields {
  const trimmed = file.content.trim();
  if (!trimmed) {
    return { ...EMPTY_EVENT_FIELDS, name: file.title };
  }

  const lines = trimmed.split("\n");
  if (!isMetaLine(lines[0] ?? "")) {
    return {
      ...EMPTY_EVENT_FIELDS,
      name: file.title,
      settings: file.content,
    };
  }

  const fields: EventBibleFields = { ...EMPTY_EVENT_FIELDS, name: file.title };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (!isMetaLine(line)) break;

    if (line.startsWith(BACKGROUND_PREFIX)) {
      fields.background = line.slice(BACKGROUND_PREFIX.length).trim();
    } else if (line.startsWith(START_PREFIX)) {
      fields.startChapter = line.slice(START_PREFIX.length).trim();
    } else if (line.startsWith(END_PREFIX)) {
      fields.endChapter = line.slice(END_PREFIX.length).trim();
    } else if (line.startsWith(CHARACTERS_PREFIX)) {
      fields.characterIds = parseCharacterIds(
        line.slice(CHARACTERS_PREFIX.length)
      );
    }
    i += 1;
  }

  while (i < lines.length && !lines[i].trim()) i += 1;
  fields.settings = lines.slice(i).join("\n");

  return fields;
}

export function serializeEventContent(
  fields: Omit<EventBibleFields, "name">
): string {
  const meta: string[] = [];
  const background = fields.background.trim();
  const startChapter = fields.startChapter.trim();
  const endChapter = fields.endChapter.trim();
  const characterIds = fields.characterIds.filter(Boolean);

  if (background) meta.push(`${BACKGROUND_PREFIX} ${background}`);
  if (startChapter) meta.push(`${START_PREFIX} ${startChapter}`);
  if (endChapter) meta.push(`${END_PREFIX} ${endChapter}`);
  if (characterIds.length > 0) {
    meta.push(`${CHARACTERS_PREFIX} ${characterIds.join(", ")}`);
  }

  const settings = fields.settings;
  if (meta.length === 0) return settings;
  if (!settings.trim()) return meta.join("\n");
  return `${meta.join("\n")}\n\n${settings}`;
}

export function composeEventContentForSave(
  name: string,
  fields: Omit<EventBibleFields, "name">
): { title: string; content: string } {
  return {
    title: name.trim(),
    content: serializeEventContent(fields),
  };
}
