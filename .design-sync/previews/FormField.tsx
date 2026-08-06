import type { ReactNode } from "react";
import { FormField } from "jira-notifier";

// 이 DS는 다크가 기본 테마(:root)다. 미리보기 하네스는 body에 background:#fff를
// 하드코딩하므로, DS의 표면 토큰을 명시적으로 씌워야 실제 앱과 같은 모습이 된다.
const Surface = ({ children, width = 320 }: { children: ReactNode; width?: number }) => (
  <div
    style={{
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      padding: 16,
      borderRadius: 8,
      width,
    }}
  >
    {children}
  </div>
);

// 미리보기 데이터는 전부 가상이다. 실제 계정/이름/티켓 내용을 넣지 말 것
// (업로드되어 프로젝트 접근자 전원에게 노출된다).

/** 기본 사용례 — 설정 화면의 Jira 주소 입력. */
export const Default = () => (
  <Surface>
    <FormField
      label="Jira 주소"
      defaultValue="https://example.atlassian.net"
      hint="Atlassian Cloud 사이트 주소를 입력하세요."
    />
  </Surface>
);

/** 힌트 유무 대비. */
export const WithAndWithoutHint = () => (
  <Surface>
    <FormField
      label="이메일"
      defaultValue="hong@example.com"
      hint="Jira 계정 이메일입니다."
    />
    <FormField label="표시 이름" defaultValue="홍길동" />
  </Surface>
);

/** 입력 타입 — API 토큰은 password, 폴링 주기는 number. */
export const InputTypes = () => (
  <Surface>
    <FormField
      label="API 토큰"
      type="password"
      defaultValue="0123456789abcdef0123456789"
      hint="Atlassian 계정 설정에서 발급합니다."
    />
    <FormField
      label="폴링 주기(초)"
      type="number"
      defaultValue={60}
      hint="60초 미만으로 줄이면 API 호출량이 늘어납니다."
    />
  </Surface>
);

/** 상태 — placeholder와 비활성. */
export const States = () => (
  <Surface>
    <FormField label="프로젝트 키" placeholder="예: ABC" />
    <FormField
      label="계정 ID"
      defaultValue="000000000000000000000000"
      hint="연결 성공 후 자동으로 채워집니다."
      disabled
    />
  </Surface>
);
