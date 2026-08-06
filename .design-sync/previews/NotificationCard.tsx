import type { ReactNode } from "react";
import { NotificationCard } from "jira-notifier";

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

// 미리보기 데이터는 전부 가상이다. 실제 담당자명이나 고객사 티켓 내용을 넣지 말 것.

const noop = () => {};

/** 기본 사용례 — 읽지 않은 담당자 지정 알림. */
export const Default = () => (
  <Surface>
    <NotificationCard
      notification={{
        id: "assign-ABC-128",
        issue_key: "ABC-128",
        summary: "로그인 후 첫 화면이 간헐적으로 비어 보입니다",
        notification_type: "Assigned",
        message: "[ABC-128] 로그인 후 첫 화면이 간헐적으로 비어 보입니다 (해야 할 일)",
        timestamp: ago(20 * MIN),
        url: "#",
        read: false,
      }}
      onClick={noop}
    />
  </Surface>
);

/** 주요 변화 축 — 알림 종류(담당자 지정 vs 멘션). */
export const Types = () => (
  <Surface>
    <NotificationCard
      notification={{
        id: "assign-ABC-131",
        issue_key: "ABC-131",
        summary: "알림 메일이 스팸함으로 분류됩니다",
        notification_type: "Assigned",
        message: "[ABC-131] 알림 메일이 스팸함으로 분류됩니다 (해야 할 일)",
        timestamp: ago(40 * MIN),
        url: "#",
        read: false,
      }}
      onClick={noop}
    />
    <NotificationCard
      notification={{
        id: "mention-ABC-134-1",
        issue_key: "ABC-134",
        summary: "첨부 파일명이 깨져서 업로드됩니다",
        notification_type: "Mention",
        message: "김철수님이 [ABC-134] 첨부 파일명이 깨져서 업로드됩니다에서 멘션했습니다",
        timestamp: ago(2 * HOUR),
        url: "#",
        read: false,
      }}
      onClick={noop}
    />
  </Surface>
);

/** 읽음/읽지 않음 — unread 클래스로 강조가 달라진다. */
export const ReadState = () => (
  <Surface>
    <NotificationCard
      notification={{
        id: "assign-ABC-140",
        issue_key: "ABC-140",
        summary: "목록 정렬 기준을 최신순으로 변경",
        notification_type: "Assigned",
        message: "[ABC-140] 목록 정렬 기준을 최신순으로 변경 (진행 중)",
        timestamp: ago(15 * MIN),
        url: "#",
        read: false,
      }}
      onClick={noop}
    />
    <NotificationCard
      notification={{
        id: "assign-ABC-121",
        issue_key: "ABC-121",
        summary: "검색 결과 페이지네이션 오류",
        notification_type: "Assigned",
        message: "[ABC-121] 검색 결과 페이지네이션 오류 (완료)",
        timestamp: ago(5 * HOUR),
        url: "#",
        read: true,
      }}
      onClick={noop}
    />
  </Surface>
);
