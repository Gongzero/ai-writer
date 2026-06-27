import type { BibleCategory, BibleFile } from "./types";

const GENDER_PREFIX = "성별:";
const DEBUT_PREFIX = "등장 회차:";
const EXIT_PREFIX = "퇴장 회차:";

export interface CharacterBibleFields {
  gender: string;
  debutChapter: string;
  exitChapter: string;
  settings: string;
}

const EMPTY_CHARACTER_FIELDS: CharacterBibleFields = {
  gender: "",
  debutChapter: "",
  exitChapter: "",
  settings: "",
};

function isMetaLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith(GENDER_PREFIX) ||
    trimmed.startsWith(DEBUT_PREFIX) ||
    trimmed.startsWith(EXIT_PREFIX)
  );
}

export function isCharacterCategory(
  file: BibleFile,
  categories: BibleCategory[]
): boolean {
  const cat = categories.find((c) => c.id === file.categoryId);
  return cat?.id === "characters" || cat?.title === "인물";
}

export function getCharacterBibleFiles(
  bibleFiles: BibleFile[],
  categories: BibleCategory[]
): BibleFile[] {
  const characterCategoryIds = new Set(
    categories
      .filter((c) => c.id === "characters" || c.title === "인물")
      .map((c) => c.id)
  );
  return bibleFiles.filter((f) => characterCategoryIds.has(f.categoryId));
}

export function findCharactersCategoryId(categories: BibleCategory[]): string | null {
  const cat = categories.find((c) => c.id === "characters" || c.title === "인물");
  return cat?.id ?? null;
}

export function parseCharacterContent(content: string): CharacterBibleFields {
  const trimmed = content.trim();
  if (!trimmed) return { ...EMPTY_CHARACTER_FIELDS };

  const lines = trimmed.split("\n");
  if (!isMetaLine(lines[0] ?? "")) {
    return { ...EMPTY_CHARACTER_FIELDS, settings: content };
  }

  const fields: CharacterBibleFields = { ...EMPTY_CHARACTER_FIELDS };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (!isMetaLine(line)) break;

    if (line.startsWith(GENDER_PREFIX)) {
      fields.gender = line.slice(GENDER_PREFIX.length).trim();
    } else if (line.startsWith(DEBUT_PREFIX)) {
      fields.debutChapter = line.slice(DEBUT_PREFIX.length).trim();
    } else if (line.startsWith(EXIT_PREFIX)) {
      fields.exitChapter = line.slice(EXIT_PREFIX.length).trim();
    }
    i += 1;
  }

  while (i < lines.length && !lines[i].trim()) i += 1;
  fields.settings = lines.slice(i).join("\n");

  return fields;
}

export function serializeCharacterContent(fields: CharacterBibleFields): string {
  const meta: string[] = [];
  const gender = fields.gender.trim();
  const debutChapter = fields.debutChapter.trim();
  const exitChapter = fields.exitChapter.trim();

  if (gender) meta.push(`${GENDER_PREFIX} ${gender}`);
  if (debutChapter) meta.push(`${DEBUT_PREFIX} ${debutChapter}`);
  if (exitChapter) meta.push(`${EXIT_PREFIX} ${exitChapter}`);

  const settings = fields.settings;
  if (meta.length === 0) return settings;
  if (!settings.trim()) return meta.join("\n");
  return `${meta.join("\n")}\n\n${settings}`;
}

export function composeCharacterContentForSave(
  name: string,
  fields: Omit<CharacterBibleFields, "settings"> & { settings: string }
): { title: string; content: string } {
  return {
    title: name.trim(),
    content: serializeCharacterContent(fields),
  };
}
