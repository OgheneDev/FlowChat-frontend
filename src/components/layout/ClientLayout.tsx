"use client";

import React, { useEffect } from "react";
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

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (authUser && !isCheckingAuth) {
      console.log('🔄 [CLIENT LAYOUT] Calling initializePushNotifications...');
      initializePushNotifications();
    }
  }, [authUser, isCheckingAuth, initializePushNotifications]);

  // Load chats and groups (unread counts now included in API response)
  useEffect(() => {
    if (authUser && !isCheckingAuth) {
      const loadData = async () => {
        try {
          console.log('📬 Loading chats and groups...');
          // ✅ Chats and groups now include unread counts from backend
          // No separate fetch needed!
          await Promise.all([
            getChatPartners(),
            getMyGroups()
          ]);
          console.log('📬 Chats and groups loaded with unread counts!');
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      };
      
      loadData();
    }
  }, [authUser, isCheckingAuth, getChatPartners, getMyGroups]);

  useEffect(() => {
    if (!isCheckingAuth) {
      if (!authUser && !authRoutes.includes(pathname)) {
        router.replace("/login");
      } else if (authUser && authRoutes.includes(pathname)) {
        router.replace("/chat");
      }
    }
  }, [authUser, isCheckingAuth, pathname, router]);

  if (isCheckingAuth) {
    return <Loader />;
  }

  return <>{children}</>;
}