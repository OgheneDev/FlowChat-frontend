// src/store/modules/pinning.ts
import { create } from "zustand";
import { axiosInstance } from "@/api/axios";

interface PinningState {
  pinMessage: (payload: {
    messageId: string;
    chatPartnerId?: string;
    groupId?: string;
  }) => Promise<string[]>;
  unpinMessage: (payload: {
    messageId: string;
    chatPartnerId?: string;
    groupId?: string;
  }) => Promise<void>;
}

export const usePinningStore = create<PinningState>((set, get) => ({
  pinMessage: async (payload) => {
    const { messageId, chatPartnerId, groupId } = payload;

    if (!chatPartnerId && !groupId) {
      throw new Error("chatPartnerId or groupId is required");
    }

    try {
      const { data } = await axiosInstance.post("/chats/pin", payload);
      return data.pinnedMessages; // returns updated array
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Failed to pin message");
    }
  },

  unpinMessage: async (payload) => {
    const { messageId, chatPartnerId, groupId } = payload;

    if (!chatPartnerId && !groupId) {
      throw new Error("chatPartnerId or groupId is required");
    }

    try {
      await axiosInstance.post("/chats/unpin", payload);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Failed to unpin message");
    }
  },
}));