export function BibleNavIcon({ kind }: { kind: "folder" | "file" | "add" }) {
  if (kind === "folder") {
    return (
      <span className="toss-bible-nav-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 8.5V18a1.5 1.5 0 001.5 1.5h13A1.5 1.5 0 0020 18V9.5A1.5 1.5 0 0018.5 8H12L10 6H5.5A1.5 1.5 0 004 7.5v1z"
            fill="#FFB331"
            stroke="#E69520"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (kind === "file") {
    return (
      <span className="toss-bible-nav-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#F2F4F6" />
          <path
            d="M8 7.5h8v1.5H8V7.5zm0 3.5h8v1.5H8V11zm0 3.5h5.5v1.5H8V14.5z"
            fill="#B0B8C1"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="toss-bible-nav-icon toss-bible-nav-icon-add" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" />
        <path
          d="M12 8v8M8 12h8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
