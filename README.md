# Jira Notifier

Jira 멘션 및 담당자 지정 알림을 Windows 데스크톱 알림으로 받을 수 있는 앱입니다.

**Tauri v2 + React + TypeScript** 기반으로 제작되었습니다.

---

## 기능

- **멘션 알림**: Jira 이슈 코멘트에서 `@username`으로 멘션되면 알림
- **담당자 알림**: 이슈 담당자로 지정되면 알림
- **시스템 트레이 상주**: 창을 닫아도 종료되지 않고 트레이에서 계속 감시합니다. 트레이 아이콘 클릭으로 창 열기, 우클릭 메뉴로 열기/종료
- **부팅 시 자동 실행**: 첫 실행 시 자동 실행에 등록되며, 부팅 후에는 창 없이 트레이에만 상주합니다
- **자동 감시 시작**: 저장된 설정이 있으면 앱 시작과 동시에 폴링이 시작됩니다 (▶ 버튼을 누를 필요 없음)
- **Windows 네이티브 알림**: Windows 알림 센터에 표시
- **알림 이력 관리**: 읽어도 목록에서 사라지지 않고 읽음으로 표시됩니다. 앱을 껐다 켜도 이력이 남아 나중에 다시 찾아볼 수 있습니다 (목록을 비우려면 **전체 삭제**)
- **트레이 현황 표시**: 미확인 알림이 있으면 트레이 아이콘에 빨간 점이 표시되고, 마우스를 올리면 `미확인 n · 미배정 n · 내 담당 n`이 보입니다
- **트레이에서 이슈 바로 열기**: 트레이 우클릭 메뉴에 최근 미확인 알림이 최대 5건 올라오며, 클릭하면 브라우저에서 해당 이슈가 열립니다
- **알림 클릭 시 이슈 열기**: 브라우저에서 해당 Jira 이슈로 이동

---

## 설치 (일반 사용자)

