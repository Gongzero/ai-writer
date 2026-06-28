import { displayNovelTitle } from "@/lib/project-title";
import type { ProjectData } from "@/lib/types";

export function projectExportFilename(title: string): string {
  const base =
    displayNovelTitle(title)
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 48) || "novel";
  const date = new Date().toISOString().slice(0, 10);
  return `${base}-${date}.json`;
}

export function serializeProject(project: ProjectData): string {
  return JSON.stringify(project, null, 2);
}

export function downloadProjectJson(project: ProjectData): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = projectExportFilename(project.meta.title);
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<string> {
  if (
    !file.name.toLowerCase().endsWith(".json") &&
    file.type !== "application/json" &&
    file.type !== ""
  ) {
    throw new Error("JSON 파일만 가져올 수 있어요.");
  }
  return file.text();
}
