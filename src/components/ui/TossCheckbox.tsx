"use client";

function CheckMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6l2.2 2.2L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TossCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function TossCheckbox({ checked, onChange, label }: TossCheckboxProps) {
  return (
    <label className="toss-checkbox-wrap" title={label}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`toss-checkbox-ui ${checked ? "toss-checkbox-ui-checked" : ""}`}>
        {checked ? <CheckMark /> : null}
      </span>
    </label>
  );
}
