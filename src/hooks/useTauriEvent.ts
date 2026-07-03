import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

/**
 * Tauri 이벤트를 구독하고 언마운트 시 해제한다.
 * 핸들러는 ref에 담아 최신값을 유지하므로, 이벤트 이름이 바뀌지 않는 한
 * 마운트 시 1회만 구독한다(기존 useEffect([]) 동작과 동일).
 */
export const useTauriEvent = <T,>(
  name: string,
  handler: (payload: T) => void
): void => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unlisten = listen<T>(name, (event) => handlerRef.current(event.payload));
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [name]);
}
