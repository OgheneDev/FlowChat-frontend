"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/stores";
import { useNotificationStore } from "@/stores/modules/notifications";
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
    
  const { initializePushNotifications } = useNotificationStore(); // ADD THIS

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ADD THIS NEW useEffect - Initialize push notifications when user is authenticated
  useEffect(() => {
    if (authUser && !isCheckingAuth) {
      initializePushNotifications();
    }
  }, [authUser, isCheckingAuth, initializePushNotifications]);

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