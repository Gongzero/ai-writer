import { uid } from "./ids";
import type {
  BibleCategory,
  BibleFile,
  BibleSubfolder,
  ProjectData,
} from "./types";

export function addCategoryToProject(
  project: ProjectData,
  title: string
): { project: ProjectData; category: BibleCategory } {
  const category: BibleCategory = { id: uid("cat"), title: title.trim() };
  return {
    project: { ...project, categories: [...project.categories, category] },
    category,
  };
}

export function addSubfolderToProject(
  project: ProjectData,
  categoryId: string,
  title: string
): { project: ProjectData; subfolder: BibleSubfolder } {
  const subfolder: BibleSubfolder = {
    id: uid("sf"),
    categoryId,
    title: title.trim(),
  };
  return {
    project: { ...project, subfolders: [...project.subfolders, subfolder] },
    subfolder,
  };
}

export function addBibleFileToProject(
  project: ProjectData,
  categoryId: string,
  subfolderId: string | null,
  title: string
): { project: ProjectData; file: BibleFile } {
  const file: BibleFile = {
    id: uid("f"),
    categoryId,
    subfolderId,
    title: title.trim(),
    content: "",
  };
  return {
    project: { ...project, bibleFiles: [...project.bibleFiles, file] },
    file,
  };
}

export function updateBibleFileInProject(
  project: ProjectData,
  fileId: string,
  patch: Partial<Pick<BibleFile, "title" | "content">>
): ProjectData {
  return {
    ...project,
    bibleFiles: project.bibleFiles.map((f) =>
      f.id === fileId ? { ...f, ...patch } : f
    ),
  };
}

export function deleteBibleFileFromProject(
  project: ProjectData,
  fileId: string
): ProjectData {
  return {
    ...project,
    bibleFiles: project.bibleFiles.filter((f) => f.id !== fileId),
  };
}

export function deleteSubfolderFromProject(
  project: ProjectData,
  subfolderId: string
): ProjectData {
  return {
    ...project,
    subfolders: project.subfolders.filter((s) => s.id !== subfolderId),
    bibleFiles: project.bibleFiles.filter((f) => f.subfolderId !== subfolderId),
  };
}

export function filePathLabel(
  file: BibleFile,
  categories: BibleCategory[],
  subfolders: BibleSubfolder[]
): string {
  const cat = categories.find((c) => c.id === file.categoryId)?.title ?? "기타";
  if (!file.subfolderId) return cat;
  const sub = subfolders.find((s) => s.id === file.subfolderId);
  return sub ? `${cat}/${sub.title}` : cat;
}
