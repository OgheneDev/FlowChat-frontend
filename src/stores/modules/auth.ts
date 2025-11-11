import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { io, Socket } from "socket.io-client";

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

// Add new interfaces for password management
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
  // Add new loading states
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
  
  // Add new password management methods
  changePassword: (data: ChangePasswordData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdating: false,
  isDeleting: false,
  // Initialize new loading states
  isChangingPassword: false,
  isSendingResetEmail: false,
  isResettingPassword: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      console.log("Auth check:", response);
      set({ authUser: response.data });
      get().connectSocket();
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
      const response = await axiosInstance.delete("/auth/delete", { data });
      set({ authUser: null });
      get().disconnectSocket();
    } catch (error) {
      console.log("Error deleting account:", error);
    } finally {
      set({ isDeleting: false });
    }
  },

  // New password management methods
  changePassword: async (data: ChangePasswordData) => {
    set({ isChangingPassword: true });
    try {
      const response = await axiosInstance.put("/auth/change-password", data);
      // You might want to show a success message or handle post-change logic
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
      const response = await axiosInstance.post("/auth/forgot-password", data);
      // Success message is handled by the backend, but you might want to show a confirmation
      console.log("Reset email sent:", response.data);
    } catch (error: any) {
      // For security, we don't reveal if the email exists or not
      // But we still need to handle potential network errors
      const errorMessage = error?.response?.data?.message || "If the email exists, a reset link has been sent";
      // Don't throw an error here to prevent email enumeration
      console.log("Forgot password request completed");
    } finally {
      set({ isSendingResetEmail: false });
    }
  },

  resetPassword: async (data: ResetPasswordData) => {
    set({ isResettingPassword: true });
    try {
      const response = await axiosInstance.put(`/auth/reset-password/${data.resetToken}`, {
        password: data.password
      });
      console.log("Password reset successfully:", response.data);
      // You might want to automatically log the user in after successful reset
      // or redirect them to the login page
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

    const socket = io(BASE_URL, {
      withCredentials: true,
    });

    socket.connect();

    set({ socket });

    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
  },

  isUserOnline: (userId: string) => {
    const { authUser, onlineUsers } = get();
    // For current user, check socket connection
    if (authUser?._id === userId) {
      return get().socket?.connected || false;
    }
    // For other users, check onlineUsers array
    return onlineUsers.includes(userId);
  },

  isCurrentUserOnline: () => {
    return get().socket?.connected || false;
  },
}));