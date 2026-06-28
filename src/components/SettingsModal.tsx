"use client";

import { useEffect, useState } from "react";
import { ModalShell } from "@/components/home/ModalShell";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { deleteProject, saveProject } from "@/lib/db";
import { GEMINI_MODEL_OPTIONS } from "@/lib/gemini-models";
import { downloadProjectJson } from "@/lib/project-transfer";
import type { ProjectData, ProjectSettings } from "@/lib/types";

type SettingsSection = "work" | "ai";

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: "work", label: "작품" },
  { id: "ai", label: "AI" },
];

interface SettingsModalProps {
  open: boolean;
  project: ProjectData;
  onClose: () => void;
  onSaved: (project: ProjectData) => void;
  onDeleted?: () => void;
}

export function SettingsModal({
  open,
  project,
  onClose,
  onSaved,
  onDeleted,
}: SettingsModalProps) {
  const [section, setSection] = useState<SettingsSection>("work");
  const [title, setTitle] = useState(project.meta.title);
  const [draft, setDraft] = useState<ProjectSettings>(project.settings);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { requestDelete, deleteConfirmModal } = useDeleteConfirm();

  useEffect(() => {
    if (open) {
      setSection("work");
      setTitle(project.meta.title);
      setDraft(project.settings);
    }
  }, [open, project]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: ProjectData = {
        ...project,
        meta: { ...project.meta, title: title.trim() },
        settings: {
          ...project.settings,
          apiKey: draft.apiKey,
          model: draft.model,
          defaultChapterLength: draft.defaultChapterLength,
        },
      };
      await saveProject(updated);
      onSaved(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const runDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      onClose();
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    requestDelete(runDelete);
  };

  const handleExportJson = () => {
    const snapshot: ProjectData = {
      ...project,
      meta: { ...project.meta, title: title.trim() },
      settings: {
        ...project.settings,
        apiKey: draft.apiKey,
        model: draft.model,
        defaultChapterLength: draft.defaultChapterLength,
      },
    };
    downloadProjectJson(snapshot);
  };

  return (
    <>
    <ModalShell
      open={open}
      onClose={onClose}
      title="설정"
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting}
            className="toss-btn-primary w-full py-3.5 text-[16px]"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={saving || deleting}
            className="w-full rounded-xl bg-red-50 py-3.5 text-[16px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "삭제 중…" : "소설 삭제"}
          </button>
        </div>
      }
    >
      <div className="toss-settings-tabs toss-segmented-on-surface" role="tablist" aria-label="설정 구분">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={section === item.id}
            onClick={() => setSection(item.id)}
            className={`toss-settings-tab ${section === item.id ? "toss-settings-tab-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 min-h-0">
        {section === "work" && (
          <div className="space-y-5">
            <label className="block">
              <span className="toss-field-label">소설 제목</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목 없는 소설"
                className="toss-input mt-2"
              />
            </label>

            <label className="block">
              <span className="toss-field-label">화당 목표 분량 (자)</span>
              <input
                type="number"
                min={500}
                step={100}
                value={draft.defaultChapterLength}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    defaultChapterLength: Number(e.target.value) || 3000,
                  })
                }
                className="toss-input mt-2"
              />
              <p className="toss-field-hint mt-2">
                새 화를 만들 때 기본으로 적용됩니다.
              </p>
            </label>

            <div className="toss-project-transfer">
              <p className="toss-field-label">다른 기기로 옮기기</p>
              <p className="toss-field-hint">
                컨셉·바이블·회차 뼈대·원고가 JSON 파일 하나로 저장돼요.
              </p>
              <button
                type="button"
                onClick={handleExportJson}
                disabled={saving || deleting}
                className="toss-btn-secondary mt-3 w-full py-3.5 text-[15px]"
              >
                작품 JSON 내보내기
              </button>
            </div>
          </div>
        )}

        {section === "ai" && (
          <div className="space-y-5">
            <p className="text-[14px] leading-relaxed text-[var(--toss-gray-500)]">
              AI 집필·보조 기능에 사용됩니다. 키는 이 기기에만 저장됩니다.
            </p>
            <label className="block">
              <span className="toss-field-label">Gemini API 키</span>
              <input
                type="password"
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder="AIza..."
                className="toss-input mt-2"
              />
            </label>
            <label className="block">
              <span className="toss-field-label">모델</span>
              <select
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                className="toss-input mt-2"
              >
                {GEMINI_MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </ModalShell>
    {deleteConfirmModal}
    </>
  );
}
