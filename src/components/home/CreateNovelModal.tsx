"use client";

import { ModalShell } from "@/components/home/ModalShell";
import {
  TossActionGroup,
  TossActionRow,
} from "@/components/ui/Tossface";

interface CreateNovelModalProps {
  open: boolean;
  onClose: () => void;
  onWizard: () => void;
  onQuickCreate: () => void;
}

export function CreateNovelModal({
  open,
  onClose,
  onWizard,
  onQuickCreate,
}: CreateNovelModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      kind="prompt"
      title="소설 만들기"
      description="어떻게 시작할까요?"
    >
      <TossActionGroup>
        <TossActionRow
          emoji="📚"
          emojiBg="#e8f3ff"
          title="단계에 따라 생성하기"
          description="컨셉 → 바이블 → 회차 뼈대 → 원고"
          onClick={onWizard}
        />
        <TossActionRow
          emoji="✏️"
          emojiBg="#f2f4f6"
          title="그냥 만들기"
          description="바로 에디터에서 자유롭게 작성"
          onClick={onQuickCreate}
        />
      </TossActionGroup>
    </ModalShell>
  );
}
