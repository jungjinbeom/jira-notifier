---
name: fe-refactor-audit
description: jira-notifier 프론트엔드(React/TS) 리팩토링을 위한 코드 감사 방법론. 유지보수성·확장성·재사용성·가독성·성능 축으로 코드 냄새를 진단하고 behavior-preserving 개선안을 도출할 때 반드시 사용한다. fe-architect/fe-component/fe-performance 전문가가 각자 담당 축의 references/를 로드해 분석한다.
---

# fe-refactor-audit — 프론트엔드 리팩토링 감사

대상: `jira-notifier/src/` (App.tsx, hooks/useJira.ts, components/, types/index.ts).

## 대원칙: 리팩토링은 동작을 바꾸지 않는다
관찰 가능한 동작(알림/배정/미배정/설정/폴링, 렌더 결과, IPC 호출)은 그대로 두고 **내부 구조만** 개선한다. 동작이 바뀌면 그것은 리팩토링이 아니라 기능 변경 → 별건으로 분리하고 `jn-maintain` 파이프라인으로 넘긴다.

## 공통 감사 절차
1. **읽고 지도를 그린다** — 파일별 책임, 데이터 흐름(invoke→상태→렌더, listen→상태), 의존 방향을 파악.
2. **냄새를 근거와 함께 표기** — 각 발견은 "파일:라인 · 냄새 · 왜 문제인가 · 개선안 · 리스크 · 검증법" 형식. 추측은 사실처럼 쓰지 말고 "추정/확인필요"로 구분.
3. **동작 보존 가능성 확인** — 제안이 렌더/이벤트/계약을 바꾸지 않는지 스스로 점검.
4. **점진 단위로 쪼갠다** — 큰 변경은 독립 적용·검증·롤백 가능한 작은 단계로 분해.
5. **성급한 추상화 경계** — 실제 반복(2회+)·명백한 재사용·측정된 병목이 있을 때만 추상화. 이 앱 규모에 과한 패턴/라이브러리 도입은 이유 없이는 지양.

## 축별 상세 (담당 전문가가 해당 파일만 로드)
- 유지보수성·확장성 → `references/architecture.md` (fe-architect)
- 재사용성·가독성 → `references/components.md` (fe-component)
- 성능 → `references/performance.md` (fe-performance)

## 검증
개선안의 안전성은 `jn-build-run` 스킬의 `npm run build`(tsc+vite) 통과로 1차 확인한다. 실제 적용은 fe-implementer가, 경계 불변 확인은 jn-qa가 담당한다.

## 산출물
전문가별 제안서 `_workspace/02_{역할}_proposal.md`. 감독자(fe-refactor-lead)가 이를 종합해 우선순위 계획으로 만든다.
