"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ProgressiveRevealProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  settled?: boolean;
  scrollOnReveal?: boolean;
}

export function ProgressiveReveal({
  show,
  children,
  className = "",
  settled = false,
  scrollOnReveal = true,
}: ProgressiveRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!show) {
      setOpen(false);
      return;
    }
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [show]);

  useEffect(() => {
    if (!show || !scrollOnReveal || !open || !ref.current) return;
    const timer = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [show, scrollOnReveal, open]);

  if (!show) return null;

  return (
    <div
      ref={ref}
      className={`toss-reveal-grid ${open ? "toss-reveal-grid-open" : ""} ${
        settled ? "toss-reveal-settled" : ""
      } ${className}`.trim()}
    >
      <div className="toss-reveal-grid-inner">
        <div className="pb-6">{children}</div>
      </div>
    </div>
  );
}
