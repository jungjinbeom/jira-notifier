import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  /** 에러 시 렌더할 내용. reset으로 재시도(경계 재마운트)를 트리거한다. */
  fallback: (error: Error, reset: () => void) => ReactNode;
  /** 재시도 시 상위(예: 쿼리 캐시) 리셋 훅 */
  onReset?: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * suspense 쿼리는 에러를 throw하므로 이를 잡는 경계가 필요하다.
 * 기존 훅들이 .catch(console.error)로 확보하던 내성을 여기서 대신 보장한다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("렌더 트리 에러:", error, info.componentStack);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}
