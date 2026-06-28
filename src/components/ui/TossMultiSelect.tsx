"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TossSelectOption } from "@/components/ui/toss-select-context";
import { TossSelectContext } from "@/components/ui/toss-select-context";
import { TossCheckbox } from "@/components/ui/TossCheckbox";

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

interface TossMultiSelectProps {
  label: string;
  legend?: string;
  multiLabel?: string;
  hint?: string;
  options: TossSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onConfirm?: () => void;
  exclusiveNoneId?: string;
  placeholder?: string;
  headerExtra?: ReactNode;
  footerExtra?: ReactNode;
  requestOpen?: boolean;
  onRequestOpenHandled?: () => void;
}

export function TossMultiSelect({
  label,
  legend,
  multiLabel,
  hint,
  options,
  selected,
  onChange,
  onConfirm,
  exclusiveNoneId,
  placeholder = "선택하세요",
  headerExtra,
  footerExtra,
  requestOpen = false,
  onRequestOpenHandled,
}: TossMultiSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const ignoreOutsideCloseRef = useRef(false);
  const ctx = useContext(TossSelectContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = ctx ? ctx.openId === id : localOpen;
  const [panelReady, setPanelReady] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);

  const displayLabel = (() => {
    if (selected.length === 0) return placeholder;
    const labels = selected
      .map((sid) => options.find((o) => o.id === sid)?.label)
      .filter(Boolean) as string[];
    if (labels.length === 0) return placeholder;
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return labels.join(", ");
    return `${labels[0]} 외 ${labels.length - 1}개`;
  })();

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        setDraft(selected);
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
    [ctx, id, selected]
  );

  const toggleDraft = (optionId: string, on: boolean) => {
    setDraft((prev) => {
      if (exclusiveNoneId) {
        if (optionId === exclusiveNoneId) {
          return on ? [exclusiveNoneId] : [];
        }
        const withoutNone = prev.filter((x) => x !== exclusiveNoneId);
        return on
          ? [...withoutNone, optionId]
          : withoutNone.filter((x) => x !== optionId);
      }
      return on ? [...prev, optionId] : prev.filter((x) => x !== optionId);
    });
  };

  const confirm = () => {
    onChange(draft);
    setOpen(false);
    window.setTimeout(() => onConfirm?.(), 200);
  };

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

  const showEmptyOptions = options.length === 0;

  return (
    <div ref={rootRef} className="toss-select-root toss-bible-form-field-block">
      {legend || label ? (
        <p className="toss-bible-form-label">{legend || label}</p>
      ) : null}
      {hint ? <p className="toss-bible-form-hint">{hint}</p> : null}

      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        className={`toss-select-trigger ${open ? "toss-select-trigger-open" : ""} ${
          selected.length === 0 ? "toss-select-trigger-placeholder" : ""
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
          <div className="toss-multi-select-panel">
            {headerExtra ? <div className="toss-multi-select-header">{headerExtra}</div> : null}
            <div className="toss-multi-select-body">
              {showEmptyOptions ? (
                <p className="px-1 py-3 text-center text-[14px] text-[var(--toss-gray-600)]">
                  표시할 태그가 없어요. 검색하거나 전체 태그 보기를 눌러 주세요.
                </p>
              ) : (
                <ul className="toss-multi-select-list">
                  {options.map((option) => {
                    const checked = draft.includes(option.id);
                    return (
                      <li key={option.id}>
                        <div className="toss-multi-option">
                          <TossCheckbox
                            checked={checked}
                            onChange={(on) => toggleDraft(option.id, on)}
                            label={option.label}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[16px] font-medium leading-snug text-[var(--foreground)]">
                              {option.label}
                            </span>
                            {option.description ? (
                              <span className="mt-0.5 block text-[13px] leading-snug text-[var(--toss-gray-400)]">
                                {option.description}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {footerExtra}
              <button
                type="button"
                onClick={confirm}
                className="toss-btn-confirm"
                disabled={showEmptyOptions}
              >
                {draft.length}개 선택 완료
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
