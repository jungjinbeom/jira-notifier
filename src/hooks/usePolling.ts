import { useCallback } from "react";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import { queryClient, queryKeys } from "@/queryClient";
import type { ToastType } from "./useToast";

interface Params {
  setLoading: (v: boolean) => void;
  showMessage: (text: string, type: ToastType) => void;
}

/**
 * 폴링 상태(status) 보유 + 시작/중지.
 * setInterval 대신 useSuspenseQuery의 refetchInterval(5초)로 주기 갱신한다.
 */
export const usePolling = ({ setLoading, showMessage }: Params) => {
  const { data: status } = useSuspenseQuery({
    queryKey: queryKeys.status,
    queryFn: api.getStatus,
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: api.startPolling,
    onMutate: () => setLoading(true),
    onSuccess: (result) => {
      showMessage(result, "success");
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
    onError: (e) => showMessage(`${e}`, "error"),
    onSettled: () => setLoading(false),
  });

  const stopMutation = useMutation({
    mutationFn: api.stopPolling,
    onMutate: () => setLoading(true),
    onSuccess: (result) => {
      showMessage(result, "info");
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
    onError: (e) => showMessage(`${e}`, "error"),
    onSettled: () => setLoading(false),
  });

  const startPolling = useCallback(
    () => startMutation.mutate(),
    [startMutation]
  );
  const stopPolling = useCallback(() => stopMutation.mutate(), [stopMutation]);

  return { status, startPolling, stopPolling };
};
