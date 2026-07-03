import { useToastMessage } from "@/context/contexts";

/** 토스트 메시지만 구독해 렌더한다. 토스트 변화가 Layout 전체를 건드리지 않도록 격리. */
export const ToastHost = () => {
  const { message } = useToastMessage();
  if (!message) return null;
  return <div className={`toast ${message.type}`}>{message.text}</div>;
};
