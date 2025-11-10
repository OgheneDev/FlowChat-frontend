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

interface AuthUser {
  _id: string;
  email: string;
  fullName: string;
  profilePic?: string;
  about?: string
  createdAt?: string | Date;
}

interface AuthStore {
  authUser: AuthUser | null;
  isCheckingAuth: boolean;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
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
    set({isDeleting: true});
    try {
      const response = await axiosInstance.delete("/auth/delete", {data});
      set({ authUser: null });
      get().disconnectSocket();
    } catch (error) {
      console.log("Error deleting account:", error)
    } finally {
      set({ isDeleting: false })
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
