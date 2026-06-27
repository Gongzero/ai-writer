"use client";

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface MobileTopbarNavProps {
  title: string;
  onBack: () => void;
  onDelete?: () => void;
}

export function MobileTopbarNav({ title, onBack, onDelete }: MobileTopbarNavProps) {
  return (
    <div className="toss-editor-topbar-detail-view">
      <div className="toss-mobile-detail-lead">
        <button
          type="button"
          onClick={onBack}
          className="toss-mobile-detail-back"
          aria-label="목록"
        >
          <BackIcon />
        </button>
        <h1 className="toss-editor-topbar-title">{title}</h1>
      </div>
      {onDelete ? (
        <button type="button" onClick={onDelete} className="toss-mobile-detail-delete">
          삭제
        </button>
      ) : null}
    </div>
  );
}
