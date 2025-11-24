import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { useToastStore } from "./toast";

interface StarringState {
  // Sidebar starred data (lightweight - for sidebar display)
  starredMessages: string[]; // message IDs only
  starredChats: string[];
  sidebarLoading: boolean;
  isStarring: string | null;

  // Modal starred data (full message objects)
  starredMessageItems: any[];
  modalLoading: boolean;
  modalError: string | null;

  // Actions
  toggleStarMessage: (messageId: string) => Promise<void>;
  toggleStarChat: (payload: { chatPartnerId?: string; groupId?: string }) => Promise<void>;
  loadSidebarStarredData: () => Promise<void>;
  loadStarredMessagesForModal: () => Promise<void>;
  clearModalData: () => void;
}

export const useStarringStore = create<StarringState>((set, get) => ({
  // Initial state
  starredMessages: [],
  starredMessageItems: [],
  starredChats: [],
  sidebarLoading: false,
  modalLoading: false,
  modalError: null,
  isStarring: null,

  toggleStarMessage: async (messageId: string) => {
    const wasStarred = get().starredMessages.includes(messageId);
    const { showToast } = useToastStore.getState();

    // Optimistic update for sidebar
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
    if (!chatPartnerId && !groupId) {
      useToastStore.getState().showToast("Chat partner or group ID is required", "error");
      throw new Error("chatPartnerId or groupId is required");
    } 

    const idToToggle = chatPartnerId ?? groupId!;
    const wasStarred = get().starredChats.includes(idToToggle);
    const { showToast } = useToastStore.getState();

    set({ isStarring: idToToggle });

    // Optimistic update for sidebar
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

  loadSidebarStarredData: async () => {
    set({ sidebarLoading: true });
    try {
      const response = await axiosInstance.get("/chats/starred-data");
      const { starredMessages: starredIdsFromApi, starredChats } = response.data || {};
      
      set({ 
        starredMessages: starredIdsFromApi || [],
        starredChats: starredChats || [],
        sidebarLoading: false 
      });
    } catch (error) {
      console.error("Failed to load sidebar starred data:", error);
      set({ sidebarLoading: false });
    }
  },

  loadStarredMessagesForModal: async () => {
    set({ 
      modalLoading: true,
      modalError: null 
    });
    
    try {
      // First get the starred message IDs
      const response = await axiosInstance.get("/chats/starred-data");
      const { starredMessages: starredIdsFromApi } = response.data || {};
      
      let starredItems = [];
      
      if (starredIdsFromApi && starredIdsFromApi.length > 0) {
        // Fetch full message details for the modal
        const detailsResponse = await axiosInstance.post("/chats/messages/details", {
          messageIds: starredIdsFromApi
        });
        starredItems = detailsResponse.data?.messages || [];
        console.log("Loaded starred messages for modal:", starredItems);
      }

      set({ 
        starredMessageItems: starredItems,
        modalLoading: false 
      });
    } catch (error: any) {
      console.error("Failed to load starred messages for modal:", error);
      set({ 
        modalLoading: false,
        modalError: error?.response?.data?.message || "Failed to load starred messages" 
      });
    }
  },

  clearModalData: () => {
    set({
      starredMessageItems: [],
      modalError: null
    });
  }
}));