"use client";

import type { SidebarTab } from "@/lib/types";
import { SIDEBAR_TABS } from "@/lib/types";
import { Tossface } from "@/components/ui/Tossface";

const TAB_ICONS: Record<SidebarTab, string> = {
  concept: "📋",
  bible: "📚",
  arc: "🗂️",
  chapters: "✍️",
};

interface EditorPrimaryNavProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  className?: string;
}

export function EditorPrimaryNav({
  activeTab,
  onTabChange,
  className,
}: EditorPrimaryNavProps) {
  return (
    <nav
      className={`toss-editor-primary-nav${className ? ` ${className}` : ""}`}
      aria-label="작업 영역"
    >
      {SIDEBAR_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={active ? "page" : undefined}
            className={`toss-editor-primary-nav-btn ${
              active ? "toss-editor-primary-nav-btn-active" : ""
            }`}
          >
            <span className="toss-editor-primary-nav-icon" aria-hidden>
              <Tossface emoji={TAB_ICONS[tab.id]} size="md" />
            </span>
            <span className="toss-editor-primary-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
