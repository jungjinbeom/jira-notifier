import { useCallback } from "react";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import type { JiraConfig } from "@/types";
import { api } from "@/api";
import { queryClient, queryKeys } from "@/queryClient";
import type { ToastType } from "./useToast";

interface Params {
  setLoading: (v: boolean) => void;
  showMessage: (text: string, type: ToastType) => void;
}

/** Jira 설정 상태 + 저장/연결테스트 */
export const useConfig = ({ setLoading, showMessage }: Params) => {
  const { data: config } = useSuspenseQuery({
    queryKey: queryKeys.config,
    queryFn: api.getConfig,
  });

  const saveMutation = useMutation({
    mutationFn: api.saveConfig,
    onMutate: () => setLoading(true),
    onSuccess: (_result, newConfig) => {
      queryClient.setQueryData(queryKeys.config, newConfig);
      showMessage("설정이 저장되었습니다", "success");
    },
    onError: (e) => showMessage(`저장 실패: ${e}`, "error"),
    onSettled: () => setLoading(false),
  });

  const testMutation = useMutation({
    mutationFn: api.testConnection,
    onMutate: () => setLoading(true),
    onSuccess: (result) => showMessage(result, "success"),
    onError: (e) => showMessage(`${e}`, "error"),
    onSettled: () => setLoading(false),
  });

  const saveConfig = useCallback(
    (newConfig: JiraConfig) => saveMutation.mutate(newConfig),
    [saveMutation]
  );
  const testConnection = useCallback(
    (testConfig: JiraConfig) => testMutation.mutate(testConfig),
    [testMutation]
  );

  return { config, saveConfig, testConnection };
};
