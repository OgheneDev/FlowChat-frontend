// src/store/modules/starring.ts
import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { useToastStore } from "./toast";

interface StarringState {
  starredMessages: string[];
  starredChats: string[];
  isLoading: boolean;
  isStarring: string | null; // Track which chat is being starred

  toggleStarMessage: (messageId: string) => Promise<void>;
  toggleStarChat: (payload: { chatPartnerId?: string; groupId?: string }) => Promise<void>;
  loadStarredData: () => Promise<void>;
}

export const useStarringStore = create<StarringState>((set, get) => ({
  starredMessages: [],
  starredChats: [],
  isLoading: false,
  isStarring: null,

  toggleStarMessage: async (messageId: string) => {
    const wasStarred = get().starredMessages.includes(messageId);
    const { showToast } = useToastStore.getState();

    // Optimistic update
    set((state) => ({
      starredMessages: wasStarred
        ? state.starredMessages.filter((id) => id !== messageId)
        : [...state.starredMessages, messageId],
    }));

    try {
      await axiosInstance.post("/chats/star-message", { messageId });
      showToast(wasStarred ? "Message unstarred" : "Message starred");
    } catch (error: any) {
      // Revert
      set((state) => ({
        starredMessages: wasStarred
          ? [...state.starredMessages, messageId]
          : state.starredMessages.filter((id) => id !== messageId),
      }));
      showToast(error?.response?.data?.message || "Failed to star/unstar message", "error");
    }
  },

  toggleStarChat: async (payload: { chatPartnerId?: string; groupId?: string }) => {
    const { chatPartnerId, groupId } = payload;
     console.log("Frontend - toggleStarChat called with:", payload);
    if (!chatPartnerId && !groupId) {
      useToastStore.getState().showToast("Chat partner or group ID is required", "error");
      throw new Error("chatPartnerId or groupId is required");
    }

    const idToToggle = chatPartnerId ?? groupId!;
    const wasStarred = get().starredChats.includes(idToToggle);
    const { showToast } = useToastStore.getState();

    // Set loading state for this specific chat
    set({ isStarring: idToToggle });

    // Optimistic update
    set((state) => ({
      starredChats: wasStarred
        ? state.starredChats.filter((id) => id !== idToToggle)
        : [...state.starredChats, idToToggle],
    }));

    try {
      await axiosInstance.post("/chats/star-chat", payload);
      showToast(wasStarred ? "Chat unstarred" : "Chat starred");
    } catch (error: any) {
      // Revert
      set((state) => ({
        starredChats: wasStarred
          ? [...state.starredChats, idToToggle]
          : state.starredChats.filter((id) => id !== idToToggle),
      }));
      showToast(error?.response?.data?.message || "Failed to star/unstar chat", "error");
    } finally {
      set({ isStarring: null });
    }
  },

  loadStarredData: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/chats/starred-data");
      console.log("Starred Chats:", response)
      const { starredMessages, starredChats } = response.data;
      
      set({ 
        starredMessages: starredMessages || [],
        starredChats: starredChats || [],
        isLoading: false 
      });
    } catch (error) {
      console.error("Failed to load starred data:", error);
      useToastStore.getState().showToast("Failed to load starred chats", "error");
      set({ isLoading: false });
    }
  },
}));