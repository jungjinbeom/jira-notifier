import { useState, useEffect } from "react";
import type { JiraConfig } from "../types";

interface Props {
  config: JiraConfig;
  loading: boolean;
  onSave: (config: JiraConfig) => void;
  onTest: (config: JiraConfig) => void;
}

export function Settings({ config, loading, onSave, onTest }: Props) {
  const [form, setForm] = useState<JiraConfig>(config);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const update = (field: keyof JiraConfig, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      {/* 연결 정보 */}
      <div className="form-section">
        <div className="form-section-title">Jira 연결 정보</div>

        <div className="form-group">
          <label className="form-label">Jira URL</label>
          <input
            className="form-input"
            type="url"
            placeholder="https://your-domain.atlassian.net"
            value={form.base_url}
            onChange={(e) => update("base_url", e.target.value)}
          />
          <div className="form-hint">
            Jira Cloud 또는 Server의 기본 URL
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">이메일</label>
          <input
            className="form-input"
            type="email"
            placeholder="your-email@company.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">API 토큰</label>
          <input
            className="form-input"
            type="password"
            placeholder="Jira API 토큰 입력"
            value={form.api_token}
            onChange={(e) => update("api_token", e.target.value)}
          />
          <div className="form-hint">
            Atlassian 계정 설정 → Security → API Token에서 생성
          </div>
        </div>
      </div>

      {/* 사용자 정보 */}
      <div className="form-section">
        <div className="form-section-title">사용자 정보</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">사용자명</label>
            <input
              className="form-input"
              type="text"
              placeholder="jira-username"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
            />
            <div className="form-hint">Jira 사용자 아이디</div>
          </div>

          <div className="form-group">
            <label className="form-label">표시 이름</label>
            <input
              className="form-input"
              type="text"
              placeholder="홍길동"
              value={form.display_name}
              onChange={(e) => update("display_name", e.target.value)}
            />
            <div className="form-hint">멘션 감지에 사용</div>
          </div>
        </div>
      </div>

      {/* 폴링 설정 */}
      <div className="form-section">
        <div className="form-section-title">폴링 설정</div>

        <div className="form-group">
          <label className="form-label">확인 주기 (초)</label>
          <input
            className="form-input"
            type="number"
            min={10}
            max={600}
            value={form.poll_interval_secs}
            onChange={(e) =>
              update("poll_interval_secs", parseInt(e.target.value) || 60)
            }
          />
          <div className="form-hint">
            10~600초. Jira API 호출 제한에 주의하세요.
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="btn-group">
        <button
          className="btn btn-secondary"
          disabled={loading || !form.base_url || !form.email || !form.api_token}
          onClick={() => onTest(form)}
        >
          {loading ? "테스트 중..." : "연결 테스트"}
        </button>
        <button
          className="btn btn-primary btn-full"
          disabled={loading}
          onClick={() => onSave(form)}
        >
          설정 저장
        </button>
      </div>
    </div>
  );
}
