import type { ReactNode } from "react";
import { AppBoundary, EmptyState } from "jira-notifier";

// 이 DS는 다크가 기본 테마(:root)다. 미리보기 하네스는 body에 background:#fff를
// 하드코딩하므로, DS의 표면 토큰을 명시적으로 씌워야 실제 앱과 같은 모습이 된다.
const Surface = ({ children, width = 340 }: { children: ReactNode; width?: number }) => (
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

// AppBoundary의 두 상태는 자식이 throw해서만 나타난다.
// - Error 상태: 렌더 중 Error를 throw
// - Loading 상태: 렌더 중 Promise를 throw (Suspense가 잡는다)
const Boom = ({ message }: { message: string }): never => {
  throw new Error(message);
};
const Suspend = (): never => {
  // 절대 resolve되지 않는 promise → Suspense fallback이 계속 렌더된다.
  throw new Promise<void>(() => {});
};

/** 기본 사용례 — 자식이 준비되면 그대로 렌더된다. */
export const Ready = () => (
  <Surface>
    <AppBoundary>
      <EmptyState icon="✅" title="불러오기 완료" desc="자식 트리가 그대로 표시됩니다." />
    </AppBoundary>
  </Surface>
);

/** 로딩 상태 — suspense 쿼리가 처음 로드될 동안의 화면. */
export const Loading = () => (
  <Surface>
    <AppBoundary>
      <Suspend />
    </AppBoundary>
  </Surface>
);

/** 에러 상태 — 쿼리 실패 시 재시도 버튼과 함께 표시된다. */
export const ErrorState = () => (
  <Surface>
    <AppBoundary>
      <Boom message="Jira API 에러 (401): 인증에 실패했습니다" />
    </AppBoundary>
  </Surface>
);
