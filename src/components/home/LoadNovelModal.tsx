"use client";

import { ModalShell } from "@/components/home/ModalShell";
import {
  TossActionGroup,
  TossActionRow,
} from "@/components/ui/Tossface";
import type { ProjectSummary } from "@/lib/types";

interface LoadNovelModalProps {
  open: boolean;
  projects: ProjectSummary[];
  loading: boolean;
  ready: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

const ROW_EMOJI_BG = "#f2f4f6";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function LoadNovelModal({
  open,
  projects,
  loading,
  ready,
  onClose,
  onSelect,
  onCreate,
}: LoadNovelModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      kind="prompt"
      title="소설 불러오기"
      description="이어서 작업할 작품을 선택하세요."
    >
      {!ready || loading ? (
        <p className="py-10 text-center text-sm text-[var(--toss-gray-400)]">
          불러오는 중…
        </p>
      ) : projects.length === 0 ? (
        <TossActionGroup>
          <TossActionRow
            emoji="📖"
            emojiBg={ROW_EMOJI_BG}
            title="소설 만들기"
            description="첫 작품을 만들고 컨셉부터 차근차근 잡아보세요"
            onClick={onCreate}
          />
        </TossActionGroup>
      ) : (
        <TossActionGroup>
          {projects.map((p) => (
            <TossActionRow
              key={p.id}
              emoji="📖"
              emojiBg={ROW_EMOJI_BG}
              title={p.title}
              description={`${formatDate(p.updatedAt)} 수정`}
              onClick={() => onSelect(p.id)}
            />
          ))}
        </TossActionGroup>
      )}
    </ModalShell>
  );
}
