import type { ReactNode } from "react";
import { EmptyState } from "jira-notifier";

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

/** 기본 사용례 — 읽지 않은 알림이 없을 때. */
export const Default = () => (
  <Surface>
    <EmptyState
      icon="🔔"
      title="새 알림이 없습니다"
      desc="담당자 지정이나 멘션이 생기면 여기에 표시됩니다."
    />
  </Surface>
);

/** 목록별 문구 — 미배정/내 담당 탭. */
export const TicketLists = () => (
  <Surface>
    <EmptyState
      icon="📋"
      title="미배정 티켓이 없습니다"
      desc="담당자가 지정되지 않은 티켓이 모두 처리되었습니다."
    />
    <EmptyState
      icon="🎯"
      title="담당 중인 티켓이 없습니다"
      desc="나에게 배정된 진행 중 티켓이 없습니다."
    />
  </Surface>
);

/** 오류/설정 안내 — desc는 ReactNode라 마크업을 넣을 수 있다. */
export const WithRichDesc = () => (
  <Surface>
    <EmptyState
      icon="⚙️"
      title="Jira 연결이 필요합니다"
      desc={
        <>
          <b>설정</b> 탭에서 주소와 API 토큰을 입력하세요.
        </>
      }
    />
  </Surface>
);

/** 로딩·오류 상태 문구. */
export const LoadingAndError = () => (
  <Surface>
    <EmptyState icon="⏳" title="불러오는 중…" desc="Jira 데이터를 가져오고 있습니다" />
    <EmptyState
      icon="⚠️"
      title="데이터를 불러오지 못했습니다"
      desc="네트워크 연결을 확인한 뒤 다시 시도해 주세요."
    />
  </Surface>
);
