import { usePrivateChatStore } from "@/stores";


export const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // components/chat/utils/getAuthUserId.ts
export const getAuthUserId = (): string | null => {
  try {
    const privateChatState = usePrivateChatStore.getState() as any;
    if (privateChatState.authUser?._id) return privateChatState.authUser._id;
    const authStore = (window as any).useAuthStore;
    return authStore?.getState?.()?.authUser?._id || null;
  } catch {
    return null;
  }
};