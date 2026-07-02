# Jira Notifier

Jira 멘션 및 담당자 지정 알림을 Windows 데스크톱 알림으로 받을 수 있는 앱입니다.

**Tauri v2 + React + TypeScript** 기반으로 제작되었습니다.

---

## 기능

- **멘션 알림**: Jira 이슈 코멘트에서 `@username`으로 멘션되면 알림
- **담당자 알림**: 이슈 담당자로 지정되면 알림
- **시스템 트레이**: 백그라운드에서 실행, 트레이 아이콘 클릭으로 열기
- **Windows 네이티브 알림**: Windows 알림 센터에 표시
- **알림 이력 관리**: 읽음/읽지않음 상태, 전체 삭제 지원
- **알림 클릭 시 이슈 열기**: 브라우저에서 해당 Jira 이슈로 이동

---

## 사전 준비

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

## 사용 방법

1. 앱 실행 후 **설정** 탭으로 이동
2. Jira URL, 이메일, API 토큰, 사용자명 입력
3. **연결 테스트** 클릭하여 인증 확인
4. **설정 저장** 후 상단 ▶ 버튼으로 모니터링 시작
5. 새 멘션이나 담당자 지정 시 Windows 알림 수신

---

## 프로젝트 구조

```
jira-notifier/
├── src/                        # React 프론트엔드
│   ├── components/
│   │   ├── Settings.tsx        # 설정 화면
│   │   └── NotificationList.tsx # 알림 목록
│   ├── hooks/
│   │   └── useJira.ts          # Tauri IPC 훅
│   ├── types/
│   │   └── index.ts            # 타입 정의
│   ├── styles/
│   │   └── global.css          # 전역 스타일
│   ├── App.tsx                 # 메인 컴포넌트
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
