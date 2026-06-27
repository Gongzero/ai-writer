import type { Chapter, ProjectData } from "./types";

export function nextChapterNumber(chapters: Chapter[]): number {
  if (chapters.length === 0) return 1;
  return Math.max(...chapters.map((c) => c.number)) + 1;
}

export function createChapter(
  chapters: Chapter[],
  options?: { title?: string; instruction?: string }
): Chapter {
  const now = new Date().toISOString();
  const number = nextChapterNumber(chapters);
  const title = options?.title?.trim() || `${number}화`;
  const instruction = options?.instruction?.trim();
  return {
    id: `ch-${Date.now().toString(36)}`,
    number,
    title,
    outline: "",
    content: "",
    ...(instruction ? { instruction } : {}),
    versions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateChapterInProject(
  project: ProjectData,
  chapterId: string,
  patch: Partial<Pick<Chapter, "title" | "outline" | "content" | "instruction">>
): ProjectData {
  return {
    ...project,
    chapters: project.chapters.map((ch) =>
      ch.id === chapterId
        ? { ...ch, ...patch, updatedAt: new Date().toISOString() }
        : ch
    ),
  };
}

export function addChapterToProject(
  project: ProjectData,
  options?: { title?: string; instruction?: string }
): { project: ProjectData; chapter: Chapter } {
  const chapter = createChapter(project.chapters, options);
  return {
    project: { ...project, chapters: [...project.chapters, chapter] },
    chapter,
  };
}

export function deleteChapterFromProject(
  project: ProjectData,
  chapterId: string
): ProjectData {
  const remaining = project.chapters
    .filter((ch) => ch.id !== chapterId)
    .sort((a, b) => a.number - b.number)
    .map((ch, index) => {
      const number = index + 1;
      if (ch.number === number) return ch;
      return { ...ch, number, updatedAt: new Date().toISOString() };
    });

  return { ...project, chapters: remaining };
}
