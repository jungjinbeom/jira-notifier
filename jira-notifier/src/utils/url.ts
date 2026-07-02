import { open } from "@tauri-apps/plugin-shell";

/** 외부 URL 열기. Tauri shell 실패 시 브라우저 새 탭으로 폴백 */
export async function openUrl(url: string): Promise<void> {
  try {
    await open(url);
  } catch {
    window.open(url, "_blank");
  }
}
