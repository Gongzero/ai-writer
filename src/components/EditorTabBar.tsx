"use client";

import { useEffect, useRef, useState } from "react";
import type { SidebarTab } from "@/lib/types";
import { SIDEBAR_TABS } from "@/lib/types";

interface EditorTabBarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export function EditorTabBar({ activeTab, onTabChange }: EditorTabBarProps) {
  const barRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<SidebarTab, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const bar = barRef.current;
      const tab = tabRefs.current[activeTab];
      if (!bar || !tab) return;
      const barRect = bar.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      setIndicator({
        left: tabRect.left - barRect.left + bar.scrollLeft,
        width: tabRect.width,
      });
    };

    const bar = barRef.current;
    update();
    window.addEventListener("resize", update);
    bar?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      bar?.removeEventListener("scroll", update);
    };
  }, [activeTab]);

  return (
    <nav ref={barRef} className="toss-editor-tabbar" role="tablist" aria-label="작업 메뉴">
      <span
        className="toss-editor-tab-indicator"
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
        }}
        aria-hidden
      />
      {SIDEBAR_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tab.id)}
            className={`toss-editor-tab ${active ? "toss-editor-tab-active" : ""}`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
