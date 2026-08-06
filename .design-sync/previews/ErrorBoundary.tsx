import type { ReactNode } from "react";
import { ErrorBoundary, EmptyState, Button } from "jira-notifier";

// 이 DS는 다크가 기본 테마(:root)다. 미리보기 하네스는 body에 background:#fff를
// 하드코딩하므로, DS의 표면 토큰을 명시적으로 씌워야 실제 앱과 같은 모습이 된다.
const Surface = ({
  children,
  width = 340,
}: {
  children: ReactNode;
  width?: number;
}) => (
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

// 경계는 자식이 throw해야 fallback을 보여준다. 렌더 중 throw는 정적으로 재현되므로
// 미리보기에서 에러 상태를 그대로 캡처할 수 있다.
const Boom = ({ message }: { message: string }): never => {
  throw new Error(message);
};

/** 기본 사용례 — 자식이 정상일 때는 그대로 통과시킨다. */
export const PassesChildrenThrough = () => (
  <Surface>
    <ErrorBoundary fallback={() => <div>오류</div>}>
      <EmptyState
        icon="✅"
        title="정상 렌더"
        desc="에러가 없으면 자식이 그대로 보입니다."
      />
    </ErrorBoundary>
  </Surface>
);

/** 에러 상태 — fallback(error, reset)이 렌더된다. */
export const ErrorFallback = () => (
  <Surface>
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="app-boundary">
          <EmptyState
            icon="⚠️"
            title="데이터를 불러오지 못했습니다"
            desc={String(error.message)}
          />
          <div className="btn-group">
            <Button variant="primary" onClick={retry}>
              다시 시도
            </Button>
          </div>
        </div>
      )}
    >
      <Boom message="Jira API 에러 (401): 인증에 실패했습니다" />
    </ErrorBoundary>
  </Surface>
);

/** 간결한 fallback — 재시도 버튼 없이 문구만. */
export const MinimalFallback = () => (
  <Surface>
    <ErrorBoundary
      fallback={(error) => (
        <EmptyState icon="⚠️" title="오류" desc={String(error.message)} />
      )}
    >
      <Boom message="네트워크 연결이 끊어졌습니다" />
    </ErrorBoundary>
  </Surface>
);
