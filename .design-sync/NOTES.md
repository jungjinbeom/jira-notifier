# design-sync — jira-notifier 리포 메모

## 이 리포의 구조적 특이점

- **라이브러리 빌드가 없다.** `package.json`에 `main`/`module`/`exports`가 전부 없고 `build` 스크립트는
  `tsc && vite build` — 앱 번들이지 라이브러리 dist가 아니다. 그래서 컨버터는 매번 `[NO_DIST]`를 찍고
  `src/`에서 엔트리를 합성한다(synth-entry). **이건 정상 동작이지 고칠 문제가 아니다** —
  `cfg.buildCmd`를 설정하면 안 된다(앱 빌드가 돌아 시간만 날린다).
- 합성 모드라 `.d.ts` 추출이 약해진다. 그 보완이 `cfg.dtsPropsFor`의 8개 손수 작성 props 본문이다.
  **컴포넌트 props를 바꾸면 `dtsPropsFor`도 같이 고쳐야 한다** — 안 그러면 디자인 에이전트가
  낡은 계약을 보고 코드를 짠다.
- `node_modules/jira-notifier` 는 리포 루트를 가리키는 **심볼릭 링크**(self-install)다.
  덕분에 프리뷰가 `from "jira-notifier"` 로 임포트할 수 있다. 새로 클론하면 이 링크를 다시 만들어야 한다:
  `ln -sfn .. node_modules/jira-notifier`
- 재싱크 명령 (리포 루트에서):
  ```sh
  node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules \
    --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
  ```
  `--node-modules`는 **리포 루트의 `node_modules`** 다(`node_modules/jira-notifier`가 아니라).
  `--entry`는 넘기지 않는다 — 합성 모드를 쓴다.

## 알려진 렌더 경고 (Known render warns) — 전부 정당함, 새 경고 아님

- `[RENDER_ERRORS] components/common/ErrorBoundary/ErrorBoundary.html` (pageerror 6건, 2건 셀 내 캐치)
- `[RENDER_ERRORS] components/common/AppBoundary/AppBoundary.html` (pageerror 3건, 1건 셀 내 캐치)

  두 프리뷰는 경계(boundary)의 **fallback 경로를 보여주려고 자식에서 일부러 throw** 한다
  (`previews/ErrorBoundary.tsx`의 `Boom`, `AppBoundary.tsx`도 동일 패턴).
  던지는 메시지가 `"Jira API 에러 (401): 인증에 실패했습니다"` 라서 **로그만 보면 진짜 인증 실패처럼 보이는데
  아니다.** `rootEmpty=false`이고 `[RENDER]`는 뜨지 않으며 validate는 exit 0이다.
  `.render-check.json`의 `bad` 필드는 boolean이 아니라 **pageerror 개수**라는 점도 같이 기억할 것.

## 프리뷰 작성 규약 (이 DS 고유)

- **컴포넌트가 자기 배경을 칠하지 않는다.** 프리뷰 하네스는 body에 흰 배경을 하드코딩하므로,
  모든 프리뷰는 `background: var(--bg-primary); color: var(--text-primary)` 를 준 `Surface` 래퍼로 감싼다.
  안 감싸면 다크 테마 컴포넌트가 흰 바탕에 떠서 실제 앱과 전혀 다르게 보인다.
  (`previews/*.tsx` 8개 전부 이 패턴을 쓴다 — 새로 작성할 때도 복사할 것.)
- **프로바이더가 필요 없다.** 토큰이 스타일시트 `:root`에 있어서 `cfg.provider`는 비워둔다.
- 카드 폭이 좁은 앱(380–420px)이라 8개 전부 `cfg.overrides.<Name>.cardMode: "column"` 으로 고정돼 있다.
  새 컴포넌트를 추가하면 같은 override를 주는 게 기본값이다.
- UI 문구는 **전부 한국어**. 영어 카피를 쓰지 말 것(`conventions.md` 참조).

## 디자인 시스템 범위

