"use client";

import { useEffect } from "react";

function isChunkOrCacheError(message: string) {
  return /Cannot find module|ChunkLoadError|__webpack_modules__|Loading chunk|is not a function/i.test(
    message
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const recoverable = isChunkOrCacheError(error.message);

  useEffect(() => {
    if (!recoverable) return;
    const key = "webnovel-chunk-reload";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      window.location.reload();
    }
  }, [recoverable, error.message]);

  if (recoverable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center">
        <p className="text-[16px] font-semibold text-[var(--foreground)]">
          캐시를 복구하는 중…
        </p>
        <p className="text-[14px] text-[var(--toss-gray-600)]">
          잠시 후 자동으로 새로고침됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 text-center">
      <p className="text-[18px] font-semibold text-[var(--foreground)]">
        문제가 발생했어요
      </p>
      <p className="max-w-sm text-[14px] leading-relaxed text-[var(--toss-gray-600)]">
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <button type="button" onClick={reset} className="toss-btn-primary px-6 py-3">
        다시 시도
      </button>
    </div>
  );
}
