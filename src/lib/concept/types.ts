import type { ConceptAffinity } from "./filter-concept-options";

export interface ConceptPreset {
  id: string;
  label: string;
  description: string;
  rules: string;
  group?: string;
  /** 캐스케이딩 상위 id (장르·무대 2단계) */
  parentId?: string;
  affinity?: ConceptAffinity;
}
