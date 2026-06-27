export function displayNovelTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed || trimmed === "새 작품") return "제목 없는 소설";
  return trimmed;
}
