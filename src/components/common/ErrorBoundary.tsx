import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/button';
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
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center" role="alert">
          <div className="bg-red-100 dark:bg-red-950/30 rounded-full p-4 mb-4">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2">문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해 주세요.
          </p>
          <p className="text-sm text-muted-foreground mb-4 font-mono">
            {this.state.error?.message}
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReset}>다시 시도</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              페이지 새로고침
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
