import { useState, useEffect } from "react";
import type { JiraConfig } from "../types";
import { api } from "../api";
import type { ToastType } from "./useToast";

interface Params {
  setLoading: (v: boolean) => void;
  showMessage: (text: string, type: ToastType) => void;
}

const EMPTY_CONFIG: JiraConfig = {
  base_url: "",
  email: "",
  api_token: "",
  username: "",
  display_name: "",
  poll_interval_secs: 60,
};

/** Jira 설정 상태 + 저장/연결테스트 */
export function useConfig({ setLoading, showMessage }: Params) {
  const [config, setConfig] = useState<JiraConfig>(EMPTY_CONFIG);

  useEffect(() => {
    api
      .getConfig()
      .then(setConfig)
      .catch((e) => console.error("설정 로드 실패:", e));
  }, []);

  const saveConfig = async (newConfig: JiraConfig) => {
    setLoading(true);
    try {
      await api.saveConfig(newConfig);
      setConfig(newConfig);
      showMessage("설정이 저장되었습니다", "success");
    } catch (e) {
      showMessage(`저장 실패: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (testConfig: JiraConfig) => {
    setLoading(true);
    try {
      const result = await api.testConnection(testConfig);
      showMessage(result, "success");
    } catch (e) {
      showMessage(`${e}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return { config, saveConfig, testConnection };
}
