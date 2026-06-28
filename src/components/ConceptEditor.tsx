"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConceptFlowStep } from "@/components/ui/ConceptFlowStep";
import { ProgressiveReveal } from "@/components/ui/ProgressiveReveal";
import { TossMultiSelect } from "@/components/ui/TossMultiSelect";
import { TossSelect } from "@/components/ui/TossSelect";
import { TossSelectProvider } from "@/components/ui/toss-select-context";
import { updateSettings } from "@/lib/db";
import {
  applyConceptAxes,
  pickConceptFields,
} from "@/lib/concept-settings";
import {
  CONTENT_RATING_OPTIONS,
  contentRatingLabel,
} from "@/lib/content-rating";
import {
  MECHANIC_NONE_ID,
  MECHANIC_PRESETS,
  MOOD_TONE_PRESETS,
  NARRATIVE_TRIGGER_NONE_ID,
  NARRATIVE_TRIGGER_PRESETS,
  PLOT_STRUCTURE_PRESETS,
  SETTING_GROUP_PRESETS,
  TARGET_GROUP_PRESETS,
  TROPE_PRESETS,
  filterPresetsForContext,
  genresForTarget,
  settingsForGroup,
} from "@/lib/concept";
import type { ConceptAxisPatch } from "@/lib/concept-settings";
import type { ContentRating, ProjectData, ProjectSettings } from "@/lib/types";

const CONCEPT_FLOW = [
  "rating",
  "target",
  "genre",
  "settingGroup",
  "setting",
  "mechanics",
  "triggers",
  "plot",
  "tropes",
  "mood",
] as const;

type ConceptFlowStep = (typeof CONCEPT_FLOW)[number];

function initTouched(settings: ProjectSettings, embedded: boolean): Set<ConceptFlowStep> {
  if (embedded) return new Set();
  const touched = new Set<ConceptFlowStep>(["rating"]);
  if (settings.targetGroupId) touched.add("target");
  if (settings.genreId) touched.add("genre");
  if (settings.settingGroupId) touched.add("settingGroup");
  if (settings.settingId) touched.add("setting");
  if (settings.mechanicIds.length > 0) touched.add("mechanics");
  if (settings.narrativeTriggerIds.length > 0) touched.add("triggers");
  if (settings.plotStructureId) touched.add("plot");
  if (settings.tropeIds.length > 0) touched.add("tropes");
  if (settings.moodToneId) touched.add("mood");
  return touched;
}

function isStepComplete(
  step: ConceptFlowStep,
  draft: ProjectSettings,
  touched: Set<ConceptFlowStep>,
  embedded: boolean
): boolean {
  switch (step) {
    case "rating":
      return embedded ? touched.has("rating") : Boolean(draft.contentRating);
    case "target":
      return Boolean(draft.targetGroupId);
    case "genre":
      return Boolean(draft.genreId);
    case "settingGroup":
      return Boolean(draft.settingGroupId);
    case "setting":
      return Boolean(draft.settingId);
    case "mechanics":
      return draft.mechanicIds.length > 0;
    case "triggers":
      return draft.narrativeTriggerIds.length > 0;
    case "plot":
      return Boolean(draft.plotStructureId);
    case "tropes":
      return touched.has("tropes") || draft.tropeIds.length > 0;
    case "mood":
      return Boolean(draft.moodToneId);
  }
}

function computeRevealUpTo(
  draft: ProjectSettings,
  touched: Set<ConceptFlowStep>,
  embedded: boolean
): number {
  for (let i = 0; i < CONCEPT_FLOW.length; i++) {
    if (!isStepComplete(CONCEPT_FLOW[i], draft, touched, embedded)) return i;
  }
  return CONCEPT_FLOW.length - 1;
}

