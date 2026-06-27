import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProjectData } from "./types";
import { contentRulesFor } from "./content-rating";
import { getSelectedContextText, type ContextChip } from "./context";
import type { ChapterBriefing } from "./chapter-briefing";
import { buildBriefingSummary } from "./chapter-briefing";
import { formatGeminiError } from "./gemini-errors";
import { normalizeGeminiModel } from "./gemini-models";

function getClient(apiKey: string) {
  if (!apiKey.trim()) {
    throw new Error("Gemini API 키가 없습니다. ⚙ 설정에서 키를 입력하세요.");
  }
  return new GoogleGenerativeAI(apiKey.trim());
}

function getModel(project: ProjectData) {
  const genAI = getClient(project.settings.apiKey);
  const modelId = normalizeGeminiModel(project.settings.model);
  return { genAI, modelId, model: genAI.getGenerativeModel({ model: modelId }) };
}

async function runGemini<T>(
  project: ProjectData,
  fn: (model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>) => Promise<T>
): Promise<T> {
  const { model, modelId } = getModel(project);
  try {
    return await fn(model);
  } catch (e) {
    throw new Error(formatGeminiError(e, modelId));
  }
}

export async function recommendContextWithGemini(
  project: ProjectData,
  instruction: string
): Promise<string[]> {
  const files = project.bibleFiles.map((f) => ({
    id: f.id,
    title: f.title,
    category:
      project.categories.find((c) => c.id === f.categoryId)?.title ?? "기타",
    preview: f.content.slice(0, 200),
  }));

  if (files.length === 0) {
    throw new Error("바이블에 파일이 없습니다. 바이블 탭에서 설정을 먼저 추가하세요.");
  }

  const prompt = `당신은 웹소설 집필 어시스턴트입니다.
이번 화 지시사항을 보고 집필에 필요한 바이블 파일 id만 JSON 배열로 골라주세요.

지시사항:
${instruction}

바이블 파일 목록:
${JSON.stringify(files, null, 2)}

규칙:
- 관련 있는 파일만 선택 (보통 2~8개)
- 반드시 JSON 배열만 출력. 예: ["f1","f2"]
- 설명 없이 배열만`;

  return runGemini(project, async (model) => {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("AI 컨텍스트 추천 응답을 파싱하지 못했습니다.");
    const ids = JSON.parse(match[0]) as string[];
    return ids.filter((id) => project.bibleFiles.some((f) => f.id === id));
  });
}

export async function generateChapterOutline(
  project: ProjectData,
  additionalInstruction: string,
  chips: ContextChip[],
  briefing: ChapterBriefing,
  clues: string[]
): Promise<string> {
  const context = getSelectedContextText(project, chips, briefing.chapterNumber);
  const briefingText = buildBriefingSummary(briefing);
  const { microPosition, chapterNumber } = briefing;

  let positionGuide = "";
  if (microPosition) {
    positionGuide = `
이번 ${chapterNumber}화는 소아크 ${microPosition.fromChapter}~${microPosition.toChapter}화 구간의 ${microPosition.index}/${microPosition.total}번째 화입니다.
소아크 전체 요약을 ${microPosition.total}화로 나눴을 때, **이번 화에 해당하는 장면만** 아웃라인으로 작성하세요.
다른 화에서 다룰 내용은 넣지 마세요.`;
  }

  const prompt = `웹소설 ${chapterNumber}화의 장면 뼈대(아웃라인)를 작성하세요.

【문체 규칙】
${project.settings.styleGuide}

【이용등급】
${contentRulesFor(project.settings.contentRating)}

【이번 화 브리핑 — 소아크 기준】
${briefingText}
${positionGuide}

${additionalInstruction.trim() ? `【추가 지시】\n${additionalInstruction.trim()}` : ""}

【참고 컨텍스트】
${context || "(없음)"}

${clues.length > 0 ? `【열린 복선】\n${clues.join("\n")}` : ""}

출력 형식:
장면1: ...
장면2: ...
(이번 화에 맞게 3~6개 장면, 한 장면당 1~2문장)`;

  return runGemini(project, async (model) => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });
}

export async function generateOutline(
  project: ProjectData,
  instruction: string,
  chips: ContextChip[],
  chapterNumber: number,
  clues: string[]
): Promise<string> {
  const context = getSelectedContextText(project, chips, chapterNumber);

  const prompt = `웹소설 ${chapterNumber}화의 장면 뼈대(아웃라인)를 작성하세요.

【문체 규칙】
${project.settings.styleGuide}

【이용등급】
${contentRulesFor(project.settings.contentRating)}

【이번 화 지시사항】
${instruction}

【참고 컨텍스트】
${context || "(바이블 없음)"}

${clues.length > 0 ? `【열린 복선 후보】\n${clues.join("\n")}` : ""}

출력 형식:
장면1: ...
장면2: ...
(4~8개 장면, 한 장면당 1~2문장)`;

  return runGemini(project, async (model) => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });
}

export async function* streamBody(
  project: ProjectData,
  instruction: string,
  chips: ContextChip[],
  chapterNumber: number,
  outline: string
): AsyncGenerator<string> {
  const { model, modelId } = getModel(project);
  const context = getSelectedContextText(project, chips, chapterNumber);
  const targetLen = project.settings.defaultChapterLength;

  const prompt = `웹소설 ${chapterNumber}화 본문을 작성하세요.

【문체 규칙】
${project.settings.styleGuide}

【이용등급】
${contentRulesFor(project.settings.contentRating)}

【목표 분량】
약 ${targetLen}자 (±10%)

【이번 화 지시사항】
${instruction}

【참고 컨텍스트 — 인물·세계관·사건·줄거리】
${context || "(없음)"}

【확정 아웃라인 — 반드시 순서대로 전개】
${outline}

규칙:
- 아웃라인의 모든 장면을 빠짐없이 본문으로 풀어내세요
- 대사는 큰따옴표, 문단 사이 빈 줄
- 설정과 모순되지 않게
- 본문만 출력 (해설·메타 코멘트 없음)`;

  try {
    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (e) {
    throw new Error(formatGeminiError(e, modelId));
  }
}
