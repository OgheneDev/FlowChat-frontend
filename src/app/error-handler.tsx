"use client";

import { useEffect, useState } from "react";

export function GlobalErrorHandler() {
  const [errors, setErrors] = useState<Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>>([]);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("🚨 Unhandled Promise Rejection:", event.reason);
      console.error("📋 Promise:", event.promise);
      
      const errorInfo = {
        type: "Promise Rejection",
        message: String(event.reason?.message || event.reason || "Unknown error"),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      };
      
      setErrors(prev => [...prev, errorInfo]);
      
      // Show alert on iOS/Safari since console might not be visible
      if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)) {
        setTimeout(() => {
          alert(`❌ Error: ${errorInfo.message}\n\nCheck the error panel for details.`);
        }, 100);
      }
      
      // Prevent the default browser error page
      event.preventDefault();
    };

    // Handle regular errors
    const handleError = (event: ErrorEvent) => {
      console.error("🚨 Global Error:", event.error);
      console.error("📋 Message:", event.message);
      console.error("📍 Source:", event.filename);
      console.error("🔢 Line:", event.lineno, "Column:", event.colno);
      
      // Prevent default error handling for non-critical errors
      if (event.error?.message?.includes("ResizeObserver")) {
        event.preventDefault();
        return;
      }
      
      const errorInfo = {
        type: "JavaScript Error",
        message: event.message || "Unknown error",
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
      };
      
      setErrors(prev => [...prev, errorInfo]);
      
      // Show alert on iOS/Safari
      if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)) {
        setTimeout(() => {
          alert(`❌ Error: ${errorInfo.message}\n\nCheck the error panel for details.`);
        }, 100);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <>
      {/* Floating error indicator with pulse animation */}
      <div 
        className="fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
        style={{ 
          backgroundColor: '#ff6b6b',
          color: '#ffffff',
          boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)'
        }}
        onClick={() => setShowErrors(!showErrors)}
      >
        <div className="flex items-center gap-2 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errors.length} Error{errors.length > 1 ? 's' : ''}</span>
          <svg className={`w-4 h-4 transition-transform ${showErrors ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Error panel */}
      {showErrors && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a' }}>
            {/* Header */}
            <div className="p-6 flex justify-between items-center" style={{ backgroundColor: '#1e1e1e', borderBottom: '1px solid #3a3a3a' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ff6b6b20' }}>
                  <svg className="w-6 h-6" style={{ color: '#ff6b6b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#00d9ff' }}>
                    Application Errors
                  </h2>
                  <p className="text-sm" style={{ color: '#8a8a8a' }}>
                    {errors.length} error{errors.length > 1 ? 's' : ''} detected
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowErrors(false)}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                style={{ backgroundColor: '#3a3a3a', color: '#00d9ff' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Error list */}
            <div className="overflow-y-auto p-6 space-y-4" style={{ backgroundColor: '#1e1e1e' }}>
              {errors.map((error, index) => (
                <div 
                  key={index} 
                  className="rounded-lg p-5"
                  style={{ 
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #ff6b6b40'
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#ff6b6b30', color: '#ff6b6b' }}>
                        {error.type}
                      </span>
                      <span className="text-xs" style={{ color: '#6a6a6a' }}>
                        #{index + 1}
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#8a8a8a' }}>
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="font-semibold mb-3 leading-relaxed" style={{ color: '#ff6b6b' }}>
                    {error.message}
                  </p>
                  
                  {error.stack && (
                    <details className="mt-3">
                      <summary 
                        className="cursor-pointer text-sm font-medium px-3 py-2 rounded-lg inline-flex items-center gap-2 transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#3a3a3a', color: '#00d9ff' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        View Stack Trace
                      </summary>
                      <pre 
                        className="mt-3 text-xs p-4 rounded-lg overflow-x-auto font-mono leading-relaxed"
                        style={{ 
                          backgroundColor: '#1a1a1a',
                          color: '#00d9ff',
                          border: '1px solid #3a3a3a'
                        }}
                      >
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
            
            {/* Footer actions */}
            <div className="p-4 flex flex-wrap gap-2" style={{ backgroundColor: '#1e1e1e', borderTop: '1px solid #3a3a3a' }}>
              <button
                onClick={() => setErrors([])}
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: '#3a3a3a',
                  color: '#a0a0a0',
                  border: '1px solid #4a4a4a'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
              <button
                onClick={() => {
                  const errorText = errors.map((e, i) => 
                    `Error ${i + 1}:\nType: ${e.type}\nMessage: ${e.message}\nStack: ${e.stack || 'N/A'}\nTime: ${e.timestamp}\n\n`
                  ).join('---\n');
                  navigator.clipboard.writeText(errorText);
                  alert('Errors copied to clipboard!');
                }}
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: '#3a3a3a',
                  color: '#00d9ff',
                  border: '1px solid #4a4a4a'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Errors
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: '#00d9ff',
                  color: '#1e1e1e',
                  boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}