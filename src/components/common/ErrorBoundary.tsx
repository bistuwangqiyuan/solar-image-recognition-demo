import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // 这里可以添加错误上报逻辑
    // 例如发送到错误监控服务
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="card">
              <div className="card-body text-center">
                {/* 错误图标 */}
                <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-error-600" />
                </div>

                {/* 错误标题 */}
                <h1 className="text-2xl font-bold text-secondary-900 mb-2">
                  出现了一些问题
                </h1>

                {/* 错误描述 */}
                <p className="text-secondary-600 mb-6">
                  很抱歉，应用程序遇到了一个意外错误。我们的团队已经收到通知，正在努力修复这个问题。
                </p>

                {/* 错误详情（开发环境） */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-6 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-secondary-700 mb-2">
                      错误详情 (开发环境)
                    </summary>
                    <div className="bg-secondary-100 rounded-lg p-3 text-xs font-mono text-secondary-800 overflow-auto max-h-32">
                      <div className="mb-2">
                        <strong>错误信息:</strong>
                        <div className="mt-1">{this.state.error.message}</div>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>组件堆栈:</strong>
                          <div className="mt-1 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="btn btn-primary btn-md flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>重试</span>
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="btn btn-outline btn-md flex items-center justify-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>返回首页</span>
                  </button>
                </div>

                {/* 联系支持 */}
                <div className="mt-6 pt-6 border-t border-secondary-200">
                  <p className="text-sm text-secondary-500 mb-2">
                    如果问题持续存在，请联系我们的技术支持团队
                  </p>
                  <a
                    href="mailto:support@solar-recognition.com"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
                  >
                    support@solar-recognition.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

