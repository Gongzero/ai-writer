"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalShell } from "@/components/home/ModalShell";
import { ReadinessCallout } from "@/components/ui/ReadinessCallout";
import { buildChapterBriefing } from "@/lib/chapter-briefing";
import { nextChapterNumber } from "@/lib/chapters";
import { formatArcChapterRange } from "@/lib/arc-stages";
import {
  formatMicroArcChapterRange,
  microArcStageLabel,
} from "@/lib/micro-arc-stages";
import { evaluateChapterReadiness } from "@/lib/readiness";
import type { Chapter, ProjectData, SidebarTab } from "@/lib/types";

export interface CreateChapterInput {
  title: string;
  instruction: string;
}

interface ChapterCreateModalProps {
  open: boolean;
  chapters: Chapter[];
  project: ProjectData;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateChapterInput) => void;
  onNavigateTab?: (tab: SidebarTab) => void;
}

export function ChapterCreateModal({
  open,
  chapters,
  project,
  busy = false,
  onClose,
  onSubmit,
  onNavigateTab,
}: ChapterCreateModalProps) {
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  const nextNumber = useMemo(() => nextChapterNumber(chapters), [chapters]);

  const briefing = useMemo(
    () => buildChapterBriefing(project, nextNumber),
    [project, nextNumber]
  );

  const chapterReadiness = useMemo(
    () => evaluateChapterReadiness(project, briefing),
    [briefing, project]
  );

  const handleNavigate = (tab: SidebarTab) => {
    onClose();
    onNavigateTab?.(tab);
  };

  useEffect(() => {
    if (!open) return;
    setTitle(`${nextNumber}화`);
    setInstruction("");
    setError(null);
  }, [open, nextNumber]);

  const handleSubmit = () => {
    if (busy) return;
    if (!title.trim()) {
      setError("화 제목을 입력해 주세요.");
      return;
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      instruction: instruction.trim(),
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      kind="prompt"
      title="화 추가"
      description={`${nextNumber}화 원고를 새로 만들어요.`}
      footer={
        <button
          type="button"
          disabled={!title.trim() || busy}
          onClick={handleSubmit}
          className="toss-btn-primary w-full py-4 text-[17px] disabled:opacity-40"
        >
          {busy ? "추가 중…" : "추가"}
        </button>
      }
    >
      <div className="toss-modal-form">
        <ReadinessCallout
          items={chapterReadiness}
          onNavigate={onNavigateTab ? handleNavigate : undefined}
          excludeIds={["outline"]}
        />

        {briefing.macroArc ? (
          <div className="toss-modal-form-note">
            <p className="toss-modal-form-note-label">이번 화 위치</p>
            <p className="toss-modal-form-note-value">
              {briefing.macroArc.title}
              {briefing.microArc
                ? ` · ${briefing.microArc.title}`
                : ""}
            </p>
            <p className="toss-modal-form-note-meta">
              {formatArcChapterRange(briefing.macroArc)}
              {briefing.microArc
                ? ` · ${formatMicroArcChapterRange(briefing.microArc)}`
                : ""}
              {briefing.microArc
                ? ` · ${microArcStageLabel(briefing.microArc.stage)}`
                : ""}
            </p>
          </div>
        ) : null}

        <label className="toss-modal-form-field">
          <span className="toss-field-label">화 제목</span>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onClose();
            }}
            placeholder={`예: ${nextNumber}화`}
            className="toss-input"
          />
        </label>

        <label className="toss-modal-form-field">
          <span className="toss-field-label">추가 지시 (선택)</span>
          <textarea
            value={instruction}
            onChange={(e) => {
              setInstruction(e.target.value);
              setError(null);
            }}
            rows={3}
            placeholder="예: 이번 화는 긴장감 위주, 대사는 짧게"
            className="toss-textarea"
          />
        </label>

        {error ? <p className="toss-modal-form-error">{error}</p> : null}
      </div>
    </ModalShell>
  );
}
