"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuthStore, usePrivateChatStore, useGroupStore } from "@/stores";
import { useNotificationStore } from "@/stores";
import { usePathname, useRouter } from "next/navigation";
import Loader from "../ui/Loader";
import { GlobalErrorHandler } from "@/app/error-handler";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const initializationAttempts = useRef(0);

  // Get store values safely
  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  // 1. Check auth on mount only
  useEffect(() => {
    const checkAuthSafely = async () => {
      try {
        console.log('🔐 Starting auth check...');
        const checkAuth = useAuthStore.getState().checkAuth;
        await checkAuth();
        console.log('✅ Auth check completed');
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setError('Authentication check failed');
      }
    };

    checkAuthSafely();
  }, []);

  // 2. Handle routing based on auth state
  useEffect(() => {
    if (!isCheckingAuth) {
      try {
        const isAuthRoute = authRoutes.includes(pathname);
        
        if (!authUser && !isAuthRoute) {
          console.log('🔀 Redirecting to login (no auth)');
          router.replace("/login");
        } else if (authUser && isAuthRoute) {
          console.log('🔀 Redirecting to chat (authenticated)');
          router.replace("/chat");
        }
      } catch (error) {
        console.error('❌ Routing error:', error);
        setError('Navigation error');
      }
    }
  }, [authUser, isCheckingAuth, pathname]);

  // 3. Initialize app data (push notifications, chats, groups)
  useEffect(() => {
    if (!authUser || isCheckingAuth || hasInitialized.current) {
      return;
    }

    // Prevent infinite loops - max 3 attempts
    if (initializationAttempts.current >= 3) {
      console.warn('⚠️ Max initialization attempts reached');
      return;
    }

    hasInitialized.current = true;
    initializationAttempts.current += 1;

    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app (attempt', initializationAttempts.current, ')...');

        // Get functions from store state (not from hooks)
        const { initializePushNotifications } = useNotificationStore.getState();
        const { getChatPartners } = usePrivateChatStore.getState();
        const { getMyGroups } = useGroupStore.getState();

        // Initialize push notifications (non-blocking)
        try {
          console.log('🔔 Initializing push notifications...');
          await Promise.race([
            initializePushNotifications(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Push notification timeout')), 5000)
            )
          ]);
          console.log('✅ Push notifications initialized');
        } catch (notifError) {
          console.warn('⚠️ Push notifications failed (non-critical):', notifError);
          // Continue even if push notifications fail
        }

        // Load chats and groups with timeout
        try {
          console.log('📬 Loading chats and groups...');
          await Promise.race([
            Promise.all([
              getChatPartners().catch(err => {
                console.error('Chat partners error:', err);
                return null;
              }),
              getMyGroups().catch(err => {
                console.error('Groups error:', err);
                return null;
              })
            ]),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Data loading timeout')), 10000)
            )
          ]);
          console.log('✅ App initialized successfully');
        } catch (dataError) {
          console.error('❌ Data loading error:', dataError);
          // Don't set error - allow app to continue with empty data
          hasInitialized.current = false; // Allow retry
        }
      } catch (error) {
        console.error('❌ App initialization error:', error);
        hasInitialized.current = false; // Allow retry
        // Don't block the UI - just log the error
      }
    };

    // Run initialization after a brief delay to ensure routing completes
    const timer = setTimeout(() => {
      initializeApp();
    }, 100);

    return () => clearTimeout(timer);
  }, [authUser, isCheckingAuth]);

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              hasInitialized.current = false;
              initializationAttempts.current = 0;
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Show loader while checking auth
  if (isCheckingAuth) {
    return <Loader />;
  }

  return (
    <>
      <GlobalErrorHandler />
      {children}
    </>
  );
}