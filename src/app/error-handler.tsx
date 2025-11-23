"use client";

import { useEffect } from "react";

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("🚨 Unhandled Promise Rejection:", event.reason);
      console.error("📋 Promise:", event.promise);
      
      // Prevent the default browser error page
      event.preventDefault();
      
      // You can add custom error reporting here
      // Example: Send to error tracking service
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
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}