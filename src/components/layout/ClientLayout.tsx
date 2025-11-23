"use client";

import React, { useEffect, useRef } from "react";
import { useAuthStore, usePrivateChatStore, useGroupStore } from "@/stores";
import { useNotificationStore } from "@/stores";
import { usePathname, useRouter } from "next/navigation";
import Loader from "../ui/Loader";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
  const { getChatPartners } = usePrivateChatStore();
  const { getMyGroups } = useGroupStore();
  const { initializePushNotifications } = useNotificationStore();

  // Track if initial data has been loaded
  const hasInitialized = useRef(false);

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  // 1. Check auth on mount only
  useEffect(() => {
    checkAuth();
  }, []); // Remove checkAuth from dependencies

  // 2. Handle routing based on auth state
  useEffect(() => {
    if (!isCheckingAuth) {
      if (!authUser && !authRoutes.includes(pathname)) {
        router.replace("/login");
      } else if (authUser && authRoutes.includes(pathname)) {
        router.replace("/chat");
      }
    }
  }, [authUser, isCheckingAuth, pathname]); // Only auth state, not router

  // 3. Initialize push notifications and load data once
  useEffect(() => {
    if (authUser && !isCheckingAuth && !hasInitialized.current) {
      hasInitialized.current = true;
      
      const initializeApp = async () => {
        try {
          console.log('🔄 [CLIENT LAYOUT] Initializing app...');
          
          // Initialize push notifications
          initializePushNotifications();
          
          // Load chats and groups
          await Promise.all([
            getChatPartners(),
            getMyGroups()
          ]);
          
          console.log('✅ App initialized successfully!');
        } catch (error) {
          console.error('❌ Error initializing app:', error);
          hasInitialized.current = false; // Allow retry on error
        }
      };
      
      initializeApp();
    }
  }, [authUser, isCheckingAuth]); // Remove function dependencies

  if (isCheckingAuth) {
    return <Loader />;
  }

  return <>{children}</>;
}