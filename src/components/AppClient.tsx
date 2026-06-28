"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

function isChunkOrCacheError(message: string) {
  return /ChunkLoadError|Cannot find module|is not a function|Loading chunk/i.test(
    message
  );
}

function BootScreen({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 text-center">
      <p className="text-[18px] font-semibold text-[var(--foreground)]">{title}</p>
      <p className="max-w-sm text-[14px] leading-relaxed text-[var(--toss-gray-600)]">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="toss-btn-primary px-6 py-3">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function AppClient() {
  const [boot, setBoot] = useState<"loading" | "ready" | "error">("loading");
  const [bootError, setBootError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [AppRoot, setAppRoot] = useState<ComponentType | null>(null);

  const loadApp = useCallback(async () => {
    setBoot("loading");
    setBootError(null);
    try {
      const mod = await import("@/components/AppRoot");
      setAppRoot(() => mod.AppRoot);
      setBoot("ready");
      sessionStorage.removeItem("webnovel-chunk-reload");
    } catch (e) {
      console.error("AppRoot load failed:", e);
      const message = e instanceof Error ? e.message : "앱을 불러오지 못했습니다.";
      setBootError(message);
      setBoot("error");
    }
  }, []);

  useEffect(() => {
    void loadApp();
  }, [loadApp, retryKey]);

  useEffect(() => {
    const recover = (message: string) => {
      if (!isChunkOrCacheError(message)) return;
      const key = "webnovel-chunk-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return;
      }
      setBoot("error");
      setBootError(
        "개발 서버 캐시가 꼬였을 수 있어요. 터미널에서 dev 서버를 재시작(npm run dev)한 뒤 새로고침해 주세요."
      );
    };

    const onError = (event: ErrorEvent) => {
      recover(event.message ?? "");
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      recover(reason instanceof Error ? reason.message : String(reason ?? ""));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (boot === "loading") {
    return (
      <BootScreen
        title="불러오는 중…"
        description="잠시만 기다려 주세요."
      />
    );
  }

  if (boot === "error" || !AppRoot) {
    return (
      <BootScreen
        title="화면을 불러오지 못했어요"
        description={
          bootError ??
          "개발 중 캐시가 꼬였을 수 있어요. 터미널에서 dev 서버를 재시작(npm run dev)한 뒤 새로고침해 주세요."
        }
        actionLabel="다시 시도"
        onAction={() => setRetryKey((key) => key + 1)}
      />
    );
  }

  return (
    <ClientErrorBoundary>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </ClientErrorBoundary>
  );
}
