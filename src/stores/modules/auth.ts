import { create } from "zustand";
import { axiosInstance, tokenStorage } from "@/api/axios";
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
  fetchInitialUnreadCounts: () => Promise<void>;
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
      console.log('🔔 Initializing push notifications...');
      const notificationStore = useNotificationStore.getState();
      await notificationStore.initializePushNotifications();
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      // Don't throw - push notifications are not critical
    }
  },

  fetchInitialUnreadCounts: async () => {
    try {
      const socket = get().socket;
      if (socket?.connected) {
        console.log('📬 Requesting unread counts via socket...');
        socket.emit("requestUnreadCounts");
      }
    } catch (error) {
      console.error("❌ Failed to fetch initial unread counts:", error);
      // Don't throw - this is a non-critical operation
    }
  },

  checkAuth: async () => {
    try {
      console.log('🔐 Checking authentication...');
      const response = await axiosInstance.get("/auth/check");
      console.log("✅ Auth check successful:", response.data?.email);
      
      // Store token if returned (for iOS Safari)
      if (response.data?.token) {
        tokenStorage.set(response.data.token);
      }
      
      set({ authUser: response.data });
      
      // Connect socket after setting auth user
      if (response.data) {
        get().connectSocket();
      }
    } catch (error) {
      console.log("❌ Auth check failed:", error);
      tokenStorage.remove();
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      console.log('📝 Signing up...');
      const response = await axiosInstance.post("/auth/signup", data);
      
      // Token is automatically stored by axios interceptor
      set({ authUser: response.data });
      
      // Connect socket and initialize notifications
      get().connectSocket();
      
      // Initialize push notifications in background (non-blocking)
      get().initializePushNotifications().catch(console.error);
      
      console.log('✅ Signup successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Signup failed:', error);
      const errorMessage = error?.response?.data?.message || "Error creating account";
      throw new Error(errorMessage);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log('🔑 Logging in...');
      const response = await axiosInstance.post("/auth/login", data);
      
      // Token is automatically stored by axios interceptor
      set({ authUser: response.data });
      
      // Connect socket
      get().connectSocket();
      
      // Initialize push notifications in background (non-blocking)
      get().initializePushNotifications().catch(console.error);
      
      // Fetch unread counts in background (non-blocking)
      setTimeout(() => {
        get().fetchInitialUnreadCounts();
      }, 1000);
      
      console.log('✅ Login successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      const errorMessage = error?.response?.data?.message || "Error logging in";
      throw new Error(errorMessage);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      console.log('👋 Logging out...');
      
      // Remove device token if exists
      const notificationStore = useNotificationStore.getState();
      if (notificationStore.fcmToken) {
        try {
          await notificationStore.removeDeviceToken(notificationStore.fcmToken);
        } catch (error) {
          console.error('Failed to remove device token:', error);
          // Continue with logout even if token removal fails
        }
      }
      
      await axiosInstance.post("/auth/logout");
      
      // Clear token and auth state
      tokenStorage.remove();
      set({ authUser: null });
      get().disconnectSocket();
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Force logout on client even if server request fails
      tokenStorage.remove();
      set({ authUser: null });
      get().disconnectSocket();
    }
  },

  updateProfile: async (data) => {
    set({ isUpdating: true });
    try {
      console.log('📝 Updating profile...');
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      console.log('✅ Profile updated');
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteAccount: async (data) => {
    set({ isDeleting: true });
    try {
      console.log('🗑️ Deleting account...');
      
      const notificationStore = useNotificationStore.getState();
      if (notificationStore.fcmToken) {
        try {
          await notificationStore.removeDeviceToken(notificationStore.fcmToken);
        } catch (error) {
          console.error('Failed to remove device token:', error);
        }
      }
      
      await axiosInstance.delete("/auth/delete", { data });
      
      // Clear token and auth state
      tokenStorage.remove();
      set({ authUser: null });
      get().disconnectSocket();
      
      console.log('✅ Account deleted');
    } catch (error) {
      console.error("❌ Error deleting account:", error);
      throw error;
    } finally {
      set({ isDeleting: false });
    }
  },

  changePassword: async (data: ChangePasswordData) => {
    set({ isChangingPassword: true });
    try {
      console.log('🔒 Changing password...');
      const response = await axiosInstance.put("/auth/change-password", data);
      console.log("✅ Password changed successfully");
    } catch (error: any) {
      console.error("❌ Error changing password:", error);
      const errorMessage = error?.response?.data?.message || "Error changing password";
      throw new Error(errorMessage);
    } finally {
      set({ isChangingPassword: false });
    }
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    set({ isSendingResetEmail: true });
    try {
      console.log('📧 Sending password reset email...');
      await axiosInstance.post("/auth/forgot-password", data);
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error("❌ Error sending reset email:", error);
      // Don't throw - forgot password should complete silently
    } finally {
      set({ isSendingResetEmail: false });
    }
  },

  resetPassword: async (data: ResetPasswordData) => {
    set({ isResettingPassword: true });
    try {
      console.log('🔄 Resetting password...');
      await axiosInstance.put(`/auth/reset-password/${data.resetToken}`, {
        password: data.password
      });
      console.log('✅ Password reset successful');
    } catch (error: any) {
      console.error("❌ Error resetting password:", error);
      const errorMessage = error?.response?.data?.message || "Error resetting password";
      throw new Error(errorMessage);
    } finally {
      set({ isResettingPassword: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    
    // Don't connect if no auth user or already connected
    if (!authUser || socket?.connected) {
      console.log('⚠️ Socket connection skipped:', !authUser ? 'No auth user' : 'Already connected');
      return;
    }

    console.log('🔌 Connecting socket for user:', authUser.fullName);

    try {
      const newSocket = io(BASE_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        auth: {
          // Send token with socket for iOS Safari
          token: tokenStorage.get()
        }
      });

      newSocket.connect();

      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        // Request unread counts after connection
        newSocket.emit("requestUnreadCounts");
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      set({ socket: newSocket });

      // Set up event listeners
      newSocket.on("getOnlineUsers", (userIds: string[]) => {
        console.log('👥 Online users updated:', userIds.length);
        set({ onlineUsers: userIds });
      });

      newSocket.on("allUnreadCounts", (counts: Record<string, { count: number; isGroup: boolean }>) => {
        console.log("📬 Received unread counts via socket:", Object.keys(counts).length, 'chats');
        
        try {
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
        } catch (error) {
          console.error('❌ Error processing unread counts:', error);
        }
      });

      newSocket.on("deviceTokenRegistered", (data: { success: boolean }) => {
        if (data.success) {
          console.log("✅ Device token registered successfully via socket");
        }
      });

      newSocket.on("deviceTokenRemoved", (data: { success: boolean }) => {
        if (data.success) {
          console.log("✅ Device token removed successfully via socket");
        }
      });
    } catch (error) {
      console.error('❌ Error setting up socket:', error);
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      console.log('🔌 Disconnecting socket...');
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },

  isUserOnline: (userId: string) => {
    const { authUser, onlineUsers, socket } = get();
    if (authUser?._id === userId) {
      return socket?.connected || false;
    }
    return onlineUsers.includes(userId);
  },

  isCurrentUserOnline: () => {
    return get().socket?.connected || false;
  },
}));