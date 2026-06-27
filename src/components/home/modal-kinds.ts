/**
 * Overlay panel kinds
 *
 * - confirm — 삭제 확인 등 짧은 확인 (300px, hug)
 * - prompt — 소설 만들기/불러오기 등 선택·진입 (400px 너비, hug, 최대 560px)
 * - modal — 폼 입력·설정·스텝 위저드 등 (560×560)
 */
export type ModalKind = "confirm" | "prompt" | "modal";

export const MODAL_PANEL_CLASS: Record<ModalKind, string> = {
  confirm: "toss-modal-panel-confirm",
  prompt: "toss-modal-panel-prompt",
  modal: "toss-modal-panel-modal",
};
