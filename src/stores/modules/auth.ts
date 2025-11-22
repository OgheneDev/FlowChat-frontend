import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { io, Socket } from "socket.io-client";
import { useNotificationStore } from "./notifications";
import { usePrivateChatStore } from "./privateChats";
import { useGroupStore } from "./groups";

const BASE_URL = "https://flowchat-81ni.onrender.com";

interface SignupData {
  email: string;
  fullName: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  profilePic?: string;
  about?: string;
}

interface DeletePasswordData {
  password: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  password: string;
  resetToken: string;
}

interface AuthUser {
  _id: string;
  email: string;
  fullName: string;
  profilePic?: string;
  about?: string;
  createdAt?: string | Date;
}

interface AuthStore {
  authUser: AuthUser | null;
  isCheckingAuth: boolean;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isChangingPassword: boolean;
  isSendingResetEmail: boolean;
  isResettingPassword: boolean;
  socket: Socket | null;
  onlineUsers: string[];
  isUserOnline: (userId: string) => boolean;
  isCurrentUserOnline: () => boolean;

  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<AuthUser>;
  login: (data: LoginData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  deleteAccount: (data: DeletePasswordData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  
  connectSocket: () => void;
  disconnectSocket: () => void;
  initializePushNotifications: () => Promise<void>;
  fetchInitialUnreadCounts: () => Promise<void>; // NEW
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdating: false,
  isDeleting: false,
  isChangingPassword: false,
  isSendingResetEmail: false,
  isResettingPassword: false,
  socket: null,
  onlineUsers: [],

  initializePushNotifications: async () => {
    try {
      const notificationStore = useNotificationStore.getState();
      await notificationStore.initializePushNotifications();
      console.log('Push notifications initialized');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  },

  // Fetch unread counts - now optional since chats/groups include them
  // Keep as fallback for socket reconnection scenarios
  fetchInitialUnreadCounts: async () => {
    try {
      // This is now mainly used as a fallback/refresh mechanism
      // Primary unread counts come with getChatPartners and getMyGroups
      const socket = get().socket;
      if (socket?.connected) {
        socket.emit("requestUnreadCounts");
      }
    } catch (error) {
      console.error("Failed to fetch initial unread counts:", error);
    }
  },

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      console.log("Auth check:", response);
      set({ authUser: response.data });
      get().connectSocket();
      
      if (response.data) {
        get().initializePushNotifications();
        // Unread counts will be fetched via socket on connect
        // or can be triggered from chat page after chats load
      }
    } catch (error) {
      console.log("Error in authentication check:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      set({ authUser: response.data });
      get().connectSocket();
      get().initializePushNotifications();
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Error creating account";
      throw new Error(errorMessage);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/auth/login", data);
      set({ authUser: response.data });
      get().connectSocket();
      get().initializePushNotifications();
      // NEW: Fetch unread counts after login
      get().fetchInitialUnreadCounts();
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Error logging in";
      throw new Error(errorMessage);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      const notificationStore = useNotificationStore.getState();
      if (notificationStore.fcmToken) {
        await notificationStore.removeDeviceToken(notificationStore.fcmToken);
      }
      
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      get().disconnectSocket();
    } catch (error) {
      console.log("Logout error:", error);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdating: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
    } catch (error) {
      console.log("Error in update profile:", error);
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteAccount: async (data) => {
    set({ isDeleting: true });
    try {
      const notificationStore = useNotificationStore.getState();
      if (notificationStore.fcmToken) {
        await notificationStore.removeDeviceToken(notificationStore.fcmToken);
      }
      
      await axiosInstance.delete("/auth/delete", { data });
      set({ authUser: null });
      get().disconnectSocket();
    } catch (error) {
      console.log("Error deleting account:", error);
    } finally {
      set({ isDeleting: false });
    }
  },

  changePassword: async (data: ChangePasswordData) => {
    set({ isChangingPassword: true });
    try {
      const response = await axiosInstance.put("/auth/change-password", data);
      console.log("Password changed successfully:", response.data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Error changing password";
      throw new Error(errorMessage);
    } finally {
      set({ isChangingPassword: false });
    }
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    set({ isSendingResetEmail: true });
    try {
      await axiosInstance.post("/auth/forgot-password", data);
    } catch (error: any) {
      console.log("Forgot password request completed");
    } finally {
      set({ isSendingResetEmail: false });
    }
  },

  resetPassword: async (data: ResetPasswordData) => {
    set({ isResettingPassword: true });
    try {
      await axiosInstance.put(`/auth/reset-password/${data.resetToken}`, {
        password: data.password
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Error resetting password";
      throw new Error(errorMessage);
    } finally {
      set({ isResettingPassword: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    console.log('🔌 [FRONTEND] Connecting socket for user:', authUser.fullName);

    const socket = io(BASE_URL, {
      withCredentials: true,
    });

    socket.connect();

    socket.on('connect', () => {
      console.log('✅ [FRONTEND] Socket connected successfully');
      // NEW: Request unread counts via socket as backup
      socket.emit("requestUnreadCounts");
    });

    set({ socket });

    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    // NEW: Listen for all unread counts response
    socket.on("allUnreadCounts", (counts: Record<string, { count: number; isGroup: boolean }>) => {
      console.log("📬 Received unread counts via socket:", counts);
      
      Object.entries(counts).forEach(([chatId, { count, isGroup }]) => {
        if (isGroup) {
          useGroupStore.setState((state) => ({
            unreadCounts: { ...state.unreadCounts, [chatId]: count },
            groups: state.groups.map(g => 
              g._id === chatId ? { ...g, unreadCount: count } : g
            )
          }));
        } else {
          usePrivateChatStore.setState((state) => ({
            unreadCounts: { ...state.unreadCounts, [chatId]: count },
            chats: state.chats.map(c => {
              const partnerId = c.participants?.find(
                p => p !== get().authUser?._id
              ) || c._id;
              return partnerId === chatId ? { ...c, unreadCount: count } : c;
            })
          }));
        }
      });
    });

    socket.on("deviceTokenRegistered", (data: { success: boolean }) => {
      if (data.success) {
        console.log("Device token registered successfully via socket");
      }
    });

    socket.on("deviceTokenRemoved", (data: { success: boolean }) => {
      if (data.success) {
        console.log("Device token removed successfully via socket");
      }
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
  },

  isUserOnline: (userId: string) => {
    const { authUser, onlineUsers } = get();
    if (authUser?._id === userId) {
      return get().socket?.connected || false;
    }
    return onlineUsers.includes(userId);
  },

  isCurrentUserOnline: () => {
    return get().socket?.connected || false;
  },
}));