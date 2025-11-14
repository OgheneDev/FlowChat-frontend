
"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/stores";
import { useNotificationStore } from "@/stores";
import { usePathname, useRouter } from "next/navigation";
import Loader from "../ui/Loader";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  type AuthStoreShape = {
    authUser: unknown;
    isCheckingAuth: boolean;
    checkAuth: () => void;
  };

  const router = useRouter();
  const pathname = usePathname();

  const { authUser, isCheckingAuth, checkAuth } =
    useAuthStore() as AuthStoreShape;
    
  const { initializePushNotifications } = useNotificationStore();

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  // ADD DEBUG HELPER - Runs once on mount
  useEffect(() => {
    console.log('🐛 [DEBUG] Installing notification tracking...');
    
    const OriginalNotification = window.Notification;
    let notificationCreateCounter = 0;
    
    // @ts-ignore - We're intentionally overriding for debugging
    window.Notification = function(...args: any[]) {
      notificationCreateCounter++;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚨 [DEBUG] NEW NOTIFICATION CREATED #' + notificationCreateCounter);
      console.log('🚨 [DEBUG] Timestamp:', new Date().toISOString());
      console.log('🚨 [DEBUG] Title:', args[0]);
      console.log('🚨 [DEBUG] Options:', args[1]);
      console.log('🚨 [DEBUG] Stack trace:');
      console.trace();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // @ts-ignore
      return new OriginalNotification(args[0], args[1]);
    };
    
    // Copy static methods and properties
    Object.setPrototypeOf(window.Notification, OriginalNotification);
    Object.defineProperty(window.Notification, 'permission', {
      get: () => OriginalNotification.permission
    });
    // @ts-ignore
    window.Notification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);
    
    // Track if setupForegroundHandler is called multiple times
    let setupCount = 0;
    const originalLog = console.log;
    console.log = function(...args: any[]) {
      const message = args.join(' ');
      if (message.includes('Setting up foreground message handler')) {
        setupCount++;
        console.warn(`⚠️ [DEBUG] setupForegroundHandler called ${setupCount} times!`);
      }
      return originalLog.apply(console, args);
    };
    
    console.log('✅ [DEBUG] Notification tracking installed');

    // Check for multiple service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log('🔍 [DEBUG] Active service workers:', registrations.length);
        registrations.forEach((reg, i) => {
          console.log(`🔍 [DEBUG] SW #${i + 1}:`, reg.scope);
        });
      });
    }

    // Summary after 8 seconds (after message should be sent)
    const summaryTimer = setTimeout(() => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 [DEBUG] NOTIFICATION CREATION SUMMARY');
      console.log('📊 [DEBUG] new Notification() calls:', notificationCreateCounter);
      console.log('📊 [DEBUG] setupForegroundHandler calls:', setupCount);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }, 8000);

    return () => {
      clearTimeout(summaryTimer);
      console.log = originalLog; // Restore original console.log
    };
  }, []); // Empty dependency array - runs once

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (authUser && !isCheckingAuth) {
      console.log('🔄 [CLIENT LAYOUT] Calling initializePushNotifications...');
      initializePushNotifications();
    }
  }, [authUser, isCheckingAuth]);

  useEffect(() => {
    if (!isCheckingAuth) {
      if (!authUser && !authRoutes.includes(pathname)) {
        router.replace("/login");
      } else if (authUser && authRoutes.includes(pathname)) {
        router.replace("/dashboard");
      }
    }
  }, [authUser, isCheckingAuth, pathname, router]);

  if (isCheckingAuth) {
    return <Loader />;
  }

  return <>{children}</>;
}
