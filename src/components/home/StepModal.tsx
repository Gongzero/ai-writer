"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ModalCloseButton } from "@/components/home/ModalCloseButton";
import { ProgressiveReveal } from "@/components/ui/ProgressiveReveal";

interface StepModalProps {
  open: boolean;
  onClose: () => void;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function StepModal({
  open,
  onClose,
  step,
  totalSteps,
  title,
  description,
  children,
  footer,
}: StepModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="toss-modal-host">
      <button
        type="button"
        className="toss-modal-backdrop absolute inset-0 bg-black/40"
        aria-label="배경 닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="step-modal-title"
        className="toss-modal-panel toss-modal-panel-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="toss-modal-header">
          <div className="toss-modal-header-main">
            <p className="toss-modal-step-label">
              {step} / {totalSteps}
            </p>
            <h2 id="step-modal-title" className="toss-modal-header-title">
              {title}
            </h2>
            {description ? (
              <p className="toss-modal-header-desc">{description}</p>
            ) : null}
            <div className="toss-modal-step-progress">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`toss-modal-step-progress-bar ${
                    i < step ? "toss-modal-step-progress-bar-active" : ""
                  }`}
                />
              ))}
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </header>

        <div className="toss-modal-body" data-modal-scroll>
          <ProgressiveReveal key={step} show scrollOnReveal={false} settled={false}>
            {children}
          </ProgressiveReveal>
        </div>

        <footer className="toss-modal-footer">{footer}</footer>
      </div>
    </div>,
    document.body
  );
}
