import { useState, useEffect } from "react";
import type { JiraConfig } from "../../types";
import { FormField } from "../common/FormField";
import { Button } from "../common/Button";

interface Props {
  config: JiraConfig;
  loading: boolean;
  onSave: (config: JiraConfig) => void;
  onTest: (config: JiraConfig) => void;
}

export const Settings = ({ config, loading, onSave, onTest }: Props) => {
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

        <FormField
          label="Jira URL"
          type="url"
          placeholder="https://your-domain.atlassian.net"
          value={form.base_url}
          onChange={(e) => update("base_url", e.target.value)}
          hint="Jira Cloud 또는 Server의 기본 URL"
        />

        <FormField
          label="이메일"
          type="email"
          placeholder="your-email@company.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />

        <FormField
          label="API 토큰"
          type="password"
          placeholder="Jira API 토큰 입력"
          value={form.api_token}
          onChange={(e) => update("api_token", e.target.value)}
          hint="Atlassian 계정 설정 → Security → API Token에서 생성"
        />
      </div>

      {/* 사용자 정보 */}
      <div className="form-section">
        <div className="form-section-title">사용자 정보</div>

        <div className="form-row">
          <FormField
            label="사용자명"
            type="text"
            placeholder="jira-username"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            hint="Jira 사용자 아이디"
          />

          <FormField
            label="표시 이름"
            type="text"
            placeholder="홍길동"
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            hint="멘션 감지에 사용"
          />
        </div>
      </div>

      {/* 폴링 설정 */}
      <div className="form-section">
        <div className="form-section-title">폴링 설정</div>

        <FormField
          label="확인 주기 (초)"
          type="number"
          min={10}
          max={600}
          value={form.poll_interval_secs}
          onChange={(e) =>
            update("poll_interval_secs", parseInt(e.target.value) || 60)
          }
          hint="10~600초. Jira API 호출 제한에 주의하세요."
        />
      </div>

      {/* 버튼 */}
      <div className="btn-group">
        <Button
          variant="secondary"
          disabled={loading || !form.base_url || !form.email || !form.api_token}
          onClick={() => onTest(form)}
        >
          {loading ? "테스트 중..." : "연결 테스트"}
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={loading}
          onClick={() => onSave(form)}
        >
          설정 저장
        </Button>
      </div>
    </div>
  );
}
