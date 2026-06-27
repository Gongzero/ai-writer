"use client";

import type { ReadinessItem } from "@/lib/readiness";
import { readinessSummary } from "@/lib/readiness";
import type { SidebarTab } from "@/lib/types";

interface ReadinessChecklistProps {
  title?: string;
  items: ReadinessItem[];
  onNavigate?: (target: SidebarTab) => void;
  /** 빈 화면용 가로 스텝 */
  variant?: "card" | "steps";
  /** 생성 모달 등 — CTA가 있는 항목만 탭 이동 버튼 표시 */
  navigable?: boolean;
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.2 5.5 10.2 11.5 3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReadinessChecklist({
  title = "준비도",
  items,
  onNavigate,
  variant = "card",
  navigable = false,
}: ReadinessChecklistProps) {
  if (items.length === 0) return null;

  const { ok, warn, missing } = readinessSummary(items);
  const total = items.length;
  const done = ok === total;
  const progress = total > 0 ? Math.round((ok / total) * 100) : 0;

  if (variant === "steps") {
    return (
      <section className="toss-readiness-steps" aria-label={title}>
        <div className="toss-readiness-steps-track">
          {items.map((entry, index) => {
            const isDone = entry.status === "ok";
            const isNext = !isDone && items.slice(0, index).every((i) => i.status === "ok");
            return (
              <div
                key={entry.id}
                className={`toss-readiness-step ${
                  isDone ? "is-done" : isNext ? "is-next" : ""
                }`}
              >
                <div className="toss-readiness-step-dot" aria-hidden>
                  {isDone ? <CheckIcon /> : index + 1}
                </div>
                <span className="toss-readiness-step-label">{entry.label}</span>
              </div>
            );
          })}
        </div>
        {!done && onNavigate ? (
          <button
            type="button"
            className="toss-btn-soft-primary toss-readiness-steps-next"
            onClick={() => {
              const next = items.find((entry) => entry.status !== "ok");
              if (next?.cta) onNavigate(next.cta.target);
            }}
          >
            {items.find((entry) => entry.status !== "ok")?.hint ?? "다음 단계로"}
            <ChevronIcon />
          </button>
        ) : done ? (
          <p className="toss-readiness-steps-done">모든 준비가 끝났어요</p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="toss-readiness-card" aria-label={title}>
      {done ? (
        <div className="toss-readiness-done-banner">
          <span className="toss-readiness-done-icon" aria-hidden>
            <CheckIcon />
          </span>
          <div>
            <p className="toss-readiness-done-title">준비됐어요</p>
            <p className="toss-readiness-done-desc">집필을 시작해도 좋아요.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="toss-readiness-card-head">
            <p className="toss-readiness-card-title">{title}</p>
            <span className="toss-readiness-card-count">
              {ok}/{total}
            </span>
          </div>
          <div className="toss-readiness-progress" aria-hidden>
            <div
              className="toss-readiness-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      <ul className={`toss-readiness-rows ${done ? "is-all-done" : ""}`}>
        {items.map((entry) => {
          const isDone = entry.status === "ok";
          const canNavigate =
            navigable && !isDone && entry.cta && onNavigate;

          return (
            <li key={entry.id}>
              {canNavigate ? (
                <button
                  type="button"
                  className={`toss-readiness-row is-action ${isDone ? "is-done" : "is-pending"}`}
                  onClick={() => onNavigate(entry.cta!.target)}
                >
                  <ReadinessRowContent
                    entry={entry}
                    isDone={isDone}
                    showChevron
                  />
                </button>
              ) : (
                <div
                  className={`toss-readiness-row ${isDone ? "is-done" : "is-pending"}`}
                >
                  <ReadinessRowContent entry={entry} isDone={isDone} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!done && (warn > 0 || missing > 0) ? (
        <p className="toss-readiness-card-foot">
          {missing > 0 ? "필수" : "권장"} {warn + missing}개 남음
        </p>
      ) : null}
    </section>
  );
}

function ReadinessRowContent({
  entry,
  isDone,
  showChevron = false,
}: {
  entry: ReadinessItem;
  isDone: boolean;
  showChevron?: boolean;
}) {
  return (
    <>
      <span
        className={`toss-readiness-row-mark ${
          isDone ? "is-done" : entry.status === "missing" ? "is-missing" : "is-warn"
        }`}
        aria-hidden
      >
        {isDone ? <CheckIcon /> : null}
      </span>
      <span className="toss-readiness-row-label">{entry.label}</span>
      <span className="toss-readiness-row-trail">
        {isDone ? (
          "완료"
        ) : entry.hint ? (
          <span className="toss-readiness-row-hint">{entry.hint}</span>
        ) : null}
        {showChevron ? <ChevronIcon /> : null}
      </span>
    </>
  );
}
