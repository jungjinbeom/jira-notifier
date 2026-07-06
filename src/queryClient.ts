import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** 쿼리 키를 한곳에서 관리 → 오타 방지, invalidate/setQueryData 일관성 */
export const queryKeys = {
  config: ["config"] as const,
  notifications: ["notifications"] as const,
  status: ["status"] as const,
  ticketsUnassigned: ["tickets", "unassigned"] as const,
  ticketsMy: ["tickets", "my"] as const,
};
