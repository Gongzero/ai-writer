# AI 작가 — 프로젝트 개요 및 작업 정리

> 웹소설 창작 도구 **AI 작가**의 기능, 데이터 구조, UI/UX, 아키텍처, 반응형 규칙을 정리한 문서입니다.  
> 디자인 토큰·컴포넌트·모션·모바일 상세 UX의 상세 스펙은 [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)를 참고하세요.

*마지막 업데이트: 2026-06-28*

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [화면 구조·라우팅](#2-화면-구조라우팅)
3. [에디터 셸·내비게이션](#3-에디터-셸내비게이션)
4. [반응형·모바일 레이아웃](#4-반응형모바일-레이아웃)
5. [데이터 모델](#5-데이터-모델)
6. [주요 기능](#6-주요-기능)
7. [AI 생성 규칙](#7-ai-생성-규칙)
8. [컴포넌트·파일 맵](#8-컴포넌트파일-맵)
9. [코딩·UX 규칙](#9-코딩ux-규칙)
10. [UI/UX 변경 이력](#10-uiux-변경-이력)
11. [데이터·상태·저장소](#11-데이터상태저장소)
12. [배포·실사용 (예정)](#12-배포실사용-예정)
13. [알려진 이슈·향후 작업](#13-알려진-이슈향후-작업)

---

## 1. 프로젝트 소개

### 목적
소설의 **컨셉 → 바이블(설정집) → 회차 뼈대(거시·소아크) → 원고**까지 한곳에서 관리하고, Gemini API로 집필을 보조하는 **한국어 웹소설 창작 도구**입니다.

### 작업 흐름 (권장 순서)
1. **소설 컨셉** — 타겟·장르·무대·규칙·톤 → AI 문체 가이드 자동 합성
2. **바이블** — 인물 · 세계관 · 사건 설정집 작성
3. **회차 뼈대** — 거시 아크(대발단~대결말) + 소아크(소발단~소결말)
4. **원고** — 화별 지시 → 아웃라인 → 본문

### 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| 스타일 | `globals.css` `toss-*` + Tailwind 유틸 혼용 |
| 폰트 | Geist, Pretendard, Apple SD Gothic Neo, **Tossface** |
| AI | `@google/generative-ai` (Gemini) |
| 저장소 | **IndexedDB** (`idb-keyval`) — 브라우저 로컬 |
| 언어 | TypeScript |

### 실행 방법

```bash
npm run dev          # Turbopack dev (scripts/dev.mjs) — 청크 오류 시 자동 재시작
npm run dev:fresh    # 포트 정리 + .next 삭제 후 dev (캐시 오류 시)
npm run build        # 프로덕션 빌드 (scripts/build.mjs) — dev 실행 중이면 거부
npm run start        # 프로덕션 서버
```

> `dev`와 `build` **동시 실행 금지** — `build.mjs`가 포트 3000 dev 서버를 감지하면 빌드를 중단한다.  
> `Cannot find module './301.js'` 등 청크 오류 시 `npm run dev:fresh` 또는 Cmd+Shift+R.  
> `dev.mjs`는 Turbopack(`next dev --turbo`) 사용, 빌드 후 `.next-production-stamp`가 있으면 다음 dev 시 `.next` 자동 정리.

---

## 2. 화면 구조·라우팅

### 앱 라우팅

```
page.tsx → AppClient (동적 import + 청크 오류 복구) → ClientErrorBoundary → AppRoot
  ├── home   → HomeScreen (작품 목록·생성·불러오기)
  └── editor → AppShell (집필 셸)
```

### 부트·안정성 (`AppClient`)

- `AppRoot`를 `import()`로 지연 로드 — 초기 번들 분리
- 청크·캐시 오류(`Cannot find module`, `ChunkLoadError` 등) 감지 시 **1회 자동 새로고침**
- 재실패 시 `dev:fresh` 안내 + 「다시 시도」버튼
- 런타임 오류는 `ClientErrorBoundary`가 포착

### 홈 (`AppRoot`)
- `CreateNovelModal` — 빠른 생성 / 마법사 진입
- `CreateWizardModal` — 단계별 첫 작품 설정
- `LoadNovelModal` — 기존 작품 열기
- IndexedDB 라이브러리에서 프로젝트 목록 관리

---

## 3. 에디터 셸·내비게이션

### 데스크톱 레이아웃 (≥768px)

```
┌────────────────────────────────────────────────────────┐
│ {소설 제목}                        [저장] [⚙️] [✕]     │
├────┬──────────┬──────────────────────────────────────────┤
│ 📋 │ 280px    │  본문                                     │
│ 📚 │ 리스트   │                                          │
│ 🗂️ │ 패널     │                                          │
│ ✍️ │          │                                          │
└────┴──────────┴──────────────────────────────────────────┘
 76px EditorPrimaryNav (세로)
```

| 탭 id | 라벨 | 리스트 | 본문 |
|-------|------|--------|------|
| `concept` | 소설 컨셉 | 없음 | `ConceptWorkspace` (max 720px) |
| `bible` | 바이블 | `BibleTree` | `BibleFileEditor` |
| `arc` | 회차 뼈대 | `ArcOutlineList` | `ArcEditor` / `MicroArcEditor` |
| `chapters` | 원고 | `ChapterList` | `ChapterEditor` |

### 탭 기본값
- 첫 실행 (바이블·아크 비어 있음) → **`concept`**
- 그 외 → `settings.lastSidebarTab` / fallback **`chapters`**

### 1차 내비 (`EditorPrimaryNav`)
- Tossface 이모지 + 라벨
- 데스크톱: 76px 세로, 라벨 11px
- 모바일: 하단 가로 탭 (§4 참고)

### 탑바 (`AppShell` header)
- **기본**: 소설 제목 + (컨셉 dirty 시) 저장 + 설정 + 나가기
- **모바일 상세**: `MobileTopbarNav` — ←, 제목, 삭제(bible/arc; 원고는 리스트 행 삭제)

---

## 4. 반응형·모바일 레이아웃

> 시각·CSS 클래스·모션 상세: [`DESIGN_SYSTEM.md` §6, §11, §12](./DESIGN_SYSTEM.md)

### 브레이크포인트

| 기준 | 적용 범위 |
|------|-----------|
| **`max-width: 767px`** | 에디터 마스터-디테일, 하단 탭, 상세 헤더/저장 |
| **`max-width: 639px`** | `ModalShell` 바텀시트·핸들 드래그 (`useBottomSheet`) |

### 모바일 — 목록 단계

- `toss-editor-body` → `flex-direction: column`
- 워크스페이스 **위**, 1차 내비 **아래** (iOS 탭 바 패턴)
- 하단 탭: `gap: 8px`, `padding: 10px 12px`, 라벨 **12px**, safe-area-bottom

### 모바일 — 상세 단계 (`hasMobileDetail`)

**트리거 조건** (`AppShell`):

```ts
hasMobileDetail =
  bible    → selectedBibleFile 존재
  arc      → selectedArc 존재 (소아크 선택 포함)
  chapters → selectedChapter 존재
  concept  → 항상 false
```

**UX 변화**:

| 요소 | 목록 단계 | 상세 단계 |
|------|-----------|-----------|
| 하단 탭 | 표시 | **숨김** (`.toss-hide-on-mobile-detail`) |
| 탑바 | 제목·설정·닫기 | **← + 제목 + 삭제** |
| 저장 | (컨셉만 탑바) | **하단 전체 너비** `MobileDetailBottomSave` |
| 편집기 인라인 저장 | 표시 | **숨김** (`.toss-editor-inline-save`) |
| 리스트/본문 | 리스트만 | 본문 슬라이드 인 (`.toss-editor-split-detail`) |

**슬라이드 전환**:
- 목록: `translateX(0)`
- 본문 진입: 콘텐츠 `translateX(0)`, 목록 `translateX(-24%)` + fade out
- easing: `cubic-bezier(0.22, 1, 0.36, 1)`, ~340ms

**뒤로 가기** (`handleMobileBack`):
- bible → `selectedBibleFileId = null`
- arc → `selectedArcId`, `selectedMicroArcId` null
- chapters → `selectedChapterId = null`

**모바일 삭제** (`handleMobileDelete`):
- bible: 선택 파일 삭제
- arc: 소아크 선택 시 소아크 삭제, 아니면 거시 아크 삭제
- chapters: 상세 헤더 삭제 없음 — `ChapterList` 행 삭제 사용
- `useDeleteConfirm` 모달 사용

### `PanelSaveState` — 모바일 저장 연동

```ts
// src/lib/panel-save-state.ts
interface PanelSaveState {
  dirty: boolean;
  saving: boolean;
  save: () => void;
  label?: string;
}
```

`BibleFileEditor`, `ArcEditor`, `MicroArcEditor`, `ChapterEditor`가 `onSaveStateChange`로 `AppShell.detailSave`에 보고 → `MobileDetailBottomSave`가 렌더.

### 모달·바텀시트 (모바일)

`ModalShell` + `useBottomSheet`:
- **진입**: 화면 아래에서 위로 슬라이드
- **핸들 드래그**: 손가락 따라 `translateY`, 22% 이상이면 닫기
- **배경 탭**: 슬라이드아웃 후 닫기
- **오버레이 3종** (`ModalShell` `kind`):
  - **컨펌** `confirm` — 300px hug (삭제 확인)
  - **프롬프트** `prompt` — 400px hug, max 560px (소설 만들기·불러오기)
  - **모달** `modal` — **560×560** (설정, 생성, 컨셉 편집, 이 화 쓰기 등)
- 헤더: 제목·설명 좌측 / 닫기 우측. 바디 스크롤, 푸터는 액션만 (닫기 전용 푸터 제거)

### viewport (`layout.tsx`)

```ts
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
```

---

## 5. 데이터 모델

### `ProjectData` 주요 필드

| 필드 | 설명 |
|------|------|
| `id`, `meta` | 프로젝트 ID·제목·시간 |
| `settings` | 컨셉 10축, API, `lastSidebarTab`, `styleGuide`, `pinnedWorldBibleIds` (고정 세계관) |
| `categories` / `subfolders` / `bibleFiles` | 바이블 트리 |
| `arcOutline` | 거시 아크 배열 (`ArcBlock[]`) |
| `chapters` | 원고 화 배열 |

### 바이블 (`BibleFile`)

```typescript
interface BibleFile {
  id: string;
  categoryId: string;
  subfolderId: string | null;
  title: string;
  content: string;   // 카테고리별 구조화 직렬화
  tags?: string[];
}
```

**기본 카테고리**: `characters`(인물), `world`(세계관), `events`(사건) + 사용자 추가

| 카테고리 | lib | 주요 필드 |
|----------|-----|-----------|
| 인물 | `bible-character.ts` | 이름(title), 성별, 등장/퇴장 회차, 설정 |
| 세계관 | `bible-world.ts` | 주제, 이름, 설명 |
| 사건 | `bible-event.ts` | 이름, 배경, 시작/종료 회차, 등장 인물(다중 ID), 설정 |
| 기타 | — | 제목 + 내용 |

`content`는 `키: 값` 메타 헤더 + 빈 줄 + 본문 형태로 직렬화. 레거시 단일 본문도 parse 시 호환.

### 회차 뼈대 — 거시 아크 (`ArcBlock`)

```typescript
interface ArcBlock {
  id: string;
  stage: MacroArcStage;   // 대발단 ~ 대결말
  order: number;          // 대전개(macro-rising) 내 순서
  title: string;
  summary: string;
  fromChapter?: number;
  toChapter?: number;
  microOutline?: MicroArcBlock[];
  characterIds?: string[];  // 바이블 인물 파일 ID
  eventIds?: string[];      // 바이블 사건 파일 ID
}
```

**거시 단계** (`src/lib/arc-stages.ts`):

| stage | 라벨 | 비고 |
|-------|------|------|
| `macro-exposition` | 대발단 | 슬롯 1개 |
| `macro-rising` | 대전개 | 복수, order 정렬·재정렬 |
| `macro-crisis` | 대위기 | 슬롯 1개 |
| `macro-climax` | 대절정 | 슬롯 1개 |
| `macro-resolution` | 대결말 | 슬롯 1개 |

회차 범위 겹침 검증: `validateArcChapterRange`

### 회차 뼈대 — 소아크 (`MicroArcBlock`)

```typescript
interface MicroArcBlock {
  id: string;
  stage: MicroArcStage;   // 소발단 ~ 소결말
  title: string;
  summary: string;
  fromChapter?: number;
  toChapter?: number;
  characterIds?: string[];  // 바이블 인물 파일 ID
  eventIds?: string[];      // 바이블 사건 파일 ID
}
```

**소단계** (`src/lib/micro-arc-stages.ts`): 소발단 · 소전개 · 소위기 · 소절정 · 소결말 — **거시 아크당 단계별 1개**

CRUD: `src/lib/micro-arc.ts`, `db.ts` migration으로 기존 프로젝트 `microOutline: []` 보장

### 원고 (`Chapter`)

- `number`, `title`, `outline`, `content`, `instruction`, `versions[]`
- `addChapter({ title?, instruction? })` — 화 추가 시 설정 모달에서 입력
- `deleteChapterFromProject` — 삭제 후 남은 화 **1..n 재번호**
- `chapter-briefing.ts` — 소아크 위치, 연결 바이블, 고정 세계관, 컨텍스트 칩, 열린 복선

---

## 6. 주요 기능

### 6.1 소설 컨셉 (`ConceptWorkspace`)

- **개요**: `ConceptOverview` — 앱 정보형 카드 + 10 스펙 행
- **편집**: `ConceptEditModal` (`ModalShell`, `kind="modal"` 560×560)
  - 「수정하기」→ `mode="full"` (10항목 전체)
  - 스펙 행 클릭 → `mode="single"` (해당 step만)
- **10축** (`CONCEPT_OVERVIEW_ROWS`): 이용등급, 메인 타겟층, 상세 장르, 거시적 무대, 상세 배경, 세계관 규칙, 서사 시작 장치, 서사 구조, 핵심 소재, 분위기 및 톤
- 저장 시 `composeStyleGuide()` → `settings.styleGuide`
- 탑바 저장 + 모달 저장 (`ConceptSaveState`)

### 6.2 바이블

- **트리** (`BibleTree`): 카테고리 → 폴더 → 파일, `NamePromptModal`로 이름 입력
- **편집** (`BibleFileEditor`): 카테고리별 폼, 720px 카드 레이아웃
- **삭제**: `useDeleteConfirm` (파일·폴더·카테고리)

### 6.3 회차 뼈대

| UI | 컴포넌트 |
|----|----------|
| 리스트 (단계 그룹 + 중첩 소아크) | `ArcOutlineList` |
| 거시 편집 | `ArcEditor` |
| 소아크 편집 | `MicroArcEditor` |
| 거시 추가 | `ArcCreateModal` |
| 소아크 추가 | `MicroArcCreateModal` |
| 바이블 연결 | `ArcBibleLinksEditor` |
| 대전개 순서 | `reorderMacroRisingArc` |

**편집 필드 순서** (`ArcEditor`, `MicroArcEditor`):
1. 이름
2. 시작·종료 회차
3. **등장 인물** · **등장 사건** (`ArcBibleLinksEditor`)
4. 줄거리 요약

**아크 ↔ 바이블 연동** (`ArcBibleLinksEditor`):
- 기존 바이블 인물·사건을 `TossMultiSelect`로 다중 연결 (`characterIds`, `eventIds`)
- 바이블이 비어 있으면 `.toss-callout-warning` 안내 + 「새 인물/사건 만들기」
- 아크에서 새로 만들면 `addBibleFile`로 바이블에도 추가 (사건은 아크 회차 범위·연결 인물 반영)
- 저장 시 삭제된 바이블 ID는 `pruneBibleLinkIds`로 자동 정리
- 헬퍼: `src/lib/arc-bible-links.ts`

선택 흐름:
- 거시 클릭 → `selectedArcId`, `selectedMicroArcId` 초기화
- 소아크 클릭 → `selectedArcId` + `selectedMicroArcId`

### 6.4 원고

| UI | 컴포넌트 | 설명 |
|----|----------|------|
| 리스트 | `ChapterList` | 화 목록, 행별 삭제, 「화 추가」 |
| 에디터 | `ChapterEditor` | 3탭 (브리핑 / 설계 / 본문), 바이블·아크 톤 통일 |
| 화 추가 | `ChapterCreateModal` | 제목·추가 지시·아크 위치 미리보기 → `addChapter` |
| AI 집필 | `ChapterWriteModal` | `StepModal` 3단계 (브리핑 → 설계 → 본문) |

**`ChapterEditor` 탭**

| 탭 | 내용 |
|----|------|
| 브리핑 | 소아크 위치·줄거리, 아크 연결 바이블, 고정 세계관(`pinnedWorldBibleIds`), 컨텍스트 칩, 열린 복선 |
| 설계 | 화 제목, 추가 지시, 아웃라인 (직접 편집) |
| 본문 | 본문 textarea 직접 편집 |

- 헤더 **「이 화 쓰기」** → `ChapterWriteModal` (탭 내 AI 버튼 없음)
- 헤더 **「화 저장」** + `onSaveStateChange` → 모바일 하단 저장
- 폼: 라벨 → 힌트 → 입력 (`toss-bible-form-field-block`)

**`ChapterWriteModal` 스텝**

1. 브리핑 — 컨텍스트 확인 → 다음
2. 설계 — 제목·추가 지시·아웃라인 (+ 아웃라인 생성) → 다음 (아웃라인 필수)
3. 본문 — 스트리밍 미리보기 → 본문 생성 → 완료

**삭제** — `ChapterList` 행 `BibleRowDeleteButton` + `useDeleteConfirm` → `deleteChapterFromProject`

### 6.5 설정 (`SettingsModal`)

- 작품 제목, 화당 분량, API 키, 모델
- 작품 삭제 → `useDeleteConfirm` → 홈

### 6.6 삭제 확인 (공통)

| 항목 | 값 |
|------|-----|
| 컴포넌트 | `DeleteConfirmModal` |
| 훅 | `useDeleteConfirm` (`.ts`) |
| 문구 | 「삭제하시겠어요?」 / 「한 번 삭제한건 되돌릴 수 없어요!」 |
| 버튼 | 닫기 \| 삭제 (가로) |
| 모달 종류 | `kind="confirm"` — **300px** |

`window.confirm` **전면 제거** 완료.

---

## 7. AI 생성 규칙

### 문체 가이드
- 컨셉 10축 → `composeStyleGuide()` 7섹션 + 공통 규칙
- 아웃라인·본문 프롬프트 `【문체 규칙】`에 삽입

### 바이블 컨텍스트
- `context.ts` — 선택 `BibleFile.content` 프롬프트 주입
- 사건 `등장 인물` ID → 이름 해석은 **미구현** (향후)

### 본문·아웃라인 생성 (`gemini.ts`)
- `generateChapterOutline` — 브리핑·컨텍스트 기반 화별 아웃라인
- `streamBody` — 목표 분량 ±10%, 아웃라인 순서 준수, 본문만 출력

---

## 8. 컴포넌트·파일 맵

```
src/
├── app/
│   ├── layout.tsx              viewport, metadata
│   ├── globals.css             toss-* 전체 스타일
│   └── page.tsx
├── components/
│   ├── AppClient.tsx           부트·청크 오류 복구
│   ├── ClientErrorBoundary.tsx
│   ├── AppShell.tsx            에디터 셸·모바일 상태
│   ├── AppRoot.tsx             홈·모달 진입
│   ├── EditorPrimaryNav.tsx
│   ├── ConceptWorkspace.tsx / ConceptOverview.tsx / ConceptEditor.tsx / ConceptEditModal.tsx
│   ├── BibleTree.tsx / BibleFileEditor.tsx
│   ├── ArcOutlineList.tsx / ArcEditor.tsx / ArcCreateModal.tsx
│   ├── ArcBibleLinksEditor.tsx
│   ├── MicroArcEditor.tsx / MicroArcCreateModal.tsx
│   ├── ChapterList.tsx / ChapterEditor.tsx
│   ├── ChapterCreateModal.tsx / ChapterWriteModal.tsx
│   ├── SettingsModal.tsx
│   ├── home/
│   │   ├── modal-kinds.ts      Overlay 종류 (confirm | prompt | modal)
│   │   ├── ModalShell.tsx      오버레이 셸 (헤더/바디/푸터)
│   │   ├── ModalCloseButton.tsx
│   │   ├── StepModal.tsx       스텝 위저드·이 화 쓰기 (560×560)
│   │   └── CreateWizardModal.tsx / CreateNovelModal.tsx / LoadNovelModal.tsx
│   └── ui/
│       ├── DeleteConfirmModal.tsx
│       ├── MobileDetailHeader.tsx    (MobileTopbarNav)
│       ├── MobileDetailBottomSave.tsx
│       ├── EditorEmptyIcon.tsx
│       ├── TossSelect.tsx / TossMultiSelect.tsx
│       └── …
├── hooks/
│   ├── useSidebarTab.ts
│   ├── useDeleteConfirm.ts
│   └── useBottomSheet.ts
└── lib/
    ├── db.ts                   IndexedDB CRUD·마이그레이션
    ├── types.ts
    ├── arc.ts / arc-stages.ts
    ├── arc-bible-links.ts
    ├── micro-arc.ts / micro-arc-stages.ts
    ├── bible-*.ts / bible.ts
    ├── chapters.ts
    ├── chapter-briefing.ts
    ├── context.ts
    ├── panel-save-state.ts
    ├── gemini.ts
    └── compose-style-guide.ts
scripts/
├── dev.mjs                     Turbopack dev + 청크 오류 복구
├── build.mjs                   안전 빌드 (dev 중 거부)
└── kill-dev-ports.mjs          dev:fresh 포트 정리
```

---

## 9. 코딩·UX 규칙

### 구조
- 카테고리별 바이블 로직 → `src/lib/bible-*.ts`
- `BibleFileEditor`는 UI만 — parse/compose는 lib
- 새 카테고리: `is*Category` + parse/serialize + 폼 분기

### UI
- 스타일 우선 `toss-*` 클래스 (`globals.css`)
- Tailwind는 레이아웃·일회성 spacing에만
- 삭제: 반드시 `useDeleteConfirm`
- 저장 disabled: 파란 유지 + `opacity: 0.38`

### 개발
- `dev` / `build` **동시 실행 금지** — `scripts/build.mjs`가 dev(포트 3000) 실행 중이면 빌드 거부
- `scripts/dev.mjs` — Turbopack dev, 청크 오류 로그 감지 시 자동 재시작 (최대 2회), 빌드 스탬프 시 `.next` 정리
- 청크·캐시 오류 (`Cannot find module './301.js'` 등) → `npm run dev:fresh` + Cmd+Shift+R
- `AppClient` + `error.tsx` — 클라이언트·서버 청크 오류 시 자동 새로고침 시도
- `useDeleteConfirm.ts`는 JSX 없이 `createElement` — **`.tsx` 확장자 금지**

### 반응형 구현 시
- 모바일 상세: 인라인 저장 숨기고 `MobileDetailBottomSave` 사용
- 상세 시 `toss-hide-on-mobile-detail`로 하단 탭 숨김
- topbar detail 시 root `display: none` (flex gap 버그 방지)

---

## 10. UI/UX 변경 이력

### 레이아웃·내비
- [x] 1차 세로 내비 (`EditorPrimaryNav`, 76px)
- [x] 헤더 제목 좌측 / 저장·설정·닫기 우측
- [x] 컨셉 앱 정보형 개요
- [x] 바이블 편집 토스형 카드 폼 (40px, 720px)

### 소설 컨셉
- [x] `ConceptEditModal` — full/single 모드
- [x] 탑바·모달 이중 저장

### 바이블
- [x] 인물·세계관·사건 카테고리별 폼
- [x] `TossMultiSelect` 등장 인물
- [x] 중복 제목·placeholder 제거

### 회차 뼈대
- [x] 거시 아크 5단계 (대발단~대결말)
- [x] 대전개 복수 + 순서 변경
- [x] **소아크** 5단계 (소발단~소결말) 중첩 트리
- [x] `ArcCreateModal` / `MicroArcCreateModal`
- [x] 회차 범위 겹침 검증
- [x] **아크·소아크 ↔ 바이블** 인물·사건 연결 (`ArcBibleLinksEditor`)
- [x] 편집 필드 순서: 등장 인물/사건 → 줄거리 요약

### 오버레이 (컨펌 · 프롬프트 · 모달)
- [x] 3종 구분: 컨펌 300px / 프롬프트 400px (max 560) / 모달 560×560
- [x] `ModalShell` 헤더·바디·푸터 레이아웃, 제목 좌측·닫기 우측
- [x] 닫기 전용 푸터 제거 (헤더 ✕)
- [x] `CreateNovelModal`·`LoadNovelModal` → `kind="prompt"`
- [x] `StepModal`·`ChapterWriteModal` — 560×560

### 원고
- [x] `ChapterEditor` 3탭 (브리핑 / 설계 / 본문), 바이블·아크 톤 통일
- [x] `ChapterWriteModal` — AI 집필 3단계 스텝 모달
- [x] `ChapterCreateModal` — 「화 추가」설정 모달
- [x] `ChapterList` 화 삭제, 빈 상태 중복 문구 제거
- [x] `chapter-briefing.ts` — 소아크·고정 세계관·복선 브리핑
- [x] 폼 라벨 → 힌트 → 입력 순서 통일

### 저장·삭제 UX
- [x] 저장 버튼 dirty 시 파란, disabled 시 **opacity 0.38** (회색 전환 없음)
- [x] `DeleteConfirmModal` + `useDeleteConfirm` 통일
- [x] `PanelSaveState` — 편집기 → 셸 저장 상태

### 모바일 반응형 (≤767px)
- [x] 하단 탭 바 (concept / bible / arc / chapters)
- [x] 마스터-디테일 슬라이드 전환
- [x] 상세 헤더: ← + 제목 + 삭제
- [x] 상세 하단 전체 너비 저장 (`MobileDetailBottomSave`)
- [x] 상세 시 탭·인라인 저장·root topbar 숨김
- [x] 하단 탭 gap 8px, 라벨 12px, 패딩 조정

### 모달·바텀시트 (≤639px)
- [x] 아래→위 슬라이드 인 애니메이션
- [x] 핸들 드래그로 닫기 / 스냅백
- [x] `useBottomSheet` 훅

### 에디터 빈 상태
- [x] `EditorEmptyIcon` 통일 SVG (80×80)

### 안정성
- [x] `scripts/dev.mjs` — Turbopack + 청크 오류 자동 재시작
- [x] `scripts/build.mjs` — dev 실행 중 빌드 거부, production stamp
- [x] `dev:fresh`, `ClientErrorBoundary`, `error.tsx` 청크 오류 reload
- [x] `AppClient` — `AppRoot` 동적 import + 부트 화면 + 1회 자동 새로고침

---

## 11. 데이터·상태·저장소

### IndexedDB 키
- `webnovel-library` — 프로젝트 목록 (`ProjectSummary[]`)
- `webnovel-project-{id}` — `ProjectData`
- `webnovel-active-project-id` — 마지막 활성 ID

### 저장 특성
- **서버 없음** — 데이터는 브라우저·기기·URL(origin)별로 격리
- 맥 localhost 데이터 ≠ 폰 배포 URL 데이터
- 브라우저 데이터 삭제 시 작품 소실
- API 키: `settings.apiKey` + `apiKeyStorage` (localStorage/sessionStorage)

### 마이그레이션 (`db.ts` `migrateSettings` 등)
- 레거시 `conceptId`/`genreId` → 10축 구조
- `arcOutline`에 `stage`, `order`, `microOutline` 보정
- `characterIds`, `eventIds` 빈 배열 보장 (`migrateArcBibleLinks`)
- Gemini 모델명 정규화

---

## 12. 배포·실사용 (예정)

| 단계 | 예상 소요 | 비고 |
|------|-----------|------|
| GitHub + Vercel 연결 | 20~30분 | Next.js 권장 |
| PWA (manifest, 아이콘) | +20~40분 | 홈 화면 추가 |
| 폰 테스트 | 10분 | Safari/Chrome |

배포 후 폰에서 HTTPS URL 접속 → 북마크 / **홈 화면에 추가**로 앱처럼 사용.  
PWA manifest는 **아직 미구현** — 배포 전 추가 예정.

---

## 13. 알려진 이슈·향후 작업

| 항목 | 설명 |
|------|------|
| PWA | manifest·아이콘·apple-touch-icon 미구현 |
| 배포 | Git 저장소·Vercel 미연결 |
| 기기 간 동기화 | 없음 — 클라우드/보내기 미구현 |
| 모바일 화 삭제 | 리스트 삭제는 지원, 모바일 헤더 삭제는 bible·arc 위주 (chapter 미포함 가능) |
| 탭 이탈 | 저장 안 한 변경 소실 가능 |
| 사건 등장 인물 | AI 컨텍스트에 ID 그대로 — 이름 해석 미구현 |
| 레거시 | `EditorTabBar`, `ConceptSidebar` |
| dev 캐시 | `./301.js` 등 → `dev.mjs` 자동 재시작 또는 `npm run dev:fresh`. **`build`는 dev 중 거부** |

### 우선순위 제안 (내일 작업)
1. Git 초기화 → GitHub → Vercel 배포
2. PWA manifest + 홈 화면 아이콘
3. 폰에서 실사용 테스트 (저장·바텀시트·상세 UX)

---

## 관련 문서

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — 토큰, 컴포넌트, 모션, 반응형, 바텀시트, Anti-patterns