`cfg.componentSrcMap`에서 앱 레벨 컨테이너 10개를 `null`로 명시 제외했다:
`App`, `JiraProvider`, `Header`, `Layout`, `TabBar`, `ThemeToggle`, `ToastHost`,
`NotificationList`, `TicketList`, `Settings`.
이들은 재사용 부품이 아니라 화면 조립물이라 DS에 넣지 않는다 — 의도된 결정이지 누락이 아니다.
DS에 올라가는 건 재사용 가능한 8개뿐이다.

## guidelines/ 는 의도적으로 비어 있다

`cfg.guidelinesGlob`에서 **기본값의 `docs/*.md` 를 일부러 뺐다** (`["docs/guides/**/*.md", "guides/**/*.md"]`).

이 리포의 `docs/` 에는 디자인 지침이 아니라 **엔지니어링 작업 기록**이 쌓인다
(예: `docs/2026-08-리텐션-개선.md` — 트레이 상주·자동 실행·Rust 회귀 기록, 미해결 버그 항목 포함).
기본 glob을 두면 이런 문서가 `guidelines/` 로 쓸려 올라가고, 디자인 에이전트가 그걸
**디자인 지침으로 읽는다**. 2026-08-06 재싱크에서 실제로 걸려서 제외했다.

**`docs/` 에 md를 추가해도 DS에 올라가지 않는 게 정상이다.** 진짜 디자인 가이드를 올리고 싶으면
`docs/guides/` 아래에 두면 자동으로 잡힌다. 디자인 지침의 1차 소스는 `conventions.md` 다.

## Re-sync risks — 다음 실행이 지켜봐야 할 것

- **`dtsPropsFor` 8개는 손으로 쓴 사본이라 소스와 자동 동기화되지 않는다.**
  컴포넌트 props가 바뀌면 조용히 낡는다. 재싱크 때 각 컴포넌트의 실제 props와 대조할 것.
  특히 `NotificationCard`/`TicketCard`는 도메인 객체 모양(`notification`/`ticket`)을 통째로 적어 놨다 —
  Rust 백엔드의 직렬화 구조체(`src-tauri/src/jira.rs`)가 바뀌면 여기도 바뀌어야 한다.
- **합성 모드는 `src/` 파일 목록에 민감하다.** `src/components/` 아래 파일이 늘거나 이름이 바뀌면
  번들 내용이 달라진다. 컴포넌트를 추가했는데 DS에 안 나타나면 `componentSrcMap` 제외 목록부터 볼 것.
- **`package.json` version이 번들 헤더에 박힌다.** 버전만 올려도 `upload.bundle`이 true가 된다
  (2026-08-06 재싱크 때 1.3.0 → 1.5.1 이 그 이유였다). 렌더가 안 바뀌었어도 업로드는 정상이다.
- **`conventions.md`는 사람이 관리하는 파일이다.** 재싱크는 이 파일을 새로 쓰지 않고,
  거기 적힌 클래스/토큰/컴포넌트 이름이 새 빌드에도 실재하는지만 검증한다.
  `global.css`의 클래스 이름을 바꾸면 이 검증이 깨지므로 문서도 같이 고칠 것.
- 렌더 체크는 `.ds-sync/node_modules`의 playwright + 로컬 chromium 캐시(1148/1208)에 의존한다.
  새 머신에서는 `.ds-sync`에 deps 재설치가 필요하다.

## 이력

- **2026-07-21** 최초 싱크 — 8개 컴포넌트 import, 프리뷰 8개 작성·채점, 프로젝트 업로드.
- **2026-08-06** 재싱크 — 앵커 기준 7개 unchanged(검증 생략), `ErrorBoundary` 1개만 changed
  (프리뷰가 8/3에 수정됐는데 재채점이 안 된 채 중단돼 있었음) → 3개 셀 전부 `good` 재채점.
  `conventions.md` 검증 통과(클래스 46·토큰 23·컴포넌트 8 전부 실재). 버전 범프로 번들 재업로드.
