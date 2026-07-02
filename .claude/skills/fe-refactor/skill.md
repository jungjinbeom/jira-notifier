---
name: fe-refactor
description: jira-notifier 프론트엔드(React/TS) 리팩토링을 감독자 패턴 에이전트 팀으로 수행하는 오케스트레이터. "프론트 리팩토링/구조 개선/유지보수성·성능·가독성·재사용성·확장성 개선/코드 정리" 요청이면 반드시 이 스킬로 팀을 구성한다. 기능 추가·버그 수정(동작 변경)은 대상이 아니며 그건 jn-maintain을 쓴다.
---

# fe-refactor — 프론트엔드 리팩토링 오케스트레이터

실행 모드: **에이전트 팀 · 감독자(supervisor) 패턴**. 대상 `jira-notifier/src/`. 대전제: **동작 보존**(관찰 가능한 기능·렌더·IPC 계약 불변).

## 팀 구성
| 에이전트 | 타입 | 역할 |
|---|---|---|
| fe-refactor-lead | 정의 파일 | 감독자 — 분배·상충 조율·우선순위 계획·실행 감독 |
| fe-architect | 정의 파일 | 유지보수성·확장성 분석·제안 |
| fe-component | 정의 파일 | 재사용성·가독성 분석·제안 |
| fe-performance | 정의 파일 | 성능 분석·제안 |
| fe-implementer | 정의 파일 | 승인 항목 점진 적용 + 빌드 검증 |

전원 `model: "opus"`로 스폰. 분석 전문가는 **소스 편집 금지(제안만)**, 편집은 fe-implementer만. 스킬 재사용: 분석가는 `fe-refactor-audit`(+담당 references), 구현자는 `jn-frontend`·`jn-build-run`.

## 워크플로우 (감독자 주도)
1. **스캔·분배** — 감독자가 `src/`를 훑어 문제 축을 식별하고 TaskCreate로 전문가별 분석 과제를 분배(무의미한 축은 생략, 동적 조정).
2. **병렬 분석** — 3 전문가가 각자 `fe-refactor-audit`로 진단해 `_workspace/02_{역할}_proposal.md` 작성. useJira 등 겹치는 파일은 SendMessage로 상충 조율(예: 성능 memo vs 가독성).
3. **종합·우선순위** — 감독자가 제안을 병합, 상충 해소, `_workspace/03_lead_refactor_plan.md`에 **임팩트÷(리스크×공수)** 순 계획 작성(항목별 목적·대상·요지·리스크·검증법·점진단계).
4. **승인 게이트** — 사용자에게 계획 제시·승인. 큰 구조 변경(god-hook 분해)은 작은 단계로 승인.
5. **점진 실행·검증** — 감독자가 승인 항목을 fe-implementer에 **하나씩** 위임 → 구현자가 적용 후 `npm run build`로 동작 보존 검증 → 통과 시 다음. 필요 시 jn-qa로 IPC 경계 불변 재확인.
6. **종합 보고** — 적용 내역·검증 결과·미채택/보류 항목을 사용자에 보고.

## 데이터 전달 프로토콜
- 조율: TaskCreate/TaskUpdate(의존·진행)
- 실시간: SendMessage(상충 조율, 승인 항목 위임)
- 산출물: 파일 기반 — 제안 `_workspace/02_*`, 계획 `_workspace/03_lead_refactor_plan.md`. 최종 코드만 `src/`에 반영, `_workspace/`는 감사 추적용 보존.

## 에러 핸들링
- 분석 실패: 1회 재요청, 재실패 시 해당 축 공백 명시 후 진행.
- 구현 후 빌드/동작 검증 실패: 해당 항목 **롤백**, 원인 분석 후 재시도(범위 임의 확장 금지).
- 계약을 건드려야 풀리는 항목: 리팩토링이 아닌 기능 변경 → 중단하고 `jn-maintain`으로 이관.
- 상충 데이터: 삭제하지 않고 양측 근거를 계획서에 병기 후 감독자 결정.

## 테스트 시나리오
- **정상 흐름**: "useJira가 너무 커서 정리해줘" → 감독자 스캔 → architect가 도메인 훅 분해(점진 단계), component가 timeAgo/openUrl 유틸 추출·useTauriEvent 제안, performance가 memo는 분해 부수효과로만 제안 → 감독자가 저리스크(유틸 추출) 먼저·god-hook 분해는 단계별로 계획 → 승인 후 implementer가 1항목씩 적용+빌드 검증 → 동작 보존 확인 후 보고.
- **에러 흐름**: implementer가 훅 분리 중 `npm run build` 타입 에러 → 해당 항목 롤백 → 감독자에 원인 보고 → 분해 단위를 더 작게 재계획 → 재적용 통과.

## 경계 (트리거하지 말 것)
새 기능·버그 수정처럼 **동작을 바꾸는** 작업은 이 스킬이 아니라 `jn-maintain`. 이 스킬은 순수 내부 품질 개선(리팩토링) 전용이다.
