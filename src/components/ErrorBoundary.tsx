"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 Error Boundary caught an error:", error);
    console.error("📋 Error Info:", errorInfo);
    console.error("📍 Component Stack:", errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to your error tracking service here if you have one
    // Example: Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: '#1e1e1e' }}>
          <div className="max-w-2xl w-full rounded-xl p-8" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a' }}>
            <div className="text-center">
              {/* Icon with animated pulse effect */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: '#00d9ff20' }}>
                <svg 
                  className="w-10 h-10" 
                  style={{ color: '#00d9ff' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold mb-3" style={{ color: '#00d9ff' }}>
                Something Went Wrong
              </h1>
              <p className="text-lg mb-6" style={{ color: '#a0a0a0' }}>
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              
              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary 
                    className="cursor-pointer text-sm font-medium mb-3 px-4 py-2 rounded-lg inline-block transition-colors hover:opacity-80"
                    style={{ backgroundColor: '#3a3a3a', color: '#00d9ff' }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Show Technical Details
                    </span>
                  </summary>
                  <div className="rounded-lg p-4 text-xs overflow-auto max-h-64 font-mono" style={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a' }}>
                    <p className="font-bold mb-3" style={{ color: '#ff6b6b' }}>
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    <pre className="whitespace-pre-wrap leading-relaxed" style={{ color: '#d4d4d4' }}>
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="mt-3 pt-3 whitespace-pre-wrap leading-relaxed" style={{ color: '#d4d4d4', borderTop: '1px solid #3a3a3a' }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95"
                  style={{ 
                    backgroundColor: '#00d9ff', 
                    color: '#1e1e1e',
                    boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)'
                  }}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reload Page
                  </span>
                </button>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                  }}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: '#3a3a3a', 
                    color: '#00d9ff',
                    border: '1px solid #4a4a4a'
                  }}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Try Again
                  </span>
                </button>
              </div>

              <p className="mt-6 text-xs" style={{ color: '#6a6a6a' }}>
                If this problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}