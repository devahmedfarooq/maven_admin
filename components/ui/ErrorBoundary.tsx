'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card, Space } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <Space direction="vertical" size="large" className="w-full text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 mb-4">
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert
                  message="Error Details (Development)"
                  description={
                    <div className="text-left">
                      <p className="font-semibold">{this.state.error.name}: {this.state.error.message}</p>
                      <pre className="text-xs mt-2 overflow-auto max-h-32">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  }
                  type="error"
                  showIcon
                />
              )}

              <Space>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button 
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  Go to Dashboard
                </Button>
              </Space>
            </Space>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 