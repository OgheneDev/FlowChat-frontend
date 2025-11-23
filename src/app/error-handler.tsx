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
      {/* Floating error indicator */}
      <div 
        className="fixed top-4 right-4 z-[9999] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-red-600 transition-colors"
        onClick={() => setShowErrors(!showErrors)}
      >
        ⚠️ {errors.length} Error{errors.length > 1 ? 's' : ''} - Click to {showErrors ? 'hide' : 'view'}
      </div>

      {/* Error panel */}
      {showErrors && (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-red-500 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Application Errors ({errors.length})</h2>
              <button 
                onClick={() => setShowErrors(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-4">
              {errors.map((error, index) => (
                <div key={index} className="border border-red-300 rounded p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-red-800">{error.type}</span>
                    <span className="text-xs text-gray-500">{error.timestamp}</span>
                  </div>
                  <p className="text-red-900 font-semibold mb-2">{error.message}</p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-700">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
            
            <div className="border-t p-4 flex gap-2">
              <button
                onClick={() => setErrors([])}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear Errors
              </button>
              <button
                onClick={() => {
                  const errorText = errors.map((e, i) => 
                    `Error ${i + 1}:\nType: ${e.type}\nMessage: ${e.message}\nStack: ${e.stack || 'N/A'}\nTime: ${e.timestamp}\n\n`
                  ).join('---\n');
                  navigator.clipboard.writeText(errorText);
                  alert('Errors copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copy All Errors
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}