"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const MOBILE_MQ = "(max-width: 767px)";
const CLOSE_RATIO = 0.22;
const SNAP_MS = 280;

function isMobileSheet() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

export function useBottomSheet(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(open);
  const [dragY, setDragY] = useState(0);
  const [phase, setPhase] = useState<"idle" | "dragging" | "snapping" | "closing">("idle");
  const dragStart = useRef({ pointerY: 0, offsetY: 0 });
  const animatingOutRef = useRef(false);

  const slideOut = useCallback((onDone: () => void) => {
    if (animatingOutRef.current) return;
    animatingOutRef.current = true;
    setPhase("closing");
    const height = panelRef.current?.offsetHeight ?? window.innerHeight * 0.5;
    setDragY(height);
    window.setTimeout(() => {
      animatingOutRef.current = false;
      onDone();
    }, SNAP_MS);
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setDragY(0);
      setPhase("idle");
      animatingOutRef.current = false;
      return;
    }
    if (!visible || animatingOutRef.current) return;
    if (isMobileSheet()) {
      slideOut(() => setVisible(false));
    } else {
      setVisible(false);
    }
  }, [open, visible, slideOut]);

  const requestDismiss = useCallback(() => {
    if (!isMobileSheet()) {
      onClose();
      return;
    }
    slideOut(() => {
      setVisible(false);
      onClose();
    });
  }, [onClose, slideOut]);

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMobileSheet() || phase === "closing" || animatingOutRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { pointerY: e.clientY, offsetY: dragY };
    setPhase("dragging");
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== "dragging") return;
    const delta = e.clientY - dragStart.current.pointerY;
    setDragY(Math.max(0, dragStart.current.offsetY + delta));
  };

  const finishDrag = () => {
    if (phase !== "dragging") return;
    const height = panelRef.current?.offsetHeight ?? 400;
    if (dragY > height * CLOSE_RATIO) {
      requestDismiss();
      return;
    }
    setPhase("snapping");
    setDragY(0);
    window.setTimeout(() => setPhase("idle"), SNAP_MS);
  };

  const panelHeight = panelRef.current?.offsetHeight ?? 0;
  const dragProgress =
    panelHeight > 0 ? Math.min(1, dragY / panelHeight) : dragY > 0 ? 0.3 : 0;

  const panelStyle: CSSProperties | undefined =
    dragY > 0 || phase === "snapping" || phase === "closing" || phase === "dragging"
      ? { transform: `translateY(${dragY}px)` }
      : undefined;

  const backdropStyle: CSSProperties | undefined =
    dragProgress > 0 ? { opacity: 1 - dragProgress * 0.55 } : undefined;

  const panelPhaseClass =
    phase === "dragging"
      ? "toss-bottom-sheet-dragging"
      : phase === "snapping" || phase === "closing"
        ? "toss-bottom-sheet-snapping"
        : "";

  return {
    visible,
    panelRef,
    panelStyle,
    backdropStyle,
    panelPhaseClass,
    requestDismiss,
    handleProps: {
      onPointerDown: onHandlePointerDown,
      onPointerMove: onHandlePointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
    },
  };
}
