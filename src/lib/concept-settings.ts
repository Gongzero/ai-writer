import { composeStyleGuide } from "./compose-style-guide";
import {
  MECHANIC_PRESETS,
  NARRATIVE_TRIGGER_PRESETS,
  TROPE_PRESETS,
  pruneConceptSelections,
} from "./concept";
import type { ProjectSettings } from "./types";

export type ConceptAxisPatch = Partial<
  Pick<
    ProjectSettings,
    | "targetGroupId"
    | "genreId"
    | "settingGroupId"
    | "settingId"
    | "mechanicIds"
    | "narrativeTriggerIds"
    | "plotStructureId"
    | "tropeIds"
    | "moodToneId"
    | "styleGuide"
  >
>;

export function toggleId(ids: string[], id: string, on: boolean): string[] {
  if (on) return ids.includes(id) ? ids : [...ids, id];
  return ids.filter((x) => x !== id);
}

export function toggleExclusiveNone(
  ids: string[],
  id: string,
  on: boolean,
  noneId: string
): string[] {
  if (!on) return ids.filter((x) => x !== id);
  if (id === noneId) return [noneId];
  return [...ids.filter((x) => x !== noneId), id];
}

export function pickConceptFields(settings: ProjectSettings) {
  return {
    genreId: settings.genreId,
    settingId: settings.settingId,
    mechanicIds: settings.mechanicIds,
    narrativeTriggerIds: settings.narrativeTriggerIds,
    plotStructureId: settings.plotStructureId,
  };
}

export function pickStyleGuideConcept(settings: ProjectSettings) {
  return {
    targetGroupId: settings.targetGroupId,
    genreId: settings.genreId,
    settingGroupId: settings.settingGroupId,
    settingId: settings.settingId,
    mechanicIds: settings.mechanicIds,
    narrativeTriggerIds: settings.narrativeTriggerIds,
    plotStructureId: settings.plotStructureId,
    tropeIds: settings.tropeIds,
    moodToneId: settings.moodToneId,
  };
}

export function applyConceptAxes(
  base: ProjectSettings,
  patch: ConceptAxisPatch,
  regenerateGuide = true
): ProjectSettings {
  const merged = { ...base, ...patch };
  const pruned = pruneConceptSelections(
    merged,
    TROPE_PRESETS,
    MECHANIC_PRESETS,
    NARRATIVE_TRIGGER_PRESETS
  );
  if (!regenerateGuide) return pruned;
  return {
    ...pruned,
    styleGuide: composeStyleGuide(pickStyleGuideConcept(pruned)),
  };
}
