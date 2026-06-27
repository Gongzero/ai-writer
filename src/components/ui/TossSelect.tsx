"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { TossSelectContext, TossSelectProvider, type TossSelectOption } from "@/components/ui/toss-select-context";

export { TossSelectProvider };
export type { TossSelectOption };

interface TossSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TossSelectOption[];
  label: string;
  placeholder?: string;
  allowEmpty?: boolean;
  onOpen?: () => void;
  onAfterSelect?: () => void;
  requestOpen?: boolean;
  onRequestOpenHandled?: () => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 text-[var(--toss-gray-400)] transition-transform duration-300 ease-out ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M5 12.5l4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TossSelect({
  value,
  onChange,
  options,
  label,
  placeholder = "선택하세요",
  allowEmpty = false,
  onOpen,
  onAfterSelect,
  requestOpen = false,
  onRequestOpenHandled,
}: TossSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const ignoreOutsideCloseRef = useRef(false);
  const ctx = useContext(TossSelectContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = ctx ? ctx.openId === id : localOpen;
  const [panelReady, setPanelReady] = useState(false);

  const selected = options.find((o) => o.id === value);
  const displayLabel = selected?.label ?? (allowEmpty || !value ? placeholder : value);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        onOpen?.();
        ignoreOutsideCloseRef.current = true;
        window.setTimeout(() => {
          ignoreOutsideCloseRef.current = false;
        }, 0);
      }
      if (ctx) {
        if (next) ctx.setOpenId(id);
        else if (ctx.openId === id) ctx.setOpenId(null);
        return;
      }
      setLocalOpen(next);
    },
    [ctx, id, onOpen]
  );

  useEffect(() => {
    if (!open) {
      setPanelReady(false);
      return;
    }
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelReady(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!requestOpen) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      onRequestOpenHandled?.();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [requestOpen, setOpen, onRequestOpenHandled]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ignoreOutsideCloseRef.current) return;
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  const pick = (optionId: string) => {
    onChange(optionId);
    setOpen(false);
    window.setTimeout(() => onAfterSelect?.(), 200);
  };

  return (
    <div ref={rootRef} className="toss-select-root">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        onClick={() => setOpen(!open)}
        className={`toss-select-trigger ${open ? "toss-select-trigger-open" : ""} ${
          !selected && (allowEmpty || !value) ? "toss-select-trigger-placeholder" : ""
        }`}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <ChevronIcon open={open} />
      </button>

      <div
        className={`toss-select-panel ${panelReady && open ? "toss-select-panel-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="toss-select-panel-inner">
          <ul role="listbox" className="toss-select-list">
            {options.map((option) => {
              const isSelected = option.id === value;
              return (
                <li key={option.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      pick(option.id);
                    }}
                    className={`toss-select-option ${
                      isSelected ? "toss-select-option-selected" : ""
                    } ${option.disabled ? "toss-select-option-disabled" : ""}`}
                  >
                    <span className="toss-select-option-label">
                      <span className="block text-[16px] leading-snug">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block text-[13px] font-normal leading-snug text-[var(--toss-gray-400)]">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="toss-select-option-trail">
                      {option.chip ? (
                        <span
                          className={`toss-select-option-chip toss-select-option-chip-${option.chip.tone}`}
                        >
                          {option.chip.label}
                        </span>
                      ) : null}
                      {isSelected ? (
                        <span className="toss-select-option-check text-[var(--toss-blue)]">
                          <CheckIcon />
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
