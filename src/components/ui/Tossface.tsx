"use client";

import { Children, type ReactNode } from "react";

interface TossfaceProps {
  emoji: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClass = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-[28px]",
  xl: "text-4xl",
} as const;

export function Tossface({ emoji, className = "", size = "md" }: TossfaceProps) {
  return (
    <span
      className={`tossface inline-block leading-none ${sizeClass[size]} ${className}`}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

interface TossActionRowProps {
  emoji: string;
  emojiBg: string;
  title: string;
  description: string;
  onClick: () => void;
}

export function TossActionRow({
  emoji,
  emojiBg,
  title,
  description,
  onClick,
}: TossActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 py-4 text-left transition active:bg-[var(--toss-gray-50)]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
        style={{ backgroundColor: emojiBg }}
      >
        <Tossface emoji={emoji} size="md" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-snug text-[var(--foreground)]">
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--toss-gray-600)]">
          {description}
        </span>
      </span>
      <ChevronIcon />
    </button>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[var(--toss-gray-400)]"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TossActionGroupProps {
  children: ReactNode;
  className?: string;
}

export function TossActionGroup({ children, className = "" }: TossActionGroupProps) {
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </div>
  );
}
