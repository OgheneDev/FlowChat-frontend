import { create } from "zustand";
import { axiosInstance } from "@/api/axios";

interface signupData {
    email: string,
    fullName: string,
    password: string,
}

interface loginData {
    email: string,
    password: string
}

interface updateProfileData {
    profileImg: string
}


export const useAuthStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdating: false,

    checkAuth: async () => {
        try {
            const response = await axiosInstance.get("/auth/check");
            console.log("Auth check:", response)
            set({ authUser: response.data }); 
        } catch (error) {
            console.log("Error in authentication check:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data: signupData) => {
        set({isSigningUp: true});
        try {
            const response = await axiosInstance.post("/auth/signup", data);
            set({authUser: response.data});
            return response.data;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Error creating account";
            throw new Error(errorMessage);
        } finally {
            set({isSigningUp: false});
        }
    },

    login: async (data: loginData) => {
        set({isLoggingIn: true});
        try {
            const response = await axiosInstance.post("/auth/login", data);
            set({authUser: response.data});
            return response.data
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Error logging in";
            throw new Error(errorMessage);
        } finally {
            set({isLoggingIn: false});
        }
    },

    logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
    } catch (error) {
      console.log("Logout error:", error);
    }
    },

    updateProfile: async (data: updateProfileData) => {
        set({isUpdating: true})
        try {
         const res = await axiosInstance.put("/auth/update-profile", data);
         set({ authUser: res.data });
        } catch (error) {
          console.log("Error in update profile:", error);
        } finally {
          set({isUpdating: false})
       }
    },

}));