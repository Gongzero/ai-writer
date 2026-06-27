"use client";

import { createElement, useCallback, useRef, useState } from "react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export function useDeleteConfirm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingRef = useRef<(() => void | Promise<void>) | null>(null);

  const requestDelete = useCallback((onConfirm: () => void | Promise<void>) => {
    pendingRef.current = onConfirm;
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (busy) return;
    setOpen(false);
    pendingRef.current = null;
  }, [busy]);

  const handleConfirm = useCallback(async () => {
    const fn = pendingRef.current;
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn();
      setOpen(false);
      pendingRef.current = null;
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const deleteConfirmModal = createElement(DeleteConfirmModal, {
    open,
    busy,
    onClose: handleClose,
    onConfirm: () => void handleConfirm(),
  });

  return { requestDelete, deleteConfirmModal };
}
