import type { ReactNode } from "react";
import { Header } from "./Header";
import { TabBar } from "./TabBar";
import { ToastHost } from "./ToastHost";

/**
 * 앱의 시각적 셸: 헤더 + 탭바 + 콘텐츠 영역 + 토스트 배치.
 * 상태는 각 하위 컴포넌트가 컨텍스트에서 직접 소비하므로 props는 children뿐이다.
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="app">
      <Header />
      <TabBar />
      <div className="content">{children}</div>
      <ToastHost />
    </div>
  );
};
