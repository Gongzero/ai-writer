"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
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
  importing?: boolean;
  importError?: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onImportJson: (file: File) => void;
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
  importing = false,
  importError = null,
  onClose,
  onSelect,
  onCreate,
  onImportJson,
}: LoadNovelModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open]);

  const handlePickJson = () => {
    if (importing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImportJson(file);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="action"
      kind="prompt"
      title="소설 불러오기"
      description="이 기기에 저장된 작품을 고르거나 JSON 파일을 가져와요."
    >
      {!ready || loading ? (
        <p className="py-10 text-center text-sm text-[var(--toss-gray-400)]">
          불러오는 중…
        </p>
      ) : (
        <div className="toss-load-novel-modal">
          {projects.length === 0 ? (
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

          <div className="toss-load-novel-import">
            <TossActionGroup>
              <TossActionRow
                emoji="📁"
                emojiBg="#e8f3ff"
                title="JSON 파일 가져오기"
                description={
                  importing
                    ? "가져오는 중…"
                    : "다른 기기에서 내보낸 작품 파일"
                }
                onClick={handlePickJson}
              />
            </TossActionGroup>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileChange}
            />
            {importError ? (
              <p className="toss-modal-form-error">{importError}</p>
            ) : null}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
