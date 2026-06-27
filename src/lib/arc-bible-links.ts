/** 아크·소아크 ↔ 바이블 인물·사건 연결 헬퍼 */

export function ensureIdList(ids?: string[]): string[] {
  return ids?.filter(Boolean) ?? [];
}

export function bibleLinkIdsEqual(a?: string[], b?: string[]): boolean {
  const left = [...ensureIdList(a)].sort();
  const right = [...ensureIdList(b)].sort();
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

/** 삭제된 바이블 파일 ID는 연결에서 제거 */
export function pruneBibleLinkIds(ids: string[], validFileIds: Set<string>): string[] {
  return ensureIdList(ids).filter((id) => validFileIds.has(id));
}
