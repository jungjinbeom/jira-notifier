import { Suspense } from "react";
import type { ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "./ErrorBoundary";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

/**
 * 앱 전역 데이터 경계.
 * - Suspense: suspense 쿼리가 처음 로드될 동안 로딩 UI를 보여준다.
 * - ErrorBoundary + QueryErrorResetBoundary: 쿼리 에러를 잡고,
 *   재시도 시 실패한 쿼리를 리셋해 다시 fetch하도록 한다.
 */
export const AppBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, retry) => (
            <div className="app-boundary">
              <EmptyState
                icon="⚠️"
                title="데이터를 불러오지 못했습니다"
                desc={String(error.message || error)}
              />
              <div className="btn-group">
                <Button variant="primary" onClick={retry}>
                  다시 시도
                </Button>
              </div>
            </div>
          )}
        >
          <Suspense
            fallback={
              <div className="app-boundary">
                <EmptyState
                  icon="⏳"
                  title="불러오는 중…"
                  desc="Jira 데이터를 가져오고 있습니다"
                />
              </div>
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
