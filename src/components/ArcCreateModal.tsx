"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalShell } from "@/components/home/ModalShell";
import { ReadinessCallout } from "@/components/ui/ReadinessCallout";
import { TossSelect, TossSelectProvider } from "@/components/ui/TossSelect";
import type { TossSelectOption } from "@/components/ui/toss-select-context";
import {
  MACRO_ARC_STAGE_OPTIONS,
  hasMacroArcStage,
  validateArcChapterRange,
} from "@/lib/arc-stages";
import { evaluateProjectReadiness } from "@/lib/readiness";
import type { ArcBlock, MacroArcStage, ProjectData, SidebarTab } from "@/lib/types";
import type { CreateArcInput } from "@/lib/arc";

interface ArcCreateModalProps {
  open: boolean;
  arcs: ArcBlock[];
  project: ProjectData;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateArcInput) => void;
  onNavigateTab?: (tab: SidebarTab) => void;
}

function parseChapterField(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

function buildStageOptions(arcs: ArcBlock[]): TossSelectOption[] {
  return MACRO_ARC_STAGE_OPTIONS.map((option) => {
    const taken = option.single && hasMacroArcStage(arcs, option.id);
    const entry: TossSelectOption = {
      id: option.id,
      label: option.label,
    };

    if (option.single) {
      if (taken) {
        entry.disabled = true;
        entry.chip = { label: "생성완료", tone: "done" };
      } else {
        entry.chip = { label: "최초 1회 생성 가능", tone: "info" };
      }
    }

    return entry;
  });
}

export function ArcCreateModal({
  open,
  arcs,
  project,
  busy = false,
  onClose,
  onSubmit,
  onNavigateTab,
}: ArcCreateModalProps) {
  const [stage, setStage] = useState("");
  const [title, setTitle] = useState("");
  const [fromChapter, setFromChapter] = useState("");
  const [toChapter, setToChapter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stageOptions = useMemo(() => buildStageOptions(arcs), [arcs]);

  const projectReadiness = useMemo(
    () =>
      evaluateProjectReadiness(project).filter(
        (entry) => entry.id === "concept" || entry.id === "bible"
      ),
    [project]
  );

  const handleNavigate = (tab: SidebarTab) => {
    onClose();
    onNavigateTab?.(tab);
  };

  useEffect(() => {
    if (!open) return;
    setStage("");
    setTitle("");
    setFromChapter("");
    setToChapter("");
    setError(null);
  }, [open]);

  const from = parseChapterField(fromChapter);
  const to = parseChapterField(toChapter);
  const selectedStage = stage as MacroArcStage | "";

  const validationError = useMemo(() => {
    if (!selectedStage || !title.trim()) return null;
    if (selectedStage !== "macro-rising" && hasMacroArcStage(arcs, selectedStage)) {
      return "이 단계는 이미 추가되어 있어요.";
    }
    return validateArcChapterRange(arcs, from, to);
  }, [arcs, from, selectedStage, title, to]);

  const handleSubmit = () => {
    if (busy) return;
    if (!selectedStage) {
      setError("단계를 선택해 주세요.");
      return;
    }
    if (!title.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (selectedStage !== "macro-rising" && hasMacroArcStage(arcs, selectedStage)) {
      setError("이 단계는 이미 추가되어 있어요.");
      return;
    }
    const rangeError = validateArcChapterRange(arcs, from, to);
    if (rangeError) {
      setError(rangeError);
      return;
    }
    setError(null);
    onSubmit({
      stage: selectedStage,
      title: title.trim(),
      fromChapter: from,
      toChapter: to,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      kind="prompt"
      title="아크 추가"
      description="작품의 큰 흐름 단계를 추가해요."
      footer={
        <button
          type="button"
          disabled={
            !selectedStage ||
            !title.trim() ||
            busy ||
            (selectedStage !== "macro-rising" &&
              hasMacroArcStage(arcs, selectedStage)) ||
            Boolean(validationError)
          }
          onClick={handleSubmit}
          className="toss-btn-primary w-full py-4 text-[17px] disabled:opacity-40"
        >
          {busy ? "추가 중…" : "추가"}
        </button>
      }
    >
      <TossSelectProvider>
        <div className="toss-modal-form">
        <ReadinessCallout
          items={projectReadiness}
          onNavigate={onNavigateTab ? handleNavigate : undefined}
        />

        <div className="toss-modal-form-field">
          <span className="toss-field-label">단계</span>
          <TossSelect
              label="단계"
              value={stage}
              allowEmpty
              placeholder="단계를 선택해주세요"
              options={stageOptions}
              onChange={(value) => {
                setStage(value);
                setError(null);
              }}
            />
        </div>

        <label className="toss-modal-form-field">
          <span className="toss-field-label">이름</span>
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
            placeholder="예: 입문기"
            className="toss-input"
          />
        </label>

        <div className="toss-modal-form-row">
          <label className="toss-modal-form-field">
            <span className="toss-field-label">시작 회차</span>
            <input
              type="number"
              min={1}
              value={fromChapter}
              onChange={(e) => {
                setFromChapter(e.target.value);
                setError(null);
              }}
              placeholder="선택"
              className="toss-input"
            />
          </label>
          <label className="toss-modal-form-field">
            <span className="toss-field-label">종료 회차</span>
            <input
              type="number"
              min={1}
              value={toChapter}
              onChange={(e) => {
                setToChapter(e.target.value);
                setError(null);
              }}
              placeholder="선택"
              className="toss-input"
            />
          </label>
        </div>

        {error ? <p className="toss-modal-form-error">{error}</p> : null}
        {!error && validationError ? (
          <p className="toss-modal-form-error">{validationError}</p>
        ) : null}
        </div>
      </TossSelectProvider>
    </ModalShell>
  );
}
