"use client";

import { ModalShell } from "@/components/home/ModalShell";

interface DeleteConfirmModalProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  busy = false,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={busy ? () => {} : onClose}
      closeDisabled={busy}
      variant="action"
      kind="confirm"
      title="삭제하시겠어요?"
      footer={
        <div className="toss-delete-confirm-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="toss-btn-tertiary disabled:opacity-40"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="toss-btn-danger disabled:opacity-40"
          >
            {busy ? "삭제 중…" : "삭제"}
          </button>
        </div>
      }
    >
      <p className="text-[15px] leading-relaxed text-[var(--toss-gray-600)]">
        한 번 삭제한건 되돌릴 수 없어요!
      </p>
    </ModalShell>
  );
}
