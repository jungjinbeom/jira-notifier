import type { ReactNode } from "react";
import { Button } from "jira-notifier";

// 이 DS는 다크가 기본 테마(:root)다. 미리보기 하네스는 body에 background:#fff를
// 하드코딩하므로, DS의 표면 토큰을 명시적으로 씌워야 실제 앱과 같은 모습이 된다.
const Surface = ({ children, width }: { children: ReactNode; width?: number }) => (
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

/** 기본 사용례 — 설정 화면의 저장/연결 테스트 버튼 쌍. */
export const Default = () => (
  <Surface>
    <div className="btn-group">
      <Button variant="primary">저장</Button>
      <Button variant="secondary">연결 테스트</Button>
    </div>
  </Surface>
);

/** 주요 변화 축: variant 4종. */
export const Variants = () => (
  <Surface>
    <div className="btn-group">
      <Button variant="primary">기본</Button>
      <Button variant="secondary">보조</Button>
      <Button variant="success">성공</Button>
      <Button variant="danger">삭제</Button>
    </div>
  </Surface>
);

/** fullWidth — 설정 폼 하단의 전체 폭 버튼. */
export const FullWidth = () => (
  <Surface width={280}>
    <Button variant="primary" fullWidth>
      설정 저장
    </Button>
  </Surface>
);

/** 비활성 상태. */
export const Disabled = () => (
  <Surface>
    <div className="btn-group">
      <Button variant="primary" disabled>
        저장 중…
      </Button>
      <Button variant="danger" disabled>
        삭제
      </Button>
    </div>
  </Surface>
);
