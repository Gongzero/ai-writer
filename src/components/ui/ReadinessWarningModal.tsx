"use client";

import { ModalShell } from "@/components/home/ModalShell";
import type { ReadinessItem } from "@/lib/readiness";

interface ReadinessWarningModalProps {
  open: boolean;
  busy?: boolean;
  title?: string;
  warnings: ReadinessItem[];
  onClose: () => void;
  onProceed: () => void;
}

export function ReadinessWarningModal({
  open,
  busy = false,
  title = "집필 맥락이 부족해요",
  warnings,
  onClose,
  onProceed,
}: ReadinessWarningModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={busy ? () => {} : onClose}
      closeDisabled={busy}
      kind="prompt"
      title={title}
      description="보완하면 AI 결과가 좋아져요. 그래도 진행할 수 있어요."
      footer={
        <div className="toss-delete-confirm-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="toss-btn-tertiary disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={busy}
            className="toss-btn-primary disabled:opacity-40"
          >
            그래도 진행
          </button>
        </div>
      }
    >
      <ul className="toss-readiness-warning-list">
        {warnings.map((warning) => (
          <li key={warning.id} className="toss-readiness-warning-item">
            <span className="toss-readiness-warning-mark" aria-hidden>
              {warning.status === "missing" ? "○" : "△"}
            </span>
            <div>
              <p className="toss-readiness-warning-label">{warning.label}</p>
              {warning.hint ? (
                <p className="toss-readiness-warning-hint">{warning.hint}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </ModalShell>
  );
}
