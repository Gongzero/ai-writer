"use client";

import { useCallback, useState } from "react";
import { ReadinessWarningModal } from "@/components/ui/ReadinessWarningModal";
import type { ReadinessItem } from "@/lib/readiness";

interface PendingAiAction {
  warnings: ReadinessItem[];
  onProceed: () => void;
  title?: string;
}

export function useReadinessWarning() {
  const [pending, setPending] = useState<PendingAiAction | null>(null);

  const requestAiProceed = useCallback(
    (warnings: ReadinessItem[], onProceed: () => void, title?: string) => {
      if (warnings.length === 0) {
        onProceed();
        return;
      }
      setPending({ warnings, onProceed, title });
    },
    []
  );

  const close = useCallback(() => setPending(null), []);

  const proceed = useCallback(() => {
    if (!pending) return;
    const action = pending.onProceed;
    setPending(null);
    action();
  }, [pending]);

  const readinessWarningModal = (
    <ReadinessWarningModal
      open={pending != null}
      title={pending?.title}
      warnings={pending?.warnings ?? []}
      onClose={close}
      onProceed={proceed}
    />
  );

  return { requestAiProceed, readinessWarningModal };
}
