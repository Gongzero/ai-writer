"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ConceptEditor,
  type ConceptSaveState,
} from "@/components/ConceptEditor";
import { CONCEPT_OVERVIEW_ROWS } from "@/components/ConceptOverview";
import { ModalShell } from "@/components/home/ModalShell";
import type { ProjectData, ProjectSettings } from "@/lib/types";

export type ConceptEditModalMode = "full" | "single";

interface ConceptEditModalProps {
  open: boolean;
  mode: ConceptEditModalMode;
  step: number;
  settings: ProjectSettings;
  onClose: () => void;
  onSaved?: (project: ProjectData) => void;
  onSettingsChange?: (settings: ProjectSettings) => void;
  onSaveStateChange?: (state: ConceptSaveState | null) => void;
  onStepChange: (step: number) => void;
}

export function ConceptEditModal({
  open,
  mode,
  step,
  settings,
  onClose,
  onSaved,
  onSettingsChange,
  onSaveStateChange,
  onStepChange,
}: ConceptEditModalProps) {
  const [saveState, setSaveState] = useState<ConceptSaveState | null>(null);

  const handleSaveStateChange = useCallback(
    (state: ConceptSaveState | null) => {
      setSaveState(state);
      onSaveStateChange?.(state);
    },
    [onSaveStateChange]
  );

  useEffect(() => {
    if (!open) {
      setSaveState(null);
      onSaveStateChange?.(null);
    }
  }, [open, onSaveStateChange]);

  const title =
    mode === "full"
      ? "소설 컨셉 수정"
      : (CONCEPT_OVERVIEW_ROWS[step]?.label ?? "항목 수정");

  const focusedStep = mode === "full" ? -1 : step;

  const handleSaved = (project: ProjectData) => {
    onSaved?.(project);
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button
          type="button"
          onClick={() => saveState?.save()}
          disabled={!saveState?.dirty || saveState.saving}
          className="toss-btn-primary w-full py-3.5 text-[16px] disabled:opacity-50"
        >
          {saveState?.saving ? "저장 중…" : "저장"}
        </button>
      }
    >
      <div
        className={`toss-concept-edit-modal-body ${
          mode === "full" ? "toss-concept-edit-modal-body-full" : ""
        }`}
      >
        <ConceptEditor
          settings={settings}
          onSaved={handleSaved}
          onSettingsChange={onSettingsChange}
          onSaveStateChange={handleSaveStateChange}
          embedded
          overviewMode
          focusedStep={focusedStep}
          onFocusedStepChange={onStepChange}
        />
      </div>
    </ModalShell>
  );
}