function chipSummary(
  ids: string[],
  presets: { id: string; label: string }[]
): string {
  if (ids.length === 0) return "—";
  const labels = ids
    .map((id) => presets.find((p) => p.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  if (labels.length <= 2) return labels.join(", ");
  return `${labels[0]} 외 ${labels.length - 1}개`;
}

export interface ConceptSaveState {
  dirty: boolean;
  saving: boolean;
  save: () => void;
}

interface ConceptEditorProps {
  settings: ProjectSettings;
  onSaved?: (project: ProjectData) => void;
  onSettingsChange?: (settings: ProjectSettings) => void;
  onSaveStateChange?: (state: ConceptSaveState | null) => void;
  embedded?: boolean;
  overviewMode?: boolean;
  focusedStep?: number;
  onFocusedStepChange?: (step: number) => void;
}

function TropePicker({
  recommended,
  allTropes,
  selected,
  onChange,
  onConfirm,
  onSkip,
  requestOpen,
  onRequestOpenHandled,
}: {
  recommended: typeof TROPE_PRESETS;
  allTropes: typeof TROPE_PRESETS;
  selected: string[];
  onChange: (ids: string[]) => void;
  onConfirm?: () => void;
  onSkip: () => void;
  requestOpen?: boolean;
  onRequestOpenHandled?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(recommended.length === 0);

  useEffect(() => {
    if (recommended.length === 0) setShowAll(true);
  }, [recommended.length]);

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool = q
      ? allTropes.filter(
          (t) =>
            t.label.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        )
      : showAll
        ? allTropes
        : recommended;

    return pool.map((t) => ({
      id: t.id,
      label: t.label,
      description: t.description,
    }));
  }, [search, showAll, allTropes, recommended]);

  return (
    <TossMultiSelect
      label="핵심 소재 및 공간"
      legend="핵심 소재 및 공간"
      hint="장르·무대에 맞는 태그를 추천합니다. 없으면 검색하거나 전체 태그 보기를 사용하세요."
      options={options}
      selected={selected}
      onChange={onChange}
      onConfirm={onConfirm}
      requestOpen={requestOpen}
      onRequestOpenHandled={onRequestOpenHandled}
      placeholder="태그를 선택하세요"
      headerExtra={
        <div className="space-y-2">
          <div className="toss-search-wrap">
            <svg
              className="toss-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="태그 검색"
              className="toss-search-input"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="toss-text-link px-1 py-1"
          >
            {showAll ? "추천 태그만 보기" : "전체 태그 보기"}
          </button>
        </div>
      }
      footerExtra={
        selected.length === 0 ? (
          <button type="button" onClick={onSkip} className="toss-text-link mb-3 w-full py-1 text-center">
            태그 없이 넘어가기
          </button>
        ) : null
      }
    />
  );
}

export function ConceptEditor({
  settings,
  onSaved,
  onSettingsChange,
  onSaveStateChange,
  embedded = false,
  overviewMode = false,
  focusedStep: focusedStepProp,
  onFocusedStepChange,
}: ConceptEditorProps) {
  const [draft, setDraft] = useState(settings);
  const [guideCustomized, setGuideCustomized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(() => initTouched(settings, embedded));
  const [internalFocusedStep, setInternalFocusedStep] = useState(0);
  const focusedStep = overviewMode ? (focusedStepProp ?? 0) : internalFocusedStep;
  const [autoOpenStep, setAutoOpenStep] = useState<number | null>(null);
  const activeStepRef = useRef<HTMLDivElement>(null);
  const prevRevealUpTo = useRef(0);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  useEffect(() => {
    if (embedded) return;
    setDraft(settings);
    setGuideCustomized(false);
    setTouched(initTouched(settings, false));
  }, [settings, embedded]);

  const touch = (step: ConceptFlowStep) => {
    setTouched((prev) => {
      if (prev.has(step)) return prev;
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  };

  const revealUpTo = useMemo(
    () => computeRevealUpTo(draft, touched, embedded),
    [draft, touched, embedded]
  );
  const stepRevealUpTo = overviewMode ? CONCEPT_FLOW.length - 1 : revealUpTo;

  const scrollToFocusedStep = useCallback(() => {
    if (!embedded || !activeStepRef.current) return;
    activeStepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [embedded]);

  const clearAutoOpen = useCallback(() => setAutoOpenStep(null), []);

  const focusStep = useCallback(
    (index: number, autoOpen = false) => {
      if (!embedded || overviewMode) return;
      setInternalFocusedStep(index);
      if (autoOpen) setAutoOpenStep(index);
      window.setTimeout(scrollToFocusedStep, 50);
    },
    [embedded, overviewMode, scrollToFocusedStep]
  );

  useEffect(() => {
    if (!embedded || overviewMode) return;
    if (revealUpTo > prevRevealUpTo.current && focusedStep === prevRevealUpTo.current) {
      setInternalFocusedStep(revealUpTo);
    }
    prevRevealUpTo.current = revealUpTo;
  }, [revealUpTo, embedded, overviewMode, focusedStep]);

  useEffect(() => {
    if (!embedded || focusedStep < 0) return;
    const timer = window.setTimeout(scrollToFocusedStep, 400);
    return () => window.clearTimeout(timer);
  }, [focusedStep, embedded, scrollToFocusedStep]);

  const scrollOnReveal = !embedded;

  const pushDraft = (next: ProjectSettings) => {
    setDraft(next);
    if (embedded) onSettingsChange?.(next);
  };

  const updateAxes = (patch: ConceptAxisPatch) => {
    if (guideCustomized) {
      pushDraft({ ...draft, ...patch });
    } else {
      pushDraft(applyConceptAxes(draft, patch, !embedded));
    }
  };

  const handleTargetGroupChange = (targetGroupId: string) => {
    touch("target");
    if (!targetGroupId) {
      updateAxes({ targetGroupId: "", genreId: "" });
      return;
    }
    updateAxes({ targetGroupId, genreId: "" });
  };

  const handleSettingGroupChange = (settingGroupId: string) => {
    touch("settingGroup");
    if (!settingGroupId) {
      updateAxes({ settingGroupId: "", settingId: "" });
      return;
    }
    updateAxes({ settingGroupId, settingId: "" });
  };

  const regenerateGuide = () => {
    setDraft((prev) => applyConceptAxes(prev, {}));
    setGuideCustomized(false);
  };

  const contextInput = useMemo(() => pickConceptFields(draft), [draft]);

  const visibleMechanics = useMemo(
    () => filterPresetsForContext(MECHANIC_PRESETS, contextInput),
    [contextInput]
  );
  const visibleTriggers = useMemo(
    () => filterPresetsForContext(NARRATIVE_TRIGGER_PRESETS, contextInput),
    [contextInput]
  );
  const recommendedTropes = useMemo(
    () => filterPresetsForContext(TROPE_PRESETS, contextInput),
    [contextInput]
  );

  const handleSave = useCallback(async () => {
    if (!onSaved) return;
    setSaving(true);
    try {
      const updated = await updateSettings(draft);
      onSaved(updated);
      setGuideCustomized(false);
    } finally {
      setSaving(false);
    }
  }, [draft, onSaved]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const notifySaveState = useRef<() => void>(() => {
    void handleSaveRef.current();
  }).current;

  useEffect(() => {
    if (embedded && !overviewMode) {
      onSaveStateChange?.(null);
      return;
    }
    onSaveStateChange?.({
      dirty,
      saving,
      save: notifySaveState,
    });
  }, [embedded, overviewMode, dirty, saving, onSaveStateChange, notifySaveState]);

  useEffect(() => {
    if (!overviewMode) return;
    setDraft(settings);
    setTouched(initTouched(settings, true));
  }, [settings, overviewMode]);

  useEffect(() => {
    if (!overviewMode || focusedStep < 0) return;
    setAutoOpenStep(focusedStep);
  }, [overviewMode, focusedStep]);

  const targetOption = TARGET_GROUP_PRESETS.find((o) => o.id === draft.targetGroupId);
  const genreOption = genresForTarget(draft.targetGroupId).find((o) => o.id === draft.genreId);
  const settingGroupOption = SETTING_GROUP_PRESETS.find((o) => o.id === draft.settingGroupId);
  const settingOption = settingsForGroup(draft.settingGroupId).find(
    (o) => o.id === draft.settingId
  );

  return (
    <div className={embedded && !overviewMode ? "" : embedded ? "toss-concept-editor-overview" : "px-8 py-6"}>
        <TossSelectProvider>
        <div className={`mx-auto space-y-0 ${embedded && !overviewMode ? "" : embedded ? "" : "max-w-2xl"}`}>
          <ConceptFlowStep
            index={0}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="이용등급"
            summaryValue={contentRatingLabel(draft.contentRating)}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <div className="block">
              <span className="toss-field-label">이용등급</span>
              <TossSelect
                label="이용등급"
                value={embedded && !overviewMode && !touched.has("rating") ? "" : draft.contentRating}
                allowEmpty={embedded}
                requestOpen={autoOpenStep === 0}
                onRequestOpenHandled={clearAutoOpen}
                onAfterSelect={scrollToFocusedStep}
                onChange={(v) => {
                  touch("rating");
                  pushDraft({
                    ...draft,
                    contentRating: v as ContentRating,
                  });
                }}
                options={CONTENT_RATING_OPTIONS.map((o) => ({
                  id: o.id,
                  label: o.label,
                }))}
              />
              <p className="toss-field-hint">
                {touched.has("rating") || !embedded
                  ? `${contentRatingLabel(draft.contentRating)} — 표현 수위만 제어합니다.`
                  : "표현 수위를 선택해 주세요."}
              </p>
            </div>
          </ConceptFlowStep>

          <ConceptFlowStep
            index={1}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="메인 타겟층"
            summaryValue={targetOption?.label ?? "—"}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <div className="block">
              <span className="toss-field-label">메인 타겟층</span>
              <TossSelect
                label="메인 타겟층"
                value={draft.targetGroupId}
                allowEmpty
                requestOpen={autoOpenStep === 1}
                onRequestOpenHandled={clearAutoOpen}
                onAfterSelect={scrollToFocusedStep}
                onChange={handleTargetGroupChange}
                options={TARGET_GROUP_PRESETS.map((o) => ({
                  id: o.id,
                  label: o.label,
                  description: o.description,
                }))}
              />
              {targetOption ? <p className="toss-field-hint">{targetOption.description}</p> : null}
            </div>
          </ConceptFlowStep>

          <ConceptFlowStep
            index={2}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="상세 장르"
            summaryValue={genreOption?.label ?? "—"}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <div className="block">
              <span className="toss-field-label">상세 장르</span>
              <TossSelect
                label="상세 장르"
                value={draft.genreId}
                allowEmpty
                requestOpen={autoOpenStep === 2}
                onRequestOpenHandled={clearAutoOpen}
                onAfterSelect={scrollToFocusedStep}
                onChange={(genreId) => {
                  touch("genre");
                  updateAxes({ genreId });
                }}
                options={genresForTarget(draft.targetGroupId).map((o) => ({
                  id: o.id,
                  label: o.label,
                  description: o.description,
                }))}
              />
              {genreOption ? <p className="toss-field-hint">{genreOption.description}</p> : null}
            </div>
          </ConceptFlowStep>

          <ConceptFlowStep
            index={3}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="거시적 무대"
            summaryValue={settingGroupOption?.label ?? "—"}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <div className="block">
              <span className="toss-field-label">거시적 무대</span>
              <TossSelect
                label="거시적 무대"
                value={draft.settingGroupId}
                allowEmpty
                requestOpen={autoOpenStep === 3}
                onRequestOpenHandled={clearAutoOpen}
                onAfterSelect={scrollToFocusedStep}
                onChange={handleSettingGroupChange}
                options={SETTING_GROUP_PRESETS.map((o) => ({
                  id: o.id,
                  label: o.label,
                  description: o.description,
                }))}
              />
              {settingGroupOption ? (
                <p className="toss-field-hint">{settingGroupOption.description}</p>
              ) : null}
            </div>
          </ConceptFlowStep>

          <ConceptFlowStep
            index={4}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="상세 배경"
            summaryValue={settingOption?.label ?? "—"}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <div className="block">
              <span className="toss-field-label">상세 배경</span>
              <TossSelect
                label="상세 배경"
                value={draft.settingId}
                allowEmpty
                requestOpen={autoOpenStep === 4}
                onRequestOpenHandled={clearAutoOpen}
                onAfterSelect={scrollToFocusedStep}
                onChange={(settingId) => {
                  touch("setting");
                  updateAxes({ settingId });
                }}
                options={settingsForGroup(draft.settingGroupId).map((o) => ({
                  id: o.id,
                  label: o.label,
                  description: o.description,
                }))}
              />
              {settingOption ? <p className="toss-field-hint">{settingOption.description}</p> : null}
            </div>
          </ConceptFlowStep>

          <ConceptFlowStep
            index={5}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="세계관 규칙"
            summaryValue={chipSummary(draft.mechanicIds, visibleMechanics)}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <TossMultiSelect
              label="핵심 세계관 규칙 및 시스템"
              legend="핵심 세계관 규칙 및 시스템"
              hint="장르·무대에 맞는 규칙만 표시됩니다."
              requestOpen={autoOpenStep === 5}
              onRequestOpenHandled={clearAutoOpen}
              options={visibleMechanics.map((p) => ({
                id: p.id,
                label: p.label,
                description: p.description,
              }))}
              selected={draft.mechanicIds}
              exclusiveNoneId={MECHANIC_NONE_ID}
              onConfirm={scrollToFocusedStep}
              onChange={(mechanicIds) => {
                touch("mechanics");
                updateAxes({ mechanicIds });
              }}
            />
          </ConceptFlowStep>

          <ConceptFlowStep
            index={6}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="서사 시작 장치"
            summaryValue={chipSummary(draft.narrativeTriggerIds, visibleTriggers)}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <TossMultiSelect
              label="서사 시작 장치"
              legend="서사 시작 장치 (회빙환)"
              hint="컨셉에 맞는 시작 장치만 표시됩니다."
              requestOpen={autoOpenStep === 6}
              onRequestOpenHandled={clearAutoOpen}
              options={visibleTriggers.map((p) => ({
                id: p.id,
                label: p.label,
                description: p.description,
              }))}
              selected={draft.narrativeTriggerIds}
              exclusiveNoneId={NARRATIVE_TRIGGER_NONE_ID}
              onConfirm={scrollToFocusedStep}
              onChange={(narrativeTriggerIds) => {
                touch("triggers");
                updateAxes({ narrativeTriggerIds });
              }}
            />
          </ConceptFlowStep>

          <ConceptFlowStep
            index={7}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="서사 구조"
            summaryValue={
              PLOT_STRUCTURE_PRESETS.find((p) => p.id === draft.plotStructureId)?.label ?? "—"
            }
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <div className="block">
              <span className="toss-field-label">서사 구조 및 전개 방식</span>
              <TossSelect
                label="서사 구조 및 전개 방식"
                value={draft.plotStructureId}
                allowEmpty
                requestOpen={autoOpenStep === 7}
                onRequestOpenHandled={clearAutoOpen}
                onAfterSelect={scrollToFocusedStep}
                onChange={(plotStructureId) => {
                  touch("plot");
                  updateAxes({ plotStructureId });
                }}
                options={PLOT_STRUCTURE_PRESETS.map((p) => ({
                  id: p.id,
                  label: p.label,
                  description: p.description,
                }))}
              />
              <p className="toss-field-hint">
                {
                  PLOT_STRUCTURE_PRESETS.find((p) => p.id === draft.plotStructureId)
                    ?.description
                }
              </p>
            </div>
          </ConceptFlowStep>

          <ConceptFlowStep
            index={8}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="핵심 소재"
            summaryValue={
              draft.tropeIds.length > 0 ? `${draft.tropeIds.length}개 태그` : "없음"
            }
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <TropePicker
              recommended={recommendedTropes}
              allTropes={TROPE_PRESETS}
              selected={draft.tropeIds}
              requestOpen={autoOpenStep === 8}
              onRequestOpenHandled={clearAutoOpen}
              onChange={(tropeIds) => {
                touch("tropes");
                updateAxes({ tropeIds });
              }}
              onConfirm={scrollToFocusedStep}
              onSkip={() => {
                touch("tropes");
                scrollToFocusedStep();
              }}
            />
          </ConceptFlowStep>

          <ConceptFlowStep
            index={9}
            revealUpTo={stepRevealUpTo}
            embedded={embedded}
            overviewMode={overviewMode}
            summaryLabel="분위기 및 톤"
            summaryValue={MOOD_TONE_PRESETS.find((p) => p.id === draft.moodToneId)?.label ?? "—"}
            activeRef={activeStepRef}
            scrollOnReveal={scrollOnReveal}
            focusedStep={focusedStep}
            onFocusStep={focusStep}
          >
            <div className="block">
              <span className="toss-field-label">분위기 및 톤</span>
              <TossSelect
                label="분위기 및 톤"
                value={draft.moodToneId}
                allowEmpty
                requestOpen={autoOpenStep === 9}
                onRequestOpenHandled={clearAutoOpen}
                onAfterSelect={scrollToFocusedStep}
                onChange={(moodToneId) => {
                  touch("mood");
                  updateAxes({ moodToneId });
                  if (embedded && !overviewMode && moodToneId) {
                    window.setTimeout(() => setInternalFocusedStep(-1), 200);
                  }
                }}
                options={MOOD_TONE_PRESETS.map((p) => ({
                  id: p.id,
                  label: p.label,
                  description: p.description,
                }))}
              />
              <p className="toss-field-hint">
                {MOOD_TONE_PRESETS.find((p) => p.id === draft.moodToneId)?.description}
              </p>
            </div>
          </ConceptFlowStep>

          {!embedded && revealUpTo >= 9 && draft.moodToneId && (
            <ProgressiveReveal scrollOnReveal={scrollOnReveal} show settled={false}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[var(--toss-gray-600)]">
                    AI 문체 가이드
                  </span>
                  {guideCustomized ? (
                    <button
                      type="button"
                      onClick={regenerateGuide}
                      className="toss-text-link"
                    >
                      선택값으로 다시 생성
                    </button>
                  ) : null}
                </div>
                <textarea
                  value={draft.styleGuide}
                  onChange={(e) => {
                    setGuideCustomized(true);
                    setDraft({ ...draft, styleGuide: e.target.value });
                  }}
                  rows={14}
                  className="toss-textarea font-mono text-[13px] leading-relaxed"
                />
              </div>
            </ProgressiveReveal>
          )}
        </div>
        </TossSelectProvider>
    </div>
  );
}
