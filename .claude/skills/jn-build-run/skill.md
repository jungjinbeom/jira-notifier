---
name: jn-build-run
description: jira-notifier(Tauri v2) 앱을 빌드·실행·디버깅하는 표준 절차. 앱을 빌드/실행/재실행하거나, "페이지 연결 불가"·exe 잠금·로그 확인·설치본 생성·WebView2 문제를 다룰 때 반드시 사용한다. cargo/npm 명령을 직접 떠올리기 전에 이 스킬을 먼저 따를 것.
---

# jn-build-run — jira-notifier 빌드/실행/디버그

작업 디렉토리 기준 실제 앱 루트는 `jira-notifier/` (package.json이 있는 곳). 아래 명령은 그 안에서 실행한다.

## 급소 1: 반드시 tauri CLI로 빌드하라 (raw cargo 금지)
`cargo build`로 만든 exe를 실행하면 프론트엔드를 개발서버(localhost:1420)에서 찾으려다 **"이 페이지에 연결할 수 없음"**이 뜬다. 프론트엔드 임베딩은 tauri CLI 빌드에서만 올바로 동작한다.

- 실행용 exe (빠름, 설치본 생략):
  ```
  npm run tauri build -- --no-bundle
  ```
- 설치본(.msi + setup.exe)까지:
  ```
  npm run tauri build
  ```
- 프론트만 타입체크/번들 검증(빠른 사전 확인):
  ```
  npm run build     # tsc && vite build
  ```

## 급소 2: 재빌드 전 실행 중인 앱을 종료하라
실행 중이면 exe가 잠겨 빌드가 `os error 5 (액세스 거부)`로 실패한다.
```
# 종료 (PowerShell)
Stop-Process -Name jira-notifier -Force -ErrorAction Ignore
```
빌드 완료 후 실행:
```
Start-Process "jira-notifier\src-tauri\target\release\jira-notifier.exe"
```

## 급소 3: 로그는 파일에서 본다 (릴리스는 콘솔 없음)
릴리스 빌드는 `windows_subsystem="windows"`라 콘솔이 없다. 로그는 파일로 남는다:
```
%TEMP%\jira-notifier.log
```
- 실시간: `Get-Content "$env:TEMP\jira-notifier.log" -Tail 40 -Wait`
- 재현 실험 전 초기화: `Clear-Content "$env:TEMP\jira-notifier.log"`
- 로그 레벨은 `RUST_LOG` 환경변수로 조정(기본 info). Jira API 에러 원문, 폴링 사이클, JQL이 여기 찍힌다.

## 런타임 데이터 위치
- 설정: `%APPDATA%\jira-notifier\config.json` (토큰 평문 저장)
- 알림 이력(재알림 방지): `%APPDATA%\jira-notifier\seen.json`
- 이 파일들은 설치 위치와 무관하게 사용자 프로필에 저장 → 재설치/재빌드해도 설정 유지

## 실행이 안 될 때 체크리스트
1. "페이지 연결 불가" → raw cargo로 빌드했는지 확인. `npm run tauri build`로 재빌드.
2. 시작 직후 종료(크래시) → 로그의 panic 확인. 과거 사례: `tauri.conf.json`의 플러그인 설정 형식 오류(PluginInitialization).
3. 빌드 `os error 5` → 실행 중 앱 종료 후 재시도.
4. 창이 안 보임 → `tauri.conf.json`의 window `visible`. 트레이 아이콘 클릭으로도 열림.
5. 배포 대상에서 렌더 실패 → WebView2 런타임 필요(Win10/11 대개 기본 포함, NSIS가 자동 다운로드).

## 사전 요구
Node 18+, Rust(cargo), Windows용 MSVC 빌드 도구, WebView2. 이미 설치돼 있으면 위 명령만으로 충분하다.
