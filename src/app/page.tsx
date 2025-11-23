"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores"
import Loader from "@/components/ui/Loader"

export default function HomePage() {
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get values directly from store
  const authUser = useAuthStore((state) => state.authUser)
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return;

    const handleRedirect = async () => {
      try {
        if (!isCheckingAuth) {
          console.log('🏠 Home page redirect logic:', { authUser: !!authUser, isCheckingAuth });
          
          if (authUser) {
            console.log('🔀 Redirecting to /chat');
            setHasRedirected(true);
            router.replace("/chat");
          } else {
            console.log('🔀 Redirecting to /login');
            setHasRedirected(true);
            router.replace("/login");
          }
        }
      } catch (err) {
        console.error('❌ Redirect error:', err);
        setError('Navigation failed');
      }
    };

    // Small delay to prevent race conditions
    const timer = setTimeout(handleRedirect, 50);
    return () => clearTimeout(timer);
  }, [authUser, isCheckingAuth, router, hasRedirected])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <Loader />
}