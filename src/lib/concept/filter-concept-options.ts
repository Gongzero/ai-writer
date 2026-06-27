import { MECHANIC_NONE_ID } from "./mechanic-presets";
import { NARRATIVE_TRIGGER_NONE_ID } from "./narrative-trigger-presets";
import type { ConceptPreset } from "./types";

/** 컨셉 축 조합에서 파생되는 맥락 태그 */
export interface ConceptAffinity {
  /** 맥락 태그 중 하나라도 겹치면 표시 */
  tags?: string[];
  /** 루트 카테고리 직접 지정 */
  roots?: string[];
  /** 시공간 무대 직접 지정 */
  settings?: string[];
  /** 제외 태그 — 맥락에 있으면 숨김 */
  excludeTags?: string[];
}

export type ConceptPresetWithAffinity = ConceptPreset;

export type ConceptContextInput = {
  genreId: string;
  settingId: string;
  mechanicIds: string[];
  narrativeTriggerIds: string[];
  plotStructureId: string;
};

const GENRE_CONTEXT_TAGS: Record<string, string[]> = {
  "male-fantasy-modern": ["male", "modern", "fantasy", "hunter", "game", "system"],
  "male-fantasy-classic": ["male", "fantasy", "historical"],
  "male-fantasy-fusion": ["male", "fantasy", "game", "system"],
  "male-wuxia-classic": ["male", "wuxia", "oriental", "historical"],
  "male-wuxia-new": ["male", "wuxia", "oriental", "modern", "fantasy"],
  "male-alt-history": ["male", "historical", "modern"],
  "male-sf-game": ["male", "sf", "game", "system"],
  "male-subculture": ["male", "game", "system", "modern"],
  "female-romantasy": ["female", "romance", "fantasy", "historical"],
  "female-modern-romance": ["female", "romance", "modern"],
  "female-oriental-romantasy": ["female", "romance", "fantasy", "historical", "oriental"],
  "female-wuxia-romance": ["female", "romance", "wuxia", "oriental"],
  "female-lead-fantasy": ["female", "fantasy", "historical", "oriental"],
  "other-horror": ["horror", "modern", "fantasy"],
  "other-bl": ["bl", "romance", "modern", "male"],
  "other-gl": ["gl", "romance", "modern", "female"],
};

const SETTING_CONTEXT_TAGS: Record<string, string[]> = {
  "modern-pure": ["modern"],
  "modern-hidden": ["modern", "hunter", "fantasy", "system"],
  "modern-apocalypse": ["modern", "horror", "hunter"],
  "history-korea": ["historical", "oriental"],
  "history-western": ["historical"],
  "history-oriental": ["historical", "oriental"],
  "fantasy-medieval": ["fantasy", "historical"],
  "fantasy-nordic": ["fantasy", "historical"],
  "fantasy-steampunk": ["fantasy", "sf", "historical"],
  "wuxia-central": ["wuxia", "oriental", "historical"],
  "wuxia-immortal": ["wuxia", "oriental", "fantasy"],
  "wuxia-oriental-empire": ["oriental", "historical", "fantasy", "romance"],
  "future-space": ["sf", "fantasy"],
  "future-cyberpunk": ["sf", "modern"],
  "future-post-apoc": ["sf", "horror", "modern"],
  "future-vr": ["game", "sf", "modern", "system"],
  "future-infinite": ["game", "fantasy", "sf", "system"],
};

const MECHANIC_CONTEXT_TAGS: Record<string, string[]> = {
  "game-system": ["game", "system"],
  constellation: ["game", "system", "fantasy"],
  "mana-magic": ["fantasy", "historical"],
  "martial-qi": ["wuxia", "oriental"],
  superpower: ["hunter", "modern", "fantasy"],
  "special-relationship-world": ["romance", "bl", "gl"],
  "monster-evolution": ["fantasy", "hunter", "game"],
  none: ["modern"],
};

