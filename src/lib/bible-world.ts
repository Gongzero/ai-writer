import type { BibleCategory, BibleFile } from "./types";

const TOPIC_PREFIX = "주제:";

export interface WorldBibleFields {
  name: string;
  topic: string;
  description: string;
}

export function isWorldCategory(
  file: BibleFile,
  categories: BibleCategory[]
): boolean {
  const cat = categories.find((c) => c.id === file.categoryId);
  return cat?.id === "world" || cat?.title === "세계관";
}

export function getWorldBibleFiles(
  bibleFiles: BibleFile[],
  categories: BibleCategory[]
): BibleFile[] {
  return bibleFiles.filter((f) => isWorldCategory(f, categories));
}

export function findWorldCategoryId(categories: BibleCategory[]): string | null {
  const cat = categories.find((c) => c.id === "world" || c.title === "세계관");
  return cat?.id ?? null;
}

export function parseWorldContent(file: BibleFile): WorldBibleFields {
  const trimmed = file.content.trim();
  if (!trimmed) {
    return { name: file.title, topic: "", description: "" };
  }

  const lines = trimmed.split("\n");
  const first = lines[0]?.trim() ?? "";

  if (first.startsWith(TOPIC_PREFIX)) {
    const topic = first.slice(TOPIC_PREFIX.length).trim();
    const body = lines.slice(1).join("\n").replace(/^\n+/, "");
    return {
      name: file.title,
      topic,
      description: body,
    };
  }

  // 이전 형식: title = 주제, content = 설명
  return {
    name: "",
    topic: file.title,
    description: file.content,
  };
}

export function serializeWorldContent(topic: string, description: string): string {
  const topicTrimmed = topic.trim();
  if (!topicTrimmed) return description;
  if (!description.trim()) return `${TOPIC_PREFIX} ${topicTrimmed}`;
  return `${TOPIC_PREFIX} ${topicTrimmed}\n\n${description}`;
}

export function composeWorldContentForSave(
  name: string,
  topic: string,
  description: string
): { title: string; content: string } {
  return {
    title: name.trim(),
    content: serializeWorldContent(topic, description),
  };
}
