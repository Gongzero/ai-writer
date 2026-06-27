"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ClientErrorBoundary:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--toss-gray-100)] px-6 text-center">
        <p className="text-[18px] font-semibold text-[var(--foreground)]">
          화면을 불러오지 못했어요
        </p>
        <p className="max-w-sm text-[14px] leading-relaxed text-[var(--toss-gray-600)]">
          개발 중 캐시가 꼬였을 수 있어요. 새로고침하거나 터미널에서{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-[13px]">npm run dev:fresh</code>
          를 실행해 주세요.
        </p>
        <button type="button" onClick={this.handleReload} className="toss-btn-primary px-6 py-3">
          새로고침
        </button>
      </div>
    );
  }
}
