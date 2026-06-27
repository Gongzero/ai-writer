"use client";

import type { PanelSaveState } from "@/lib/panel-save-state";

interface MobileDetailBottomSaveProps {
  save: PanelSaveState | null;
}

export function MobileDetailBottomSave({ save }: MobileDetailBottomSaveProps) {
  const label = save?.label ?? "저장";
  const disabled = !save || !save.dirty || save.saving;

  return (
    <div className="toss-mobile-detail-bottom-save">
      <button
        type="button"
        onClick={() => save?.save()}
        disabled={disabled}
        className="toss-btn-primary disabled:opacity-40"
      >
        {save?.saving ? "저장 중…" : label}
      </button>
    </div>
  );
}
