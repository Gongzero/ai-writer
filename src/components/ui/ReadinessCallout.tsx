"use client";

import { useMemo } from "react";
import {
  getPrimaryReadinessIssue,
  type ReadinessItem,
} from "@/lib/readiness";
import type { SidebarTab } from "@/lib/types";

interface ReadinessCalloutProps {
  items: ReadinessItem[];
  onNavigate?: (target: SidebarTab) => void;
  /** 모달 맥락에서 보여주지 않을 항목 */
  excludeIds?: string[];
}

export function ReadinessCallout({
  items,
  onNavigate,
  excludeIds = [],
}: ReadinessCalloutProps) {
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const visibleItems = useMemo(
    () => items.filter((entry) => !excluded.has(entry.id)),
    [excluded, items]
  );

  const primary = useMemo(
    () => getPrimaryReadinessIssue(visibleItems),
    [visibleItems]
  );

  if (!primary) return null;

  const message =
    primary.hint ?? `${primary.label}을(를) 확인해 주세요.`;
  const tone =
    primary.status === "missing" ? "info" : "neutral";

  return (
    <div
      className={
        tone === "info" ? "toss-callout-info" : "toss-readiness-callout"
      }
    >
      <p>{message}</p>
      {primary.cta && onNavigate ? (
        <button
          type="button"
          className="toss-readiness-callout-link"
          onClick={() => onNavigate(primary.cta!.target)}
        >
          {primary.cta.label}로 이동
        </button>
      ) : null}
    </div>
  );
}
