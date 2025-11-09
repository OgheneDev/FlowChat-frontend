"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores"
import Loader from "@/components/ui/Loader"

export default function HomePage() {
  const router = useRouter()
  const { authUser, isCheckingAuth } = useAuthStore() as {
    authUser: unknown;
    isCheckingAuth: boolean;
  }

  useEffect(() => {
    if (!isCheckingAuth) {
      if (authUser) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [authUser, isCheckingAuth, router])

  return <Loader />
}