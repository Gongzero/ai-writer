"use client";

import { ModalShell } from "@/components/home/ModalShell";
import type { PrerequisiteGuide } from "@/lib/readiness";
import type { SidebarTab } from "@/lib/types";

interface PrerequisiteGuideModalProps {
  open: boolean;
  guide: PrerequisiteGuide | null;
  onClose: () => void;
  onNavigate: (tab: SidebarTab) => void;
}

export function PrerequisiteGuideModal({
  open,
  guide,
  onClose,
  onNavigate,
}: PrerequisiteGuideModalProps) {
  if (!guide) return null;

  const handleNavigate = () => {
    onNavigate(guide.target);
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      kind="prompt"
      title={guide.title}
      description={guide.description}
      footer={
        <button
          type="button"
          onClick={handleNavigate}
          className="toss-btn-primary w-full py-4 text-[17px]"
        >
          {guide.actionLabel}
        </button>
      }
    >
      <div className="toss-modal-form">
        <div className="toss-readiness-callout">
          <p>{guide.callout}</p>
          <button
            type="button"
            className="toss-readiness-callout-link"
            onClick={handleNavigate}
          >
            {guide.actionLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/** @deprecated PrerequisiteGuideModal */
export const ChaptersPrerequisiteModal = PrerequisiteGuideModal;
