import type { ReactNode } from "react";
import { TicketCard } from "jira-notifier";

// 이 DS는 다크가 기본 테마(:root)다. 미리보기 하네스는 body에 background:#fff를
// 하드코딩하므로, DS의 표면 토큰을 명시적으로 씌워야 실제 앱과 같은 모습이 된다.
const Surface = ({ children, width = 380 }: { children: ReactNode; width?: number }) => (
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

// timeAgo()는 렌더 시각 기준 상대 시간을 만든다. 고정 ISO 문자열을 넣으면
// 표시 문구가 날마다 바뀌므로, 렌더 시각에서 역산해 출력이 항상 같게 한다.
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// 미리보기 데이터는 전부 가상이다. 실제 담당자명이나 고객사 티켓 내용을 넣지 말 것
// (업로드되어 프로젝트 접근자 전원에게 노출된다).

const noop = () => {};

/** 기본 사용례 — 미배정 목록의 티켓 한 건(보고자 노출). */
export const Default = () => (
  <Surface>
    <TicketCard
      ticket={{
        key: "ABC-128",
        summary: "로그인 후 첫 화면이 간헐적으로 비어 보입니다",
        status: "해야 할 일",
        reporter: "홍길동",
        updated: ago(2 * HOUR),
        url: "#",
      }}
      icon="📋"
      showReporter
      onClick={noop}
    />
  </Surface>
);

/** 상태 축 — 워크플로 상태별 표시. */
export const Statuses = () => (
  <Surface>
    <TicketCard
      ticket={{
        key: "ABC-131",
        summary: "알림 메일이 스팸함으로 분류됩니다",
        status: "해야 할 일",
        reporter: "김철수",
        updated: ago(30 * MIN),
        url: "#",
      }}
      icon="📋"
      showReporter
      onClick={noop}
    />
    <TicketCard
      ticket={{
        key: "ABC-134",
        summary: "첨부 파일명이 깨져서 업로드됩니다",
        status: "진행 중",
        reporter: "이영희",
        updated: ago(3 * HOUR),
        url: "#",
      }}
      icon="📋"
      showReporter
      onClick={noop}
    />
  </Surface>
);

/** showReporter=false — 내 담당 목록에서는 보고자를 숨긴다. */
export const WithoutReporter = () => (
  <Surface>
    <TicketCard
      ticket={{
        key: "ABC-140",
        summary: "목록 정렬 기준을 최신순으로 변경",
        status: "진행 중",
        reporter: "홍길동",
        updated: ago(45 * MIN),
        url: "#",
      }}
      icon="🎯"
      showReporter={false}
      onClick={noop}
    />
  </Surface>
);

/** 긴 제목은 줄바꿈되지 않고 한 줄로 잘린다(.notif-message: nowrap + ellipsis). */
export const LongSummaryTruncates = () => (
  <Surface>
    <TicketCard
      ticket={{
        key: "ABC-142",
        summary:
          "결제 승인 후 주문 상태가 자동으로 갱신되지 않아 담당자가 매번 수동으로 확인해야 하는 문제",
        status: "해야 할 일",
        reporter: "박민수",
        updated: ago(5 * DAY),
        url: "#",
      }}
      icon="📋"
      showReporter
      onClick={noop}
    />
  </Surface>
);
