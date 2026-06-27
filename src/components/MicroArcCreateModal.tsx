"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalShell } from "@/components/home/ModalShell";
import { ReadinessCallout } from "@/components/ui/ReadinessCallout";
import { TossSelect, TossSelectProvider } from "@/components/ui/TossSelect";
import type { TossSelectOption } from "@/components/ui/toss-select-context";
import {
  MICRO_ARC_STAGE_OPTIONS,
  hasMicroArcStage,
  microArcStageLabel,
  validateMicroArcChapterRange,
} from "@/lib/micro-arc-stages";
import { ensureMicroOutline } from "@/lib/micro-arc";
import { evaluateArcReadiness } from "@/lib/readiness";
import type { ArcBlock, MicroArcStage, ProjectData } from "@/lib/types";
import type { CreateMicroArcInput } from "@/lib/micro-arc";

interface MicroArcCreateModalProps {
  open: boolean;
  parentArc: ArcBlock | null;
  project: ProjectData;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMicroArcInput) => void;
}

function parseChapterField(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

function buildStageOptions(microOutline: ReturnType<typeof ensureMicroOutline>): TossSelectOption[] {
  return MICRO_ARC_STAGE_OPTIONS.map((option) => {
    const taken = hasMicroArcStage(microOutline, option.id);
    const entry: TossSelectOption = {
      id: option.id,
      label: option.label,
    };

    if (taken) {
      entry.disabled = true;
      entry.chip = { label: "생성완료", tone: "done" };
    } else {
      entry.chip = { label: "최초 1회 생성 가능", tone: "info" };
    }

    return entry;
  });
}

export function MicroArcCreateModal({
  open,
  parentArc,
  project,
  busy = false,
  onClose,
  onSubmit,
}: MicroArcCreateModalProps) {
  const [stage, setStage] = useState("");
  const [title, setTitle] = useState("");
  const [fromChapter, setFromChapter] = useState("");
  const [toChapter, setToChapter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const microOutline = parentArc ? ensureMicroOutline(parentArc) : [];
  const stageOptions = useMemo(() => buildStageOptions(microOutline), [microOutline]);

  const arcReadiness = useMemo(
    () =>
      parentArc
        ? evaluateArcReadiness(parentArc, project).filter(
            (entry) => entry.id !== "arc-micro"
          )
        : [],
    [parentArc, project]
  );

  useEffect(() => {
    if (!open) return;
    setStage("");
    setTitle("");
    setFromChapter("");
    setToChapter("");
    setError(null);
  }, [open, parentArc?.id]);

  const from = parseChapterField(fromChapter);
  const to = parseChapterField(toChapter);
  const selectedStage = stage as MicroArcStage | "";

  const validationError = useMemo(() => {
    if (!parentArc || !selectedStage || !title.trim()) return null;
    if (hasMicroArcStage(microOutline, selectedStage)) {
      return "이 단계는 이미 추가되어 있어요.";
    }
    return validateMicroArcChapterRange(microOutline, from, to);
  }, [from, microOutline, parentArc, selectedStage, title, to]);

  const handleSubmit = () => {
    if (busy || !parentArc) return;
    if (!selectedStage) {
      setError("단계를 선택해 주세요.");
      return;
    }
    if (!title.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (hasMicroArcStage(microOutline, selectedStage)) {
      setError("이 단계는 이미 추가되어 있어요.");
      return;
    }
    const rangeError = validateMicroArcChapterRange(microOutline, from, to);
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

  if (!parentArc) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      kind="prompt"
      title="소아크 추가"
      description={`「${parentArc.title}」 안에 소단계를 추가해요.`}
      footer={
        <button
          type="button"
          disabled={
            !selectedStage ||
            !title.trim() ||
            busy ||
            hasMicroArcStage(microOutline, selectedStage) ||
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
        <ReadinessCallout items={arcReadiness} />

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
            placeholder={
              selectedStage
                ? `예: ${microArcStageLabel(selectedStage)} 구간`
                : "예: 갈등 싹트기"
            }
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
