"use client";

import { useCallback, useState } from "react";
import { ConceptEditModal } from "@/components/ConceptEditModal";
import { ConceptOverview } from "@/components/ConceptOverview";
import type { ConceptSaveState } from "@/components/ConceptEditor";
import type { ProjectData, ProjectSettings } from "@/lib/types";

type ConceptEditing = number | "full" | null;

interface ConceptWorkspaceProps {
  settings: ProjectSettings;
  onSaved?: (project: ProjectData) => void;
  onSaveStateChange?: (state: ConceptSaveState | null) => void;
}

export function ConceptWorkspace({
  settings,
  onSaved,
  onSaveStateChange,
}: ConceptWorkspaceProps) {
  const [editing, setEditing] = useState<ConceptEditing>(null);
  const [previewSettings, setPreviewSettings] = useState(settings);

  const startRowEdit = useCallback(
    (step: number) => {
      setEditing(step);
      setPreviewSettings(settings);
    },
    [settings]
  );

  const startFullEdit = useCallback(() => {
    setEditing("full");
    setPreviewSettings(settings);
  }, [settings]);

  const closeEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const displaySettings = editing !== null ? previewSettings : settings;
  const highlightedStep = typeof editing === "number" ? editing : null;

  return (
    <div className="toss-concept-workspace">
      <ConceptOverview
        settings={displaySettings}
        editingStep={highlightedStep}
        onEdit={startFullEdit}
        onRowClick={startRowEdit}
      />

      <ConceptEditModal
        open={editing !== null}
        mode={editing === "full" ? "full" : "single"}
        step={typeof editing === "number" ? editing : 0}
        settings={settings}
        onClose={closeEdit}
        onSaved={(project) => {
          onSaved?.(project);
          setPreviewSettings(project.settings);
        }}
        onSettingsChange={setPreviewSettings}
        onSaveStateChange={onSaveStateChange}
        onStepChange={(step) => setEditing(step)}
      />
    </div>
  );
}