개발 도구 없이 바로 사용하려면 **[Releases](https://github.com/jungjinbeom/jira-notifier/releases)** 페이지에서 사용하는 OS에 맞는 설치 파일을 내려받으세요.

| OS | 내려받을 파일 |
|----|------|
| Windows | `.msi` 또는 `..._x64-setup.exe` |
| macOS (Apple Silicon) | `..._aarch64.dmg` |
| macOS (Intel) | `..._x64.dmg` |
| Linux | `.AppImage` 또는 `.deb` |

### 첫 실행 시 보안 경고 우회

코드 서명이 되어 있지 않아 처음 실행할 때 OS 보안 경고가 표시됩니다. 아래 방법으로 실행하면 됩니다.

- **Windows**: "Windows의 PC 보호" 창이 뜨면 → **추가 정보** → **실행** 클릭
- **macOS**: 앱을 **우클릭 → 열기 → 열기** (또는 시스템 설정 → 개인정보 보호 및 보안 → "확인 없이 열기")
- **Linux (AppImage)**: 실행 권한을 준 뒤 실행
  ```bash
  chmod +x Jira*.AppImage
  ./Jira*.AppImage
  ```

> 설치 후 사용법은 아래 [사용 방법](#사용-방법)을 참고하세요.

---

## 사전 준비 (소스에서 직접 빌드하는 경우)

### 1. 개발 도구 설치

```bash
# Rust (https://rustup.rs)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js 18+ (https://nodejs.org)

# Tauri v2 CLI
cargo install tauri-cli --version "^2"
```

### 2. Windows 빌드 필수 요소

- **Microsoft Visual Studio C++ Build Tools** (또는 Visual Studio 2022)
- **WebView2** (Windows 10/11은 기본 포함)

### 3. Jira API 토큰 발급

1. [Atlassian API Token](https://id.atlassian.com/manage-profile/security/api-tokens)에 접속
2. **Create API token** 클릭
3. 생성된 토큰을 복사하여 앱 설정에 입력

---

## 빌드 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
cargo tauri dev

# 프로덕션 빌드 (Windows .msi / .exe 생성)
cargo tauri build
```

빌드 결과물 위치: `src-tauri/target/release/bundle/`

---

## 릴리스 배포 (메인테이너용)

`v`로 시작하는 버전 태그를 push하면 GitHub Actions가 Windows/macOS/Linux 설치 파일을 자동으로 빌드하여 **Release 초안**으로 첨부합니다. (`.github/workflows/release.yml`)

```bash
# 1. 버전 올리기: src-tauri/tauri.conf.json 과 package.json 의 version 을 함께 수정 (예: 1.0.1)
# 2. 변경사항 커밋 후 태그 push
git tag v1.0.1
git push origin v1.0.1
```

빌드가 끝나면 [Releases](https://github.com/jungjinbeom/jira-notifier/releases)에 초안이 생성됩니다. 내용을 확인한 뒤 **Publish release**를 눌러 공개하세요.

---

## 사용 방법

1. 앱 실행 후 **설정** 탭으로 이동
2. Jira URL, 이메일, API 토큰, 사용자명 입력
3. **연결 테스트** 클릭하여 인증 확인
4. **설정 저장** 후 상단 ▶ 버튼으로 모니터링 시작
5. 새 멘션이나 담당자 지정 시 Windows 알림 수신

설정을 한 번 저장하면 이후에는 위 과정이 필요 없습니다. 앱은 부팅 시 자동으로 트레이에 상주하며 감시를 바로 시작합니다.

- **창 닫기(X)**: 앱이 종료되지 않고 트레이로 숨습니다. 감시는 계속됩니다
- **다시 열기**: 트레이 아이콘 클릭 (또는 우클릭 → **열기**)
- **완전 종료**: 트레이 아이콘 우클릭 → **종료**
- **알림 이슈로 바로 가기**: 트레이 아이콘 우클릭 → 목록 상단의 알림 항목 클릭 (Windows는 OS 알림 자체의 클릭을 앱이 가로챌 수 없어, 트레이 메뉴가 가장 빠른 경로입니다)
- **자동 실행 해제**: 작업 관리자 → 시작 프로그램 → "Jira Notifier" 사용 안 함

---

## 프로젝트 구조

```
jira-notifier/
├── src/                        # React 프론트엔드
│   ├── components/             # 관심사별 컴포넌트
│   │   ├── common/             # 공용 UI (EmptyState, FormField)
│   │   ├── layout/             # 앱 셸 (Layout, Header, TabBar)
│   │   ├── notifications/      # 알림 목록/카드
│   │   ├── tickets/            # 티켓 목록/카드
│   │   └── settings/           # 설정 화면
│   ├── hooks/                  # 도메인 훅 (useJira 파사드 + useConfig/usePolling 등)
│   ├── utils/                  # timeAgo, openUrl 등 유틸
│   ├── types/index.ts          # 타입 정의
│   ├── styles/global.css       # 전역 스타일
│   ├── api.ts                  # Tauri IPC 래퍼 (invoke 명령 모음)
│   ├── App.tsx                 # 상태 배선 + 탭 라우팅
│   └── main.tsx                # 엔트리
├── src-tauri/                  # Rust 백엔드
│   ├── src/
│   │   ├── main.rs             # 앱 진입점
│   │   ├── lib.rs              # Tauri 명령/폴링
│   │   └── jira.rs             # Jira API 클라이언트
│   ├── capabilities/
│   │   └── main.json           # 권한 설정
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 참고

- 폴링 간격 기본값은 60초이며, Jira API Rate Limit에 맞게 조정하세요.
- `src-tauri/icons/` 폴더에 앱 아이콘을 넣어야 빌드 시 정상 반영됩니다.
  - `cargo tauri icon <source-icon.png>` 명령으로 아이콘을 일괄 생성할 수 있습니다.
- Jira Server(온프레미스)에서도 동일하게 동작하지만, API 경로나 인증 방식이 다를 수 있습니다.
