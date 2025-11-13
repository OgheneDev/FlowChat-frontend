import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { messaging } from "@/config/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { usePrivateChatStore } from "./privateChats";
import { useGroupStore } from "./groups";
import { useAuthStore } from "./auth";

interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  fcmToken: string | null;
  isInitialized: boolean;

  initializePushNotifications: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  getFCMToken: () => Promise<string | null>;
  registerDeviceToken: (token: string, deviceType?: string) => Promise<void>;
  removeDeviceToken: (token: string) => Promise<void>;
  setupForegroundHandler: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  isSupported: typeof window !== 'undefined' && 'Notification' in window,
  permission: typeof window !== 'undefined' ? Notification.permission : 'default',
  fcmToken: null,
  isInitialized: false,

  initializePushNotifications: async () => {
    console.log('🔄 [FRONTEND] Starting push notification setup...');
    
    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('🔄 [FRONTEND] Skipping - running on server');
      return;
    }

    const { isSupported } = get();
    
    if (!isSupported) {
      console.log('❌ [FRONTEND] Push notifications not supported in this browser');
      return;
    }

    try {
      console.log('🔄 [FRONTEND] Requesting notification permission...');
      const hasPermission = await get().requestNotificationPermission();
      console.log('🔄 [FRONTEND] Permission result:', hasPermission);
      
      if (hasPermission && messaging) {
        console.log('🔄 [FRONTEND] Getting FCM token...');
        const token = await get().getFCMToken();
        console.log('🔄 [FRONTEND] FCM token received:', token);
        
        if (token) {
          console.log('🔄 [FRONTEND] Registering token with backend...');
          await get().registerDeviceToken(token, 'web');
          console.log('🔄 [FRONTEND] Token registration completed');
          get().setupForegroundHandler();
        } else {
          console.log('❌ [FRONTEND] No FCM token received');
        }
      } else {
        console.log('❌ [FRONTEND] No permission or messaging not available');
      }
      
      set({ isInitialized: true });
      console.log('✅ [FRONTEND] Push notification setup completed');
    } catch (error) {
      console.error('💥 [FRONTEND] Push notification setup error:', error);
      set({ isInitialized: true });
    }
  },

  requestNotificationPermission: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    try {
      console.log('🔄 [FRONTEND] Calling Notification.requestPermission()...');
      const permission = await Notification.requestPermission();
      set({ permission });
      console.log('🔄 [FRONTEND] Permission result:', permission);

      if (permission === 'granted') {
        console.log('✅ [FRONTEND] Notification permission granted.');
        return true;
      } else {
        console.log('❌ [FRONTEND] Unable to get permission to notify.');
        return false;
      }
    } catch (error) {
      console.error('💥 [FRONTEND] Error requesting notification permission:', error);
      return false;
    }
  },

  getFCMToken: async (): Promise<string | null> => {
    if (!messaging || typeof window === 'undefined') {
      console.log('❌ [FRONTEND] Messaging not available or running on server');
      return null;
    }

    try {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.error('❌ [FRONTEND] VAPID key not found');
        return null;
      }

      console.log('🔄 [FRONTEND] Calling getToken() with VAPID key...');
      const token = await getToken(messaging, { vapidKey });
      
      if (token) {
        set({ fcmToken: token });
        console.log('✅ [FRONTEND] FCM token received:', token);
        return token;
      } else {
        console.log('❌ [FRONTEND] No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('💥 [FRONTEND] Error getting FCM token:', error);
      return null;
    }
  },

  registerDeviceToken: async (token: string, deviceType: string = 'web') => {
  try {
    console.log('🔄 [FRONTEND] Starting device token registration...');
    const socket = useAuthStore.getState().socket;
    console.log('🔄 [FRONTEND] Socket available:', !!socket);
    console.log('🔄 [FRONTEND] Socket connected:', socket?.connected);
    
    if (socket && socket.connected) {
      console.log('📡 [FRONTEND] Sending token via socket...');
      socket.emit('registerDeviceToken', { token, deviceType });
      console.log('✅ [FRONTEND] Device token registered via socket');
    } else {
      console.log('🌐 [FRONTEND] Socket not connected, using HTTP...');
      await axiosInstance.post('/notifications/register-token', {
        token,
        deviceType
      });
      console.log('✅ [FRONTEND] Device token registered via HTTP');
    }
  } catch (error) {
    console.error('💥 [FRONTEND] Error registering device token:', error);
  }
},

  removeDeviceToken: async (token: string) => {
    try {
      const socket = useAuthStore.getState().socket;
      
      if (socket) {
        socket.emit('removeDeviceToken', { token });
      } else {
        await axiosInstance.post('/notifications/remove-token', { token });
      }
      console.log('Device token removed');
    } catch (error) {
      console.error('Error removing device token:', error);
    }
  },

  setupForegroundHandler: () => {
    if (!messaging || typeof window === 'undefined') return null;

    // Handle messages when app is in foreground
    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      
      if (payload.notification) {
        const { title, body } = payload.notification;
        
        // Create browser notification
        new Notification(title || 'New Message', {
          body: body || 'You have a new message',
          icon: '/icon.png',
          badge: '/badge.png',
          tag: 'chat-notification'
        });
        
        // Handle notification data to update UI
        handleNotificationPayload(payload);
      }
    });
  }
}));

// Handle notification payload and update UI
const handleNotificationPayload = (payload: any) => {
  const { data } = payload;
  
  if (!data) return;

  switch (data.type) {
    case 'new_message':
      const privateStore = usePrivateChatStore.getState();
      privateStore.incrementUnreadCount(data.senderId);
      break;
      
    case 'new_group_message':
      const groupStore = useGroupStore.getState();
      groupStore.incrementUnreadCount(data.groupId);
      break;
      
    default:
      break;
  }
};