"use client";

import { BibleNavIcon } from "@/components/ui/BibleNavIcon";
import { BibleRowDeleteButton } from "@/components/ui/BibleRowDeleteButton";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { ensureMicroOutline } from "@/lib/micro-arc";
import {
  allMicroArcStagesFilled,
  formatMicroArcChapterRange,
  microArcStageLabel,
  sortMicroOutline,
} from "@/lib/micro-arc-stages";
import {
  formatArcChapterRange,
  MACRO_ARC_STAGE_OPTIONS,
  sortArcOutline,
} from "@/lib/arc-stages";
import type { ArcBlock, MicroArcBlock } from "@/lib/types";

interface ArcOutlineListProps {
  arcs: ArcBlock[];
  selectedArcId: string | null;
  selectedMicroArcId: string | null;
  onSelectMacro: (id: string) => void;
  onSelectMicro: (macroArcId: string, microArcId: string) => void;
  onAdd: () => void;
  onAddMicro: (macroArcId: string) => void;
  onDelete: (arcId: string) => void;
  onDeleteMicro: (macroArcId: string, microArcId: string) => void;
  onReorderRising?: (arcId: string, direction: "up" | "down") => void;
  adding?: boolean;
}

function MacroArcRow({
  arc,
  selected,
  onSelect,
  onDelete,
  onRequestDelete,
  canMoveUp,
  canMoveDown,
  onReorderRising,
}: {
  arc: ArcBlock;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRequestDelete: (onConfirm: () => void) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onReorderRising?: (direction: "up" | "down") => void;
}) {
  const isRising = arc.stage === "macro-rising";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(onDelete);
  };

  return (
    <div className="toss-bible-nav-row-wrap toss-arc-nav-row-wrap">
      <button
        type="button"
        onClick={onSelect}
        className={`toss-bible-nav-row ${selected ? "toss-bible-nav-row-active" : ""}`}
      >
        <BibleNavIcon kind="file" />
        <span className="toss-arc-nav-text">
          <span className="toss-bible-nav-label truncate">{arc.title}</span>
          <span className="toss-arc-nav-meta">{formatArcChapterRange(arc)}</span>
        </span>
      </button>

      {isRising && onReorderRising ? (
        <>
          <button
            type="button"
            aria-label="위로"
            disabled={!canMoveUp}
            onClick={(e) => {
              e.stopPropagation();
              onReorderRising("up");
            }}
            className="toss-bible-nav-mini-btn toss-arc-nav-action-reveal disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="아래로"
            disabled={!canMoveDown}
            onClick={(e) => {
              e.stopPropagation();
              onReorderRising("down");
            }}
            className="toss-bible-nav-mini-btn toss-arc-nav-action-reveal disabled:opacity-40"
          >
            ↓
          </button>
        </>
      ) : null}

      <BibleRowDeleteButton label={arc.title} onClick={handleDelete} />
    </div>
  );
}

function MicroArcRow({
  microArc,
  selected,
  onSelect,
  onDelete,
  onRequestDelete,
}: {
  microArc: MicroArcBlock;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRequestDelete: (onConfirm: () => void) => void;
}) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(onDelete);
  };

  return (
    <div className="toss-bible-nav-row-wrap toss-arc-nav-row-wrap toss-arc-micro-row-wrap">
      <button
        type="button"
        onClick={onSelect}
        className={`toss-bible-nav-row toss-arc-micro-nav-row ${selected ? "toss-bible-nav-row-active" : ""}`}
      >
        <BibleNavIcon kind="file" />
        <span className="toss-arc-nav-text">
          <span className="toss-bible-nav-label truncate">{microArc.title}</span>
          <span className="toss-arc-nav-meta">
            {microArcStageLabel(microArc.stage)} · {formatMicroArcChapterRange(microArc)}
          </span>
        </span>
      </button>

      <BibleRowDeleteButton label={microArc.title} onClick={handleDelete} />
    </div>
  );
}

export function ArcOutlineList({
  arcs,
  selectedArcId,
  selectedMicroArcId,
  onSelectMacro,
  onSelectMicro,
  onAdd,
  onAddMicro,
  onDelete,
  onDeleteMicro,
  onReorderRising,
  adding = false,
}: ArcOutlineListProps) {
  const { requestDelete, deleteConfirmModal } = useDeleteConfirm();
  const sorted = sortArcOutline(arcs);
  const rising = sorted.filter((a) => a.stage === "macro-rising");
  const risingIndex = new Map(rising.map((a, i) => [a.id, i]));

  const stageGroups = MACRO_ARC_STAGE_OPTIONS.map((stage) => ({
    ...stage,
    items: sorted.filter((a) => a.stage === stage.id),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <div className="toss-bible-tree toss-arc-tree">
        {sorted.length > 0 ? (
          <div className="toss-bible-category-list">
            {stageGroups.map((group) => (
              <section key={group.id} className="toss-bible-group">
                <div className="toss-arc-stage-header">
                  <span className="toss-bible-category-name">{group.label}</span>
                </div>
                <div className="toss-bible-group-items">
                  {group.items.map((arc) => {
                    const isRising = arc.stage === "macro-rising";
                    const idx = isRising ? (risingIndex.get(arc.id) ?? -1) : -1;
                    const microOutline = sortMicroOutline(ensureMicroOutline(arc));
                    const macroSelected =
                      selectedArcId === arc.id && selectedMicroArcId == null;

                    return (
                      <div key={arc.id} className="toss-arc-macro-block">
                        <MacroArcRow
                          arc={arc}
                          selected={macroSelected}
                          onSelect={() => onSelectMacro(arc.id)}
                          onDelete={() => onDelete(arc.id)}
                          onRequestDelete={requestDelete}
                          canMoveUp={isRising && idx > 0}
                          canMoveDown={isRising && idx >= 0 && idx < rising.length - 1}
                          onReorderRising={
                            onReorderRising
                              ? (direction) => onReorderRising(arc.id, direction)
                              : undefined
                          }
                        />

                        <div className="toss-arc-micro-items">
                          {microOutline.map((microArc) => (
                            <MicroArcRow
                              key={microArc.id}
                              microArc={microArc}
                              selected={
                                selectedArcId === arc.id &&
                                selectedMicroArcId === microArc.id
                              }
                              onSelect={() => onSelectMicro(arc.id, microArc.id)}
                              onDelete={() => onDeleteMicro(arc.id, microArc.id)}
                              onRequestDelete={requestDelete}
                            />
                          ))}

                          {!allMicroArcStagesFilled(microOutline) ? (
                            <button
                              type="button"
                              onClick={() => onAddMicro(arc.id)}
                              className="toss-bible-nav-row toss-bible-nav-row-action toss-arc-micro-add"
                            >
                              <BibleNavIcon kind="add" />
                              <span className="toss-bible-nav-label">소아크 추가</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onAdd}
          disabled={adding}
          className="toss-bible-nav-row toss-bible-nav-row-action toss-bible-add-category disabled:opacity-40"
        >
          <BibleNavIcon kind="add" />
          <span className="toss-bible-nav-label">{adding ? "추가 중…" : "아크 추가"}</span>
        </button>
      </div>
      {deleteConfirmModal}
    </>
  );
}
