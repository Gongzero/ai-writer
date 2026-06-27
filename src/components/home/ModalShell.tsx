"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ModalCloseButton } from "@/components/home/ModalCloseButton";
import { MODAL_PANEL_CLASS, type ModalKind } from "@/components/home/modal-kinds";
import { useBottomSheet } from "@/hooks/useBottomSheet";

export type { ModalKind };

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** @default "modal" */
  kind?: ModalKind;
  variant?: "default" | "action";
  closeDisabled?: boolean;
}

export function ModalShell({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  kind = "modal",
  closeDisabled = false,
}: ModalShellProps) {
  const {
    visible,
    panelRef,
    panelStyle,
    backdropStyle,
    panelPhaseClass,
    requestDismiss,
    handleProps,
  } = useBottomSheet(open, onClose);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  return createPortal(
    <div className="toss-modal-host">
      <button
        type="button"
        className="toss-modal-backdrop absolute inset-0 bg-black/40"
        style={backdropStyle}
        aria-label="닫기"
        onClick={requestDismiss}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-shell-title" : undefined}
        style={panelStyle}
        className={`toss-modal-panel ${panelPhaseClass} ${MODAL_PANEL_CLASS[kind]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="toss-bottom-sheet-handle sm:hidden"
          role="presentation"
          aria-hidden
          {...handleProps}
        >
          <div className="toss-bottom-sheet-handle-bar" />
        </div>

        <header className="toss-modal-header">
          <div className="toss-modal-header-main">
            {title ? (
              <h2 id="modal-shell-title" className="toss-modal-header-title">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="toss-modal-header-desc">{description}</p>
            ) : null}
          </div>
          <ModalCloseButton
            onClick={requestDismiss}
            disabled={closeDisabled}
          />
        </header>

        <div className="toss-modal-body">{children}</div>

        {footer ? <footer className="toss-modal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body
  );
}