const TRIGGER_CONTEXT_TAGS: Record<string, string[]> = {
  regression: ["fantasy", "romance", "game", "modern"],
  "possession-book": ["romance", "female", "fantasy"],
  "possession-game": ["game", "male", "system"],
  "possession-other": ["fantasy", "romance", "horror"],
  reincarnation: ["fantasy", "romance", "oriental"],
  "dimension-summon": ["fantasy", "game", "isekai"],
  return: ["modern", "fantasy", "male"],
  awakening: ["hunter", "modern", "fantasy", "game"],
  "none-linear": [],
};

const PLOT_CONTEXT_TAGS: Record<string, string[]> = {
  "linear-epic": ["fantasy", "male", "historical"],
  episodic: ["modern", "romance", "healing"],
  "stage-clear": ["game", "hunter", "tower", "system"],
  building: ["historical", "fantasy", "territory"],
  ensemble: [],
};

export function deriveConceptContextTags(input: ConceptContextInput): Set<string> {
  const tags = new Set<string>();
  for (const t of GENRE_CONTEXT_TAGS[input.genreId] ?? []) tags.add(t);
  for (const t of SETTING_CONTEXT_TAGS[input.settingId] ?? []) tags.add(t);
  for (const id of input.mechanicIds) {
    for (const t of MECHANIC_CONTEXT_TAGS[id] ?? []) tags.add(t);
  }
  for (const id of input.narrativeTriggerIds) {
    for (const t of TRIGGER_CONTEXT_TAGS[id] ?? []) tags.add(t);
  }
  for (const t of PLOT_CONTEXT_TAGS[input.plotStructureId] ?? []) tags.add(t);
  return tags;
}

export function isPresetVisibleForContext(
  preset: ConceptPresetWithAffinity,
  input: ConceptContextInput,
  ctx: Set<string>
): boolean {
  if (preset.id === MECHANIC_NONE_ID || preset.id === NARRATIVE_TRIGGER_NONE_ID) {
    return true;
  }

  const aff = preset.affinity;
  if (!aff) return true;

  if (aff.excludeTags?.some((t) => ctx.has(t))) return false;

  const checks: boolean[] = [];
  if (aff.tags?.length) checks.push(aff.tags.some((t) => ctx.has(t)));
  if (aff.roots?.length) checks.push(aff.roots.includes(input.genreId));
  if (aff.settings?.length) checks.push(aff.settings.includes(input.settingId));

  if (checks.length === 0) return true;
  return checks.some(Boolean);
}

export function filterPresetsForContext<T extends ConceptPresetWithAffinity>(
  presets: T[],
  input: ConceptContextInput
): T[] {
  const ctx = deriveConceptContextTags(input);
  return presets.filter((p) => isPresetVisibleForContext(p, input, ctx));
}

export function pruneConceptSelections<
  T extends ConceptContextInput & { tropeIds: string[]; mechanicIds: string[]; narrativeTriggerIds: string[] },
>(
  input: T,
  tropePresets: ConceptPresetWithAffinity[],
  mechanicPresets: ConceptPresetWithAffinity[],
  triggerPresets: ConceptPresetWithAffinity[]
): T {
  const ctx = deriveConceptContextTags(input);
  const visibleTrope = new Set(
    tropePresets
      .filter((p) => isPresetVisibleForContext(p, input, ctx))
      .map((p) => p.id)
  );
  const visibleMechanic = new Set(
    mechanicPresets
      .filter((p) => isPresetVisibleForContext(p, input, ctx))
      .map((p) => p.id)
  );
  const visibleTrigger = new Set(
    triggerPresets
      .filter((p) => isPresetVisibleForContext(p, input, ctx))
      .map((p) => p.id)
  );

  return {
    ...input,
    tropeIds: input.tropeIds.filter((id) => visibleTrope.has(id)),
    mechanicIds: input.mechanicIds.filter((id) => visibleMechanic.has(id)),
    narrativeTriggerIds: input.narrativeTriggerIds.filter((id) =>
      visibleTrigger.has(id)
    ),
  };
}
