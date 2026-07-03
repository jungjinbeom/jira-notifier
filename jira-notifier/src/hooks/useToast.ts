import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  text: string;
  type: ToastType;
}

/** 4초 후 자동 사라지는 토스트 메시지 상태 */
export const useToast = () => {
  const [message, setMessage] = useState<Toast | null>(null);

  const showMessage = useCallback((text: string, type: ToastType) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  return { message, showMessage };
}
