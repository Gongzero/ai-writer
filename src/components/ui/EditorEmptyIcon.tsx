function BibleDocIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="2" width="18" height="20" rx="3.5" fill="#D1D6DB" />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="#8B95A1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EditorEmptyIcon() {
  return (
    <span className="toss-editor-empty-icon">
      <BibleDocIcon />
    </span>
  );
}
