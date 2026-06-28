"use client";

import { type ReactNode, type RefObject } from "react";
import { ProgressiveReveal } from "@/components/ui/ProgressiveReveal";

interface ConceptFlowStepProps {
  index: number;
  revealUpTo: number;
  embedded: boolean;
  overviewMode?: boolean;
  focusedStep: number;
  summaryLabel: string;
  summaryValue: string;
  activeRef?: RefObject<HTMLDivElement | null>;
  scrollOnReveal: boolean;
  onFocusStep?: (index: number, autoOpen?: boolean) => void;
  children: ReactNode;
}

export function ConceptFlowStep({
  index,
  revealUpTo,
  embedded,
  overviewMode = false,
  focusedStep,
  summaryLabel,
  summaryValue,
  activeRef,
  scrollOnReveal,
  onFocusStep,
  children,
}: ConceptFlowStepProps) {
  if (index > revealUpTo) return null;

  if (overviewMode) {
    if (focusedStep >= 0 && index !== focusedStep) return null;
    const isSingleStep = focusedStep >= 0;
    return (
      <div
        ref={isSingleStep ? activeRef : undefined}
        className={isSingleStep ? "toss-active-step" : "toss-concept-overview-step"}
      >
        {children}
      </div>
    );
  }

  const showFull = !embedded || index === focusedStep;
  const showSummary = embedded && !showFull;

  if (showSummary) {
    return (
      <button
        type="button"
        onClick={() => onFocusStep?.(index, true)}
        className="toss-summary-card w-full text-left"
      >
        <span className="toss-summary-card-body">
          <span className="toss-summary-card-label">{summaryLabel}</span>
          <span className="toss-summary-card-value">{summaryValue}</span>
        </span>
        <span className="toss-btn-change">변경</span>
      </button>
    );
  }

  const isFocused = embedded && index === focusedStep;

  return (
    <div
      ref={isFocused ? activeRef : undefined}
      className={isFocused ? "toss-active-step" : undefined}
    >
      <ProgressiveReveal
        show
        scrollOnReveal={scrollOnReveal && (!embedded || isFocused)}
        settled={!embedded && index < revealUpTo}
      >
        {children}
      </ProgressiveReveal>
    </div>
  );
}
