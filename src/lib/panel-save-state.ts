export interface PanelSaveState {
  dirty: boolean;
  saving: boolean;
  save: () => void;
  label?: string;
}
