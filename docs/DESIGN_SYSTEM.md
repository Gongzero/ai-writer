# AI 작가 — 디자인 시스템

> 토스(Toss) 앱의 시각·인터랙션 언어를 참고한 UI 규칙입니다.  
> 구현의 단일 소스: `src/app/globals.css`의 `toss-*` 클래스 + `src/components/ui/` 공통 컴포넌트.  
> 제품·데이터·기능 개요는 [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md)를 참고하세요.

*마지막 업데이트: 2026-06-28*

---

## 목차

1. [디자인 원칙](#1-디자인-원칙)
2. [컬러·서피스 토큰](#2-컬러서피스-토큰)
3. [타이포그래피](#3-타이포그래피)
4. [간격·모서리·레이아웃 치수](#4-간격모서리레이아웃-치수)
5. [모션·애니메이션](#5-모션애니메이션)
6. [반응형·브레이크포인트](#6-반응형브레이크포인트)
7. [컴포넌트 패턴](#7-컴포넌트-패턴)
8. [오버레이 패널 (컨펌 · 프롬프트 · 모달)](#8-오버레이-패널-컨펌--프롬프트--모달)
9. [삭제 확인 UX](#9-삭제-확인-ux)
10. [저장 버튼 규칙](#10-저장-버튼-규칙)
11. [에디터 셸 레이아웃](#11-에디터-셸-레이아웃)
12. [모바일 상세(Detail) UX](#12-모바일-상세detail-ux)
13. [인터랙션 체크리스트](#13-인터랙션-체크리스트)
14. [Anti-patterns](#14-anti-patterns-하지-말-것)
15. [파일 참조](#15-파일-참조)

---

## 1. 디자인 원칙

### 1.1 명확함 (Clarity)
- 한 화면에 **하나의 주요 작업**만 강조한다.
- 라벨은 짧고 명확하게 — **중복 플레이스홀더·중복 제목**을 두지 않는다.
- 빈 상태는 **추가 버튼만** 표시 — 「아크가 없어요」「아직 작성한 화가 없어요」 등 중복 문구 없음
- 삭제 등 파괴적 행동은 `window.confirm` 대신 **통일된 삭제 모달**을 쓴다.

### 1.2 계층 (Hierarchy)
- **탑바** → **1차 내비** → **(2차) 리스트 패널** → **본문** 순으로 시선이 내려간다.
- 타이틀은 `font-bold`, 본문은 15–16px, 보조는 13–14px.
- 선택된 항목은 `--surface-selected`(`#e8f3ff`) 배경 + `--toss-blue` 텍스트.
- 바이블 **카테고리**는 16px bold 제목 행, 폴더·파일은 들여쓰기 + 왼쪽 보더로 하위 계층을 표현한다.
- 회차 뼈대는 **대단계(거시 아크)** → **소단계(소아크)** 2단 트리로 표현한다.

### 1.3 여백과 밀도 (Breathing Room)
- 카드·입력 필드는 **둥근 모서리(12–16px)** 와 충분한 패딩.
- 리스트 행은 타이트하게(`min-height: 38px`), 폼·모달은 넉넉하게.
- 바이블·컨셉 **편집 본문** 배경: `--background`(`#f2f4f6`) — 흰 카드가 떠 있는 토스형 레이아웃.
- 리스트 패널·탑바는 **흰색**(`--surface-list`, `--surface-chrome`).
- 모바일 하단 탭: 탭 간 **8px gap**, 상단 패딩 **10px** — hover 시 배경이 붙어 보이지 않게.

### 1.4 동작의 일관성 (Consistent Motion)
- 전환 easing: `cubic-bezier(0.22, 1, 0.36, 1)` (토스형 스프링)
- 탭 전환 페이드, 셀렉트 패널, 모달은 **짧고 부드러운** 애니메이션 (~280–420ms)
- 모바일 마스터-디테일: `translateX` 슬라이드 (~340ms)
- 모바일 바텀시트: 아래에서 위로 슬라이드 인 (`translateY(100%)` → `0`)
- `prefers-reduced-motion: reduce` 시 애니메이션·전환 비활성화

### 1.5 입력은 방해하지 않는다 (Non-intrusive Input)
- 바이블 트리에서 이름 입력은 **모달**로만 (`NamePromptModal` → `ModalShell`).
- 바이블 파일 편집은 **우측 본문 카드 폼** — 트리 레이아웃을 밀지 않음.
- 드롭다운 열 때 `scrollIntoView`로 화면을 끌고 가지 않는다.
- `TossSelectProvider`로 셀렉트는 **동시에 하나만** 열림.

### 1.6 터치 우선 (Touch-first)
- 주요 버튼 최소 높이 **44px 이상** (`py-4`, 삭제 모달 버튼 `min-height: 44px`)
- 탑바 아이콘 버튼 **40×40px**
- 모바일: 모달은 **하단 바텀시트** (`items-end`), 데스크톱: 중앙 정렬
- 모바일 상세 저장: 하단 **전체 너비** 파란 버튼 (`font-size: 17px`, `padding: 16px`)
- Safe area: `env(safe-area-inset-top/bottom)` 반영

### 1.7 신뢰감 (Trust)
- 삭제: `DeleteConfirmModal` — 제목 「삭제하시겠어요?」, 본문 「한 번 삭제한건 되돌릴 수 없어요!」
- 저장 중·로딩 중 상태를 버튼 텍스트로 표시 ("저장 중…", "추가 중…", "삭제 중…")
- 오류는 상단 알림 또는 `ClientErrorBoundary` — 기술 스택 트레이스는 사용자에게 노출하지 않음

### 1.8 토스형 아이콘 (Toss-like Icons)
- **1차 내비**: Tossface 이모지 (`EditorPrimaryNav`, `Tossface` 컴포넌트)
- **에디터 빈 상태**: `EditorEmptyIcon` — 80×80 회색 둥근 박스 + **문서 SVG** (바이블·아크·원고 통일, 보더 없음)
- **소설 컨셉 카드**: `.toss-concept-app-icon` (52×52) — 동일 톤 문서 SVG
- **바이블·아크 트리** 파일 행: 회색 둥근 사각형 + 라인 SVG (`BibleNavIcon kind="file"`)
- **바이블 트리** 폴더: 노란 폴더 SVG (`kind="folder"`)
- **추가 액션**: 파란 `currentColor` 원 + 플러스 (`kind="add"`)

---

## 2. 컬러·서피스 토큰

### `:root` 정의

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--background` | `#f2f4f6` | 페이지·바이블 편집 배경 |
| `--foreground` | `#191f28` | 기본 텍스트 |
| `--toss-blue` | `#3182f6` | Primary, 링크, 선택 |
| `--toss-blue-pressed` | `#1b64da` | Primary hover/active |
| `--toss-gray-50` | `#f9fafb` | 미세 강조 배경 |
| `--toss-gray-100` | `#f2f4f6` | 입력·버튼·아이콘 배경 |
| `--toss-gray-200` | `#e5e8eb` | 보더, 구분선, 핸들 바 |
| `--toss-gray-400` | `#8b95a1` | 플레이스홀더 |
| `--toss-gray-500` | `#6b7684` | 설명·필드 라벨 |
| `--toss-gray-600` | `#4e5968` | 본문 보조 |
| `--toss-gray-800` | `#333d4b` | 강조 텍스트 |
| `--card-shadow` | `0 2px 8px rgba(0,0,0,0.04)` | 카드 그림자 |
| `--surface-chrome` | `#fff` | 탑바 |
| `--surface-canvas` | `#fff` | 에디터 작업면 |
| `--surface-list` | `#fff` | 리스트 패널 |
| `--surface-card` | `#fff` | 카드 |
| `--surface-inset` | `var(--toss-gray-50)` | 인셋 배경 |
| `--surface-selected` | `#e8f3ff` | 선택된 행 |
| `--toss-modal-width` | `560px` | **모달** (`kind="modal"`) 너비 |
| `--toss-modal-height` | `560px` | **모달** (`kind="modal"`) 높이 |
| `--toss-modal-prompt-width` | `400px` | **프롬프트** (`kind="prompt"`) 너비 |
| `--toss-modal-prompt-max-height` | `560px` | **프롬프트** 최대 높이 (목록 스크롤) |
| `--toss-modal-confirm-width` | `300px` | **컨펌** (`kind="confirm"`) 너비 |

### 시맨틱 조합

| 상태 | 스타일 |
|------|--------|
| 선택됨 | `--surface-selected` + `--toss-blue` 텍스트 |
| 저장 버튼 (변경 없음 / disabled) | `.toss-concept-edit-btn-primary` 유지 + **`opacity: 0.38`** (회색으로 바꾸지 않음) |
| 저장 버튼 (dirty, enabled) | `.toss-concept-edit-btn-primary` — 토스 블루 `opacity: 1` |
| 삭제 텍스트 (모바일 헤더) | `#e42939` |
| 삭제 확인 CTA | `.toss-btn-danger` — `#f04452` / hover `#e42939` |
| 삭제 hover (리스트 행) | `#fff0f0` 배경 |
| 경고 콜아웃 | `.toss-callout-warning` — `#fff8eb` 배경, `#8a6d3b` 텍스트 |
| 정보 콜아웃 | `.toss-callout-info` — `#e8f3ff` 배경, `#1e4b8f` 텍스트 |

### 폰트

```css
-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard",
var(--font-geist-sans), system-ui, sans-serif
```

Tossface: `https://static.toss.im/tossface-font/TossFaceFontWeb.otf` (`@font-face` in globals.css)

---

## 3. 타이포그래피

| 용도 | 크기 | 굵기 | 비고 |
|------|------|------|------|
| 페이지 제목 (컨셉·바이블) | 22px | bold | `.toss-concept-page-title`, `.toss-bible-editor-head h1` |
| 탑바 소설 제목 (데스크톱) | 17px | bold | `.toss-editor-topbar-title` |
| 탑바 소설 제목 (모바일) | 16px | bold | `@media (max-width: 767px)` |
| 삭제 모달 제목 | 20px | bold | |
| 바이블 카테고리명 | 16px | bold | |
| 필드 라벨 | 14px | semibold | `.toss-bible-form-label` = `.toss-field-label`, `--toss-gray-500` |
| 입력 값 | 16px | medium | |
| 페이지 설명 | 14px | normal | `--toss-gray-600` |
| 1차 내비 라벨 (데스크톱) | 11px | semibold | 세로 내비 |
| 1차 내비 라벨 (모바일) | **12px** | semibold | 하단 탭, `line-height: 1.3` |
| 모바일 상세 삭제 | 15px | semibold | 빨간색 |
| 모바일 하단 저장 | 17px | semibold | `.toss-btn-primary` |

---

## 4. 간격·모서리·레이아웃 치수

| 요소 | 데스크톱 | 모바일 (≤767px) |
|------|----------|-----------------|
| 1차 내비 | **76px** 세로 | 하단 가로 탭, `gap: 8px`, `padding: 10px 12px` + safe-area |
| 2차 리스트 패널 | **280px** | 전체 너비 (목록 단계) |
| 컨셉·바이블 편집 `max-width` | **720px** | 동일, 좌우 패딩 축소 |
| 바이블·컨셉 페이지 패딩 | **40px** | **16–24px** |
| 탑바 패딩 | `10px 12px` | `8px 16px` + safe-area-top |
| 입력 필드 radius | **12px**, `padding: 14px 16px` | |
| 카드 radius | **16px** | |
| 모달 상단 radius (모바일) | **20px** (`rounded-t-[20px]`) | |
| 모달 종류 (데스크톱) | **컨펌** 300px hug · **프롬프트** 400px hug (max 560px) · **모달** 560×560 |
| 모달 패딩 | 헤더 `20px`, 바디 `4px 20px 20px`, 푸터 `16px 20px 20px` |
| 바텀시트 핸들 | 40×4px pill | `--toss-gray-200` |
| 가로 2열 필드 gap | **12px** | |
| 폼 필드 세로 gap | **16px** | |

---

## 5. 모션·애니메이션

### Easing
- 기본 스프링: `cubic-bezier(0.22, 1, 0.36, 1)`
- 단순 페이드: `ease`

### Keyframes

| 이름 | 용도 | 동작 |
|------|------|------|
| `toss-bottom-sheet-in` | 모바일 모달 진입 | `translateY(100%)` → `0` |
| `toss-modal-in` | 데스크톱 모달 진입 | `translateY(20px) scale(0.97)` + opacity |
| `toss-backdrop-in` | 배경 딤 | opacity 0 → 1 |
| `toss-reveal-in` | ProgressiveReveal | opacity |
| `toss-summary-in` | 컨셉 요약 카드 | `translateY(-10px)` → 0 |

### 지속 시간

| 대상 | duration |
|------|----------|
| 바텀시트 진입 | 420ms |
| 바텀시트 드래그 스냅/닫기 | 280ms |
| 탭 전환 (workspace) | 340ms |
| 마스터-디테일 슬라이드 | 340ms transform + 280ms opacity |
| 셀렉트 패널 열림 | 380ms max-height |

### Reduced motion
`@media (prefers-reduced-motion: reduce)` — `.toss-modal-panel`, `.toss-editor-list-panel`, `.toss-editor-content-panel` 등 애니메이션·transition 제거.

---

## 6. 반응형·브레이크포인트

프로젝트에서 사용하는 **두 가지** 브레이크포인트:

| MQ | 용도 |
|----|------|
| **`max-width: 767px`** | 에디터 셸 전체 — 마스터-디테일, 하단 탭, 상세 헤더, 하단 저장 |
| **`max-width: 639px`** | 모달 바텀시트·드래그 (`useBottomSheet`, Tailwind `sm:` 경계와 동일) |

> 모바일 레이아웃 판단은 CSS **767px**, 바텀시트 드래그는 JS **639px** — 의도적으로 분리됨.

### 데스크톱 (≥768px)

```
┌────────────────────────────────────────────────────────┐
│ 소설 제목                          [저장] [⚙️] [✕]     │  toss-editor-topbar
├────┬──────────┬──────────────────────────────────────────┤
│ 📋 │ 280px    │  본문                                     │
│ 📚 │ 리스트   │  (컨셉: 리스트 없이 ConceptWorkspace)    │
│ 🗂️ │          │                                          │
│ ✍️ │          │                                          │
└────┴──────────┴──────────────────────────────────────────┘
 76px EditorPrimaryNav (세로)
```

### 모바일 (≤767px) — 목록 단계

```
┌────────────────────────────────────┐
│ 소설 제목              [저장][⚙️][✕]│
├────────────────────────────────────┤
│                                    │
│  리스트 또는 ConceptWorkspace       │  order: 1
│                                    │
├────────────────────────────────────┤
│ 📋  📚  🗂️  ✍️                     │  하단 탭 order: 2
└────────────────────────────────────┘
```

### 모바일 (≤767px) — 상세 단계 (`hasMobileDetail`)

바이블 파일 / 아크·소아크 / 원고 화 선택 시:

```
┌────────────────────────────────────┐
│ ←  제목                    삭제    │  MobileTopbarNav (설정·닫기 숨김)
├────────────────────────────────────┤
│                                    │
│  편집 본문 (인라인 저장 숨김)        │
│                                    │
├────────────────────────────────────┤
│         [ 저장 ] (전체 너비)        │  MobileDetailBottomSave
└────────────────────────────────────┘
  (하단 탭 숨김: .toss-hide-on-mobile-detail)
```

### 마스터-디테일 전환 CSS

| 클래스 | 목록 패널 | 콘텐츠 패널 |
|--------|-----------|-------------|
| 기본 | `translateX(0)`, visible | `translateX(100%)`, `pointer-events: none` |
| `.toss-editor-split-detail` | `translateX(-24%)`, opacity 0 | `translateX(0)`, active |

`hasMobileDetail` 조건 (`AppShell`):
- `bible`: `selectedBibleFile` 존재
- `arc`: `selectedArc` 존재 (소아크 선택 시에도 true)
- `chapters`: `selectedChapter` 존재
- `concept`: 항상 false (전체 너비 워크스페이스)

### 모바일 탑바 상세 모드

- `.toss-editor-topbar-detail` 시 `.toss-editor-topbar-root { display: none }` — **숨겨진 root가 flex 공간을 차지하는 버그 방지**
- `.toss-editor-topbar-detail-view` 표시: `space-between`, 좌측 `.toss-mobile-detail-lead` (← + 제목)
- `canMobileDelete`: bible·arc·**chapters** 헤더 삭제 버튼 표시

### `viewport` (`layout.tsx`)

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",  // safe-area
};
```

---

## 7. 컴포넌트 패턴

### 7.1 버튼

| 클래스 | 역할 |
|--------|------|
| `.toss-btn-primary` | 주요 CTA (모바일 하단 저장 포함) |
| `.toss-btn-secondary` | 보조 (흰 배경 + 보더) |
| `.toss-btn-tertiary` | 삭제 모달 「닫기」 |
| `.toss-btn-danger` | 삭제 확인 CTA |
| `.toss-btn-confirm` | 멀티셀렉트 하단 확인 |
| `.toss-concept-edit-btn` | 회색 pill (저장 기본 스타일 베이스) |
| `.toss-concept-edit-btn-primary` | **항상 파란** 저장 (disabled 시 opacity만 감소) |
| `.toss-editor-topbar-save` | 탑바 컨셉 저장 |
| `.toss-editor-topbar-icon` | 40×40 아이콘 버튼 |
| `.toss-editor-inline-save` | 편집기 내 인라인 저장 — **모바일 상세에서 숨김** |

### 7.2 입력

| 클래스 | 용도 |
|--------|------|
| `.toss-input` / `.toss-textarea` | 컨셉·모달 등 범용 |
| `.toss-bible-form-input` | 바이블 카드 내 단행 입력 |
| `.toss-bible-form-textarea` | 바이블 카드 내 다행 (`min-height: 280px`) |
| `.toss-bible-form-label` | 필드 라벨 |
| `.toss-bible-form-empty-hint` | 인물 없을 때 등장 인물 안내 |

**포커스**: 배경 `#fff` + 파란 보더 + `box-shadow: 0 0 0 3px rgba(49,130,246,0.12)`

### 7.3 1차 내비 (`EditorPrimaryNav`)

| id | 라벨 | 아이콘 (Tossface) |
|----|------|-------------------|
| `concept` | 소설 컨셉 | 📋 |
| `bible` | 바이블 | 📚 |
| `arc` | 회차 뼈대 | 🗂️ |
| `chapters` | 원고 | ✍️ |

- 데스크톱: `.toss-editor-primary-nav` 세로 76px
- 모바일: 하단 가로, `flex: 1` 탭, hover `border-radius: 12px`
- `className="toss-hide-on-mobile-detail"` — 상세 진입 시 숨김

레거시 `EditorTabBar` — **미사용**

### 7.4 셀렉트

- `TossSelect` — 단일 선택
- `TossMultiSelect` — 복수 선택 (사건 등장 인물)
- `TossSelectProvider` — 동시에 하나만 열림
- 패널: `.toss-select-panel` / `-open` — max-height 애니메이션

### 7.5 바이블 트리 (`BibleTree`)

계층: **카테고리 → (선택) 폴더 → 파일**

- 카테고리: 16px bold, chevron 우측
- 폴더 hover: `+` · 삭제 · chevron (`.toss-bible-nav-action-reveal`)
- 파일 추가: **폴더 `+`만**
- 카테고리 추가: 트리 **맨 아래**
- 이름 입력: `NamePromptModal` only
- 삭제: `useDeleteConfirm` → `DeleteConfirmModal`

### 7.6 바이블 파일 편집 (`BibleFileEditor`)

토스 **설정 페이지** 패턴 — 회색 배경 + 흰 카드 + 필드 폼.

| 카테고리 | 페이지 제목 |
|----------|-------------|
| 인물 | 인물 설정 |
| 세계관 | 세계관 설정 |
| 사건 | 사건 설정 |
| 기타 | 바이블 설정 |

- `onSaveStateChange` → `PanelSaveState` — 모바일 하단 저장 연동
- 인라인 저장: `.toss-editor-inline-save`

### 7.7 소설 컨셉

**개요** (`ConceptOverview`): 앱 정보형 카드 + 10개 스펙 행 (`CONCEPT_OVERVIEW_ROWS`)

**편집 모달** (`ConceptEditModal`)

| 진입 | mode | focusedStep | 모달 제목 |
|------|------|-------------|-----------|
| 수정하기 | `full` | `-1` | 소설 컨셉 수정 |
| 스펙 행 클릭 | `single` | `0~9` | 해당 행 라벨 |

- `ModalShell` `kind="modal"` (**560×560**) — 본문은 `.toss-modal-body` 스크롤

### 7.8 회차 뼈대 트리 (`ArcOutlineList`)

**거시 아크 단계** (`MACRO_ARC_STAGE_OPTIONS`):

| stage id | 라벨 | 개수 제한 |
|----------|------|-----------|
| `macro-exposition` | 대발단 | 1개 |
| `macro-rising` | 대전개 | 복수 (order로 정렬) |
| `macro-crisis` | 대위기 | 1개 |
| `macro-climax` | 대절정 | 1개 |
| `macro-resolution` | 대결말 | 1개 |

**소아크 단계** (각 거시 아크의 `microOutline[]`):

| stage id | 라벨 |
|----------|------|
| `micro-exposition` | 소발단 |
| `micro-rising` | 소전개 |
| `micro-crisis` | 소위기 |
| `micro-climax` | 소절정 |
| `micro-resolution` | 소결말 |

- 소아크는 거시 아크당 **단계별 1개** (`allMicroArcStagesFilled` 검증)
- CSS: `.toss-arc-micro-items`, `.toss-arc-micro-nav-row` — 중첩 들여쓰기
- 대전개(`macro-rising`)만 위/아래 순서 변경 버튼
- 빈 상태: 중복 안내 문구 없음 — 「아크 추가」버튼만

**아크·소아크 편집 폼** (`ArcEditor`, `MicroArcEditor`):

| 순서 | 필드 |
|------|------|
| 1 | 이름 |
| 2 | 시작·종료 회차 |
| 3 | 등장 인물 · 등장 사건 (`ArcBibleLinksEditor`) |
| 4 | 줄거리 요약 |

구분선: `.toss-arc-bible-links-divider`

### 7.9 아크 ↔ 바이블 연결 (`ArcBibleLinksEditor`)

| 상황 | UI |
|------|-----|
| 바이블 항목 있음 | `TossMultiSelect` + 푸터 「새 인물/사건 만들기」 |
| 바이블 비어 있음 | 라벨 상단 + `.toss-callout-warning` + 생성 버튼 (회색 empty가 아닌 **경고 톤**) |

- 생성 모달: `ModalShell` `kind="modal"` (560×560) — 이름 입력 후 `addBibleFile`
- 사건 생성 시 아크 회차 범위·연결 인물을 바이블 사건 메타에 반영
- `.toss-arc-bible-create-btn` — 멀티셀렉트 푸터·empty state 공통

### 7.10 원고 (`ChapterEditor` · `ChapterList`)

**에디터 레이아웃** — 바이블·아크와 동일 톤:
- `.toss-bible-editor-page` + `.toss-concept-card` (720px, 40px 패딩)
- 탭: `.toss-settings-tabs` + `.toss-segmented-on-surface` (카드 **내부** 상단)
- 폼: `.toss-bible-form-field-block` — **라벨 → 힌트 → 입력** 순서, `gap: 8px`
- `TossMultiSelect`: `.toss-select-root.toss-bible-form-field-block`로 라벨·힌트·트리거 간격 통일

**3탭 (편집·확인 전용)**

| 탭 | 내용 | 액션 |
|----|------|------|
| 브리핑 | 소아크 위치·줄거리·아크 연결 바이블·고정 세계관·추가 컨텍스트·열린 복선 | (탭 내 버튼 없음) |
| 설계 | 화 제목·추가 지시·아웃라인 textarea | (탭 내 버튼 없음) |
| 본문 | 본문 textarea 직접 편집 | (탭 내 버튼 없음) |

**AI 집필** — 헤더 **「이 화 쓰기」** → `ChapterWriteModal` (`StepModal`, `kind="modal"` 560×560)

| 스텝 | 내용 | 푸터 |
|------|------|------|
| 1 브리핑 | 컨텍스트 확인·고정 세계관·추가 칩 | 다음 |
| 2 설계 | 제목·추가 지시·아웃라인 (+ 아웃라인 생성) | 다음 (아웃라인 필수) |
| 3 본문 | 스트리밍 미리보기 | 본문 생성 → 완료 |

**화 추가** — `ChapterList` 「화 추가」→ `ChapterCreateModal` (`kind="modal"`)

**화 삭제** — `ChapterList` 행 삭제 → `DeleteConfirmModal` (`kind="confirm"`)

**리스트** — `.toss-bible-nav-row` 52px, `.toss-chapter-tree`, 삭제는 hover 시 `BibleRowDeleteButton`

### 7.11 에디터 빈 상태 (`EditorEmptyIcon`)

| 클래스 | 값 |
|--------|-----|
| `.toss-editor-empty-icon` | 80×80, `border-radius: 22px`, `--toss-gray-100`, 보더 없음 |
| `.toss-editor-empty-copy` | 제목+설명 `gap: 4px` |

---

## 8. 오버레이 패널 (컨펌 · 프롬프트 · 모달)

액션·설정·선택 UI는 **세 종류**로 구분한다. 구현: `src/components/home/modal-kinds.ts` + `ModalShell`의 `kind` prop.

### 8.1 종류별 스펙 (데스크톱)

| 종류 | `kind` | CSS 클래스 | 크기 | 높이 | 용도 |
|------|--------|------------|------|------|------|
| **컨펌** | `confirm` | `.toss-modal-panel-confirm` | **300px** | Hug | 삭제 확인 등 짧은 확인 |
| **프롬프트** | `prompt` | `.toss-modal-panel-prompt` | **400px** | Hug (max **560px**) | 소설 만들기·불러오기 등 선택·진입 |
| **모달** | `modal` | `.toss-modal-panel-modal` | **560px** | **560px** | 폼 입력·설정·스텝 위저드·화/아크 생성 등 |

모바일 (≤639px): 세 종류 모두 **전체 너비 바텀시트** (`max-h: 92vh`).

### 8.2 공통 레이아웃 (헤더 / 바디 / 푸터)

```
┌─────────────────────────────────────┐
│  제목 (22px bold)              [✕]  │  헤더 — 좌측 정렬, 닫기 우측 고정
│  설명 (15px gray)                   │
├─────────────────────────────────────┤
│                                     │
│  바디 (스크롤)                       │  flex: 1 (modal) / hug (confirm·prompt)
│                                     │
├─────────────────────────────────────┤
│  [ 주요 CTA / 액션 버튼 ]            │  푸터 — padding 16px 20px 20px
└─────────────────────────────────────┘
```

| 영역 | 클래스 | 규칙 |
|------|--------|------|
| 헤더 | `.toss-modal-header` | 제목·설명 **좌측** (`.toss-modal-header-main`), 닫기 **우측** (`.toss-modal-close-btn`) |
| 바디 | `.toss-modal-body` | `overflow-y: auto`, 패딩 `4px 20px 20px` |
| 푸터 | `.toss-modal-footer` | `flex-shrink: 0`. **닫기만 있으면 푸터 생략** (헤더 ✕ 사용) |

### 8.3 `ModalShell`

```tsx
<ModalShell
  kind="modal"          // "confirm" | "prompt" | "modal" (기본: modal)
  title="제목"
  description="설명"    // 선택
  footer={<button … />} // 선택
  onClose={…}
>
  {children}
</ModalShell>
```

| `kind` | 사용처 |
|--------|--------|
| `confirm` | `DeleteConfirmModal` |
| `prompt` | `CreateNovelModal`, `LoadNovelModal` |
| `modal` | `SettingsModal`, `ArcCreateModal`, `MicroArcCreateModal`, `ChapterCreateModal`, `ConceptEditModal`, `NamePromptModal`, `ArcBibleLinksEditor` 생성 모달 등 |

`useBottomSheet`로 모바일 드래그·닫기. 컨테이너: `fixed inset-0 z-[200]`.

### 8.4 `StepModal`

생성 마법사·**이 화 쓰기** (`ChapterWriteModal`) 전용. `.toss-modal-panel-modal` (**560×560**).

- 헤더: 스텝 라벨 + 제목(좌) + 닫기(우) + 진행 바
- 본문·푸터: `ModalShell`과 동일 분리
- 모바일: 바텀시트 정렬, **드래그 핸들 없음**

### 8.5 모바일 바텀시트 (`useBottomSheet`)

| 동작 | 구현 |
|------|------|
| 진입 | `toss-bottom-sheet-in` — 아래에서 위로 |
| 핸들 드래그 | `.toss-bottom-sheet-handle` — 22% 이상 내리면 닫기 |
| 배경 탭 | `requestDismiss` |
| 배경 opacity | 드래그 진행률에 비례 (최대 55%) |

`StepModal`은 핸들·드래그 **미적용** (배경 탭·✕만).

### 8.6 `ConceptEditModal`

- `kind="modal"` (560×560)
- 저장 버튼은 **푸터**에만 (`footer` prop)
- 본문 스크롤: `.toss-modal-body` 위임

---

## 9. 삭제 확인 UX

### 통일 스펙

| 항목 | 값 |
|------|-----|
| 제목 | 삭제하시겠어요? |
| 본문 | 한 번 삭제한건 되돌릴 수 없어요! |
| 버튼 | 가로 배치: **닫기** (tertiary) \| **삭제** (danger) |
| 모달 크기 | `kind="confirm"` — **300px** |
| busy | 삭제 중 버튼 disabled, 「삭제 중…」 |

### `useDeleteConfirm` 패턴

```ts
const { requestDelete, deleteConfirmModal } = useDeleteConfirm();

requestDelete(async () => {
  await deleteSomething();
});

// JSX 끝에 {deleteConfirmModal}
```

- 훅 파일은 **`.ts`** (`createElement` 사용, JSX 없음)
- `window.confirm()` **사용 금지** — `BibleTree`, `ArcOutlineList`, `SettingsModal`, `AppShell` 모바일 삭제 모두 마이그레이션 완료

---

## 10. 저장 버튼 규칙

### `PanelSaveState` (`src/lib/panel-save-state.ts`)

```ts
interface PanelSaveState {
  dirty: boolean;
  saving: boolean;
  save: () => void;
  label?: string;  // 기본 "저장"
}
```

`BibleFileEditor`, `ArcEditor`, `MicroArcEditor`, `ChapterEditor`가 `onSaveStateChange`로 `AppShell`에 전달.

### 데스크톱
- 편집기 헤더 우측 `.toss-editor-inline-save` (`.toss-concept-edit-btn-primary`)

### 모바일 상세
- 인라인 저장 **숨김** (`.toss-editor-split-detail .toss-editor-inline-save { display: none }`)
- `MobileDetailBottomSave` — 하단 전체 너비 `.toss-btn-primary`
- 하단 탭은 숨김

### 컨셉 탭
- `ConceptSaveState` — 탑바 `.toss-editor-topbar-save` (모바일 상세와 별개)
- `ConceptEditModal` 푸터 저장과 동기

### Disabled 스타일 (중요)

`.toss-concept-edit-btn-primary:disabled { opacity: 0.38 }` — **색은 파란색 유지**, 회색으로 바꾸지 않음.

---

## 11. 에디터 셸 레이아웃

### 클래스 트리

```
.toss-editor-shell                    height: 100dvh, flex column
├── .toss-editor-topbar
│   ├── .toss-editor-topbar-root       기본: 제목 + 액션
│   └── .toss-editor-topbar-detail-view  모바일 상세 (MobileTopbarNav)
├── .toss-editor-alerts                로드/에러 알림
└── .toss-editor-body
    ├── .toss-editor-primary-nav       1차 탭
    ├── .toss-mobile-detail-bottom-save  모바일 상세 저장 (조건부)
    └── .toss-editor-workspace
        ├── [concept] .toss-editor-scroll → ConceptWorkspace
        └── [기타] .toss-editor-split [.toss-editor-split-detail]
            ├── .toss-editor-list-panel → 리스트
            └── .toss-editor-content-panel → 편집기
```

### 탭 전환
- `sidebarTab` 변경 시 `.toss-editor-tab-enter` 340ms
- 스크롤 영역 `.toss-editor-scroll` scrollTop 리셋

---

## 12. 모바일 상세(Detail) UX

### 컴포넌트

| 파일 | 역할 |
|------|------|
| `MobileDetailHeader.tsx` | `MobileTopbarNav` export |
| `MobileDetailBottomSave.tsx` | 하단 저장 바 |

### 헤더 구성

| 요소 | 동작 |
|------|------|
| ← | `handleMobileBack` — 선택 해제, 목록으로 |
| 제목 | 파일명 / 아크·소아크명 / `N화 · 제목` |
| 삭제 | bible·arc·**chapter** | `requestDelete` 연동 |

### 숨김 규칙 (모바일 상세)

| 요소 | 클래스/조건 |
|------|-------------|
| 하단 탭 | `toss-hide-on-mobile-detail` |
| 탑바 root (제목·설정·닫기) | `.toss-editor-topbar-detail .toss-editor-topbar-root` |
| 인라인 저장 | `.toss-editor-inline-save` |

---

## 13. 인터랙션 체크리스트

- [ ] 필드 라벨·값이 한 화면에서 중복되지 않는가?
- [ ] 바이블 편집에 40px(데스크톱) 패딩·720px max-width인가?
- [ ] 저장 버튼이 dirty여도 **파란색**이고 disabled만 opacity 0.38인가?
- [ ] 삭제가 `DeleteConfirmModal`로 통일됐는가?
- [ ] 모바일 상세에서 하단 저장·헤더 ←/삭제가 동작하는가?
- [ ] 모바일 모달이 아래에서 올라오고 핸들 드래그로 닫히는가?
- [ ] 오버레이 종류가 **컨펌 300 / 프롬프트 400 / 모달 560×560**에 맞는가?
- [ ] 모달 헤더가 **제목·설명 좌측 / 닫기 우측**인가?
- [ ] 푸터에 **닫기만** 있는 경우 푸터를 빼고 헤더 ✕만 쓰는가?
- [ ] 원고 AI 집필이 탭 버튼이 아닌 **「이 화 쓰기」→ StepModal**인가?
- [ ] 폼 필드가 **라벨 → 힌트 → 입력** 순서인가?
- [ ] 아크 바이블 empty state가 `.toss-callout-warning`인가?
- [ ] `toss-*` 토큰·클래스를 썼는가?
- [ ] 빈 상태가 `EditorEmptyIcon` 통일 SVG인가?
- [ ] 중첩 스크롤이 없는가?
- [ ] `prefers-reduced-motion` 대응이 있는가?

---

## 14. Anti-patterns (하지 말 것)

| ❌ | ✅ |
|----|-----|
| `window.confirm()` | `useDeleteConfirm` |
| disabled 저장을 회색 버튼으로 | 파란 유지 + `opacity: 0.38` |
| 헤더 제목 + 폼에 같은 이름 필드 | 이름은 폼 한 곳만 |
| 트리 인라인 입력 | `NamePromptModal` |
| 모바일 상세에 인라인+하단 저장 중복 | 하단만 |
| 숨긴 topbar-root가 flex 공간 차지 | `display: none` |
| dev + build 동시 실행 | `build`가 dev 실행 중이면 **거부** (`scripts/build.mjs`) |
| 오버레이 종류 혼동 | `kind`: confirm / prompt / modal |
| 탭마다 「이 화 쓰기」 중복 | 헤더 1개 + `ChapterWriteModal` |
| 리스트 빈 상태 중복 문구 | 추가 버튼만 |
| 아크 바이블 empty를 회색 박스로 | `.toss-callout-warning` |
| `useDeleteConfirm.ts`를 `.tsx`로 | `.ts` + `createElement` |
| 빈 상태 탭마다 다른 아이콘 | `EditorEmptyIcon` 통일 |

---

## 15. 파일 참조

| 파일 | 역할 |
|------|------|
| `src/app/globals.css` | 전체 `toss-*` 스타일, 모바일 MQ |
| `src/app/layout.tsx` | viewport, metadata |
| `src/hooks/useBottomSheet.ts` | 바텀시트 드래그·닫기 |
| `src/hooks/useDeleteConfirm.ts` | 삭제 확인 훅 |
| `src/lib/panel-save-state.ts` | 편집기 저장 상태 타입 |
| `src/components/home/modal-kinds.ts` | Overlay 종류 (`confirm` \| `prompt` \| `modal`) |
| `src/components/home/ModalShell.tsx` | 오버레이 셸 (헤더/바디/푸터) |
| `src/components/home/ModalCloseButton.tsx` | 헤더 닫기 버튼 |
| `src/components/home/StepModal.tsx` | 스텝 위저드·이 화 쓰기 (560×560) |
| `src/components/ChapterWriteModal.tsx` | 원고 AI 3단계 집필 |
| `src/components/ChapterCreateModal.tsx` | 화 추가 설정 |
| `src/lib/chapter-briefing.ts` | 화별 브리핑·컨텍스트 칩 |
| `scripts/dev.mjs` | Turbopack dev + 청크 오류 자동 복구 |
| `scripts/build.mjs` | 안전 빌드 (dev 중 거부) |
| `src/components/ArcBibleLinksEditor.tsx` | 아크·소아크 바이블 연결 UI |
| `src/components/AppClient.tsx` | 부트·청크 오류 복구 |
| `src/components/ClientErrorBoundary.tsx` | 런타임 오류 화면 |
| `src/lib/arc-bible-links.ts` | 연결 ID 헬퍼 |
| `src/components/ui/DeleteConfirmModal.tsx` | 삭제 UI |
| `src/components/ui/MobileDetailHeader.tsx` | 모바일 상세 헤더 |
| `src/components/ui/MobileDetailBottomSave.tsx` | 모바일 하단 저장 |
| `src/components/EditorPrimaryNav.tsx` | 1차 내비 |
| `src/components/AppShell.tsx` | 셸·반응형 상태 집약 |
| `src/lib/arc-stages.ts` | 거시 아크 단계 |
| `src/lib/micro-arc-stages.ts` | 소아크 단계 |

### 레거시 (정리 예정)

- `EditorTabBar.tsx`, `ConceptSidebar.tsx`
- `.toss-editor-tabbar`, `.toss-editor-sidebar`

### TODO (디자인)

- [ ] PWA manifest·홈 화면 추가 (배포 시)
- [ ] 탭 이탈 시 저장 확인
- [ ] 레거시 CSS·컴포넌트 제거
- [x] 오버레이 3종 구분 (컨펌 / 프롬프트 / 모달)
- [x] 모달 헤더·바디·푸터 레이아웃
- [x] 원고 에디터 바이블/아크 톤 통일 + StepModal 집필
- [x] 화 추가·삭제 UX
