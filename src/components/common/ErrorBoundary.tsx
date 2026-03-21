import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Sentry } from '../../lib/sentry';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

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
    console.error('[ErrorBoundary]', error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Card className="m-6 border-red-200 dark:border-red-800">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">오류가 발생했습니다</h3>
              <p className="text-sm text-muted-foreground mt-1">
                예기치 않은 오류가 발생했습니다. 다시 시도해주세요.
              </p>
            </div>
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw size={14} className="mr-2" />
              다시 시도
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
