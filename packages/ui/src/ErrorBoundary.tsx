import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 my-8">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Đã có sự cố hiển thị xảy ra</h2>
          <p className="text-xs text-slate-500 max-w-md mb-6">
            Hệ thống đã tự động ghi nhận lỗi và cách ly khu vực giao diện. Vui lòng tải lại trang hoặc thử lại sau.
          </p>
          <Button onClick={this.handleReset}>
            Tải Lại Trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
