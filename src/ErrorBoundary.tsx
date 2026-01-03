import { Component } from "react";
import type { ReactNode } from "react";
import { Button, Result } from "antd";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="문제가 발생했습니다"
          subTitle="예기치 못한 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요."
          extra={
            <Button type="primary" onClick={this.handleReload}>
              새로고침
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
