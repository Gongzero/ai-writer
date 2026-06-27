import type { ContentRating } from "./types";

const PRESETS: Record<ContentRating, string> = {
  all: "전체 이용가: 과도한 폭력·선정성·욕설을 피하고 전연령에 적합한 표현을 유지하세요.",
  "12":
    "12세 이용가: 가벼운 갈등은 허용하나 폭력·공포·선정 묘사는 최소화하세요.",
  "15":
    "15세 이용가: 경미한 갈등·로맨스는 허용하나 선정적·잔인한 묘사는 자제하세요.",
  "19":
    "19세 이상: 성인向·폭력 표현은 허용하되 문체 가이드의 톤은 유지하세요.",
};

export function contentRulesFor(rating: ContentRating): string {
  return PRESETS[rating] ?? PRESETS["15"];
}

export function contentRatingLabel(rating: ContentRating | string): string {
  if (rating === "all") return "전체";
  if (rating === "12") return "12세";
  if (rating === "19") return "19세 이상";
  return "15세";
}

export const CONTENT_RATING_OPTIONS: { id: ContentRating; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "12", label: "12세" },
  { id: "15", label: "15세" },
  { id: "19", label: "19세 이상" },
];
