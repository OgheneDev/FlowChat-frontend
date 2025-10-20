"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname, useRouter } from "next/navigation";

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

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
