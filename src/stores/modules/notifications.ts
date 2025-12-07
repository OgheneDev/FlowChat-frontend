import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { messaging } from "@/config/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { usePrivateChatStore } from "./privateChats";
import { useGroupStore } from "./groups";
import { useAuthStore } from "./auth";
import { useUIStore } from "./ui";

interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  fcmToken: string | null;
  isInitialized: boolean;
  processedMessageIds: Set<string>;

  initializePushNotifications: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  getFCMToken: () => Promise<string | null>;
  registerDeviceToken: (token: string, deviceType?: string) => Promise<void>;
  removeDeviceToken: (token: string) => Promise<void>;
  setupForegroundHandler: () => void;
}

// Safe helper to check if Notifications API is available
const isNotificationsSupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    typeof Notification !== "undefined"
  );
};

// Safe helper to get notification permission
const getNotificationPermission = (): NotificationPermission => {
  if (isNotificationsSupported()) {
    return Notification.permission;
  }
  return "default";
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  isSupported: isNotificationsSupported(),
  permission: getNotificationPermission(),
  fcmToken: null,
  isInitialized: false,
  processedMessageIds: new Set(),

  initializePushNotifications: async () => {
    console.log("🔄 [FRONTEND] Starting push notification setup...");

    // Prevent multiple initializations
    if (get().isInitialized) {
      console.log("⚠️ [FRONTEND] Already initialized, skipping");
      return;
    }

    // SET THIS IMMEDIATELY to prevent race conditions
    set({ isInitialized: true });

    // Only run on client side
    if (typeof window === "undefined") {
      console.log("🔄 [FRONTEND] Skipping - running on server");
      return;
    }

    const { isSupported } = get();

    if (!isSupported) {
      console.log(
        "❌ [FRONTEND] Push notifications not supported in this browser (likely iOS Safari)"
      );
      return;
    }

    try {
      console.log("🔄 [FRONTEND] Requesting notification permission...");
      const hasPermission = await get().requestNotificationPermission();
      console.log("🔄 [FRONTEND] Permission result:", hasPermission);

      if (hasPermission && messaging) {
        console.log("🔄 [FRONTEND] Getting FCM token...");
        const token = await get().getFCMToken();
        console.log("🔄 [FRONTEND] FCM token received:", token ? "yes" : "no");

        if (token) {
          console.log("🔄 [FRONTEND] Registering token with backend...");
          await get().registerDeviceToken(token, "web");
          console.log("🔄 [FRONTEND] Token registration completed");
          console.log(
            "🔄 [FRONTEND] Setting up foreground handler (ONE TIME)..."
          );
          get().setupForegroundHandler();
        } else {
          console.log("❌ [FRONTEND] No FCM token received");
        }
      } else {
        console.log("❌ [FRONTEND] No permission or messaging not available");
      }

      set({ isInitialized: true });
      console.log("✅ [FRONTEND] Push notification setup completed");
    } catch (error) {
      console.error("💥 [FRONTEND] Push notification setup error:", error);
      set({ isInitialized: true });
      // Don't throw - this is non-critical
    }
  },

  requestNotificationPermission: async (): Promise<boolean> => {
    if (!isNotificationsSupported()) {
      console.log("❌ [FRONTEND] Notification API not available");
      return false;
    }

    try {
      console.log("🔄 [FRONTEND] Calling Notification.requestPermission()...");
      const permission = await Notification.requestPermission();
      set({ permission });
      console.log("🔄 [FRONTEND] Permission result:", permission);

      if (permission === "granted") {
        console.log("✅ [FRONTEND] Notification permission granted.");
        return true;
      } else {
        console.log("❌ [FRONTEND] Unable to get permission to notify.");
        return false;
      }
    } catch (error) {
      console.error(
        "💥 [FRONTEND] Error requesting notification permission:",
        error
      );
      return false;
    }
  },

  getFCMToken: async (): Promise<string | null> => {
    if (!messaging || typeof window === "undefined") {
      console.log("❌ [FRONTEND] Messaging not available or running on server");
      return null;
    }

    try {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        console.error("❌ [FRONTEND] VAPID key not found");
        return null;
      }

      console.log("🔄 [FRONTEND] Calling getToken() with VAPID key...");
      const token = await getToken(messaging, { vapidKey });

      if (token) {
        set({ fcmToken: token });
        console.log("✅ [FRONTEND] FCM token received");
        return token;
      } else {
        console.log("❌ [FRONTEND] No registration token available.");
        return null;
      }
    } catch (error) {
      console.error("💥 [FRONTEND] Error getting FCM token:", error);
      return null;
    }
  },

  registerDeviceToken: async (token: string, deviceType: string = "web") => {
    try {
      console.log("🔄 [FRONTEND] Starting device token registration...");
      const socket = useAuthStore.getState().socket;
      console.log("🔄 [FRONTEND] Socket available:", !!socket);
      console.log("🔄 [FRONTEND] Socket connected:", socket?.connected);

      if (socket && socket.connected) {
        console.log("📡 [FRONTEND] Sending token via socket...");
        socket.emit("registerDeviceToken", { token, deviceType });
        console.log("✅ [FRONTEND] Device token registered via socket");
      } else {
        console.log("🌐 [FRONTEND] Socket not connected, using HTTP...");
        await axiosInstance.post("/notifications/register-token", {
          token,
          deviceType,
        });
        console.log("✅ [FRONTEND] Device token registered via HTTP");
      }
    } catch (error) {
      console.error("💥 [FRONTEND] Error registering device token:", error);
      // Don't throw - this is non-critical
    }
  },

  removeDeviceToken: async (token: string) => {
    try {
      const socket = useAuthStore.getState().socket;

      if (socket) {
        socket.emit("removeDeviceToken", { token });
      } else {
        await axiosInstance.post("/notifications/remove-token", { token });
      }
      console.log("✅ Device token removed");
    } catch (error) {
      console.error("❌ Error removing device token:", error);
      // Don't throw - this is non-critical
    }
  },

  setupForegroundHandler: () => {
    if (!messaging || typeof window === "undefined") {
      console.log(
        "⚠️ [FRONTEND] Cannot setup foreground handler - messaging not available"
      );
      return;
    }

    console.log("🔔 [FRONTEND] Setting up foreground message handler");

    try {
      // IMPORTANT: onMessage only fires when app is in FOREGROUND
      // The service worker handles notifications when app is in BACKGROUND
      // We only need to update the UI state here, NO manual notifications
      onMessage(messaging, (payload) => {
        console.log("🔔 [FRONTEND] ===== FOREGROUND MESSAGE RECEIVED =====");
        console.log("🔔 [FRONTEND] Payload:", JSON.stringify(payload, null, 2));
        console.log("🔔 [FRONTEND] Timestamp:", new Date().toISOString());

        const messageId = payload.data?.messageId;
        console.log("🔔 [FRONTEND] Message ID:", messageId);

        // DEDUPLICATION: Check if we've already processed this message
        if (messageId) {
          const { processedMessageIds } = get();
          console.log(
            "🔔 [FRONTEND] Already processed IDs:",
            Array.from(processedMessageIds)
          );

          if (processedMessageIds.has(messageId)) {
            console.log(
              "🔔 [FRONTEND] ❌ DUPLICATE DETECTED - Message already processed, skipping:",
              messageId
            );
            return;
          }

          console.log("🔔 [FRONTEND] ✅ New message, marking as processed");
          // Mark as processed
          set((state) => ({
            processedMessageIds: new Set([
              ...state.processedMessageIds,
              messageId,
            ]),
          }));

          // Clean up old message IDs (keep only last 100)
          setTimeout(() => {
            set((state) => {
              const ids = Array.from(state.processedMessageIds);
              if (ids.length > 100) {
                const newSet = new Set(ids.slice(-100));
                return { processedMessageIds: newSet };
              }
              return state;
            });
          }, 0);
        } else {
          console.log("🔔 [FRONTEND] ⚠️ No message ID in payload!");
        }

        // Check if user is currently in the chat with the sender
        const senderId = payload.data?.senderId;
        const { selectedUser } = useUIStore.getState();

        console.log("🔔 [FRONTEND] Sender ID:", senderId);
        console.log("🔔 [FRONTEND] Selected User:", selectedUser);

        // Update UI state based on notification type
        handleNotificationPayload(payload);

        // Only show notification if user is NOT viewing this chat
        // Otherwise it's distracting when they're already looking at it
        if (senderId && selectedUser === senderId) {
          console.log(
            "🔔 [FRONTEND] User is viewing this chat, skipping notification (UI already updated)"
          );
          return;
        }

        // Show notification ONLY if payload has notification data
        // AND user is not in the chat
        if (payload.notification) {
          const { title, body } = payload.notification;

          console.log(
            "🔔 [FRONTEND] 📢 Showing notification via Service Worker"
          );
          console.log("🔔 [FRONTEND] Title:", title);
          console.log("🔔 [FRONTEND] Body:", body);

          // Let the Service Worker handle the notification
          // We don't create it manually here to avoid duplicates
          // The Service Worker will automatically show it
        }

        console.log("🔔 [FRONTEND] ===== END FOREGROUND MESSAGE =====");
      });

      // Listen for service worker messages (notification clicks)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          console.log("🔔 [FRONTEND] Service worker message:", event.data);

          if (event.data && event.data.type === "NOTIFICATION_CLICKED") {
            // Handle navigation based on notification data
            const { data } = event.data;

            if (data.type === "new_message" && data.senderId) {
              // Navigate to chat (you'll need to implement this based on your routing)
              window.location.href = `/chat/${data.senderId}`;
            } else if (data.type === "new_group_message" && data.groupId) {
              window.location.href = `/group/${data.groupId}`;
            }
          }
        });
      }
    } catch (error) {
      console.error(
        "💥 [FRONTEND] Error setting up foreground handler:",
        error
      );
      // Don't throw - this is non-critical
    }
  },
}));

// Handle notification payload and update UI
const handleNotificationPayload = (payload: any) => {
  const { data } = payload;

  if (!data) return;

  try {
    switch (data.type) {
      case "new_message":
        const privateStore = usePrivateChatStore.getState();
        console.log(
          "🔔 [FRONTEND] Incrementing unread count for:",
          data.senderId
        );
        privateStore.incrementUnreadCount(data.senderId);
        break;

      case "new_group_message":
        const groupStore = useGroupStore.getState();
        console.log(
          "🔔 [FRONTEND] Incrementing unread count for group:",
          data.groupId
        );
        groupStore.incrementUnreadCount(data.groupId);
        break;

      default:
        console.log("🔔 [FRONTEND] Unknown notification type:", data.type);
        break;
    }
  } catch (error) {
    console.error("💥 [FRONTEND] Error handling notification payload:", error);
    // Don't throw - this is non-critical
  }
};
