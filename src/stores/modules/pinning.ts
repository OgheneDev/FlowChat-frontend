import { create } from "zustand";
import { axiosInstance } from "@/api/axios";

interface PinningState {
  pinnedMessages: string[];
  isLoading: boolean;
  isPinning: string | null; // Track which message is being pinned/unpinned

  // Message pinning
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
  
  // Combined toggle function (optional - for consistency with starring)
  togglePinMessage: (payload: {
    messageId: string;
    chatPartnerId?: string;
    groupId?: string;
  }) => Promise<void>;
  
  // Load pinned messages
  loadPinnedData: () => Promise<void>;
  
  // Check if a message is pinned
  isMessagePinned: (messageId: string) => boolean;

  messageDetails: Record<string, any>; // messageId -> message data
  fetchMessageDetails: (messageId: string) => Promise<void>;
  fetchMultipleMessageDetails: (messageIds: string[]) => Promise<void>;

}

export const usePinningStore = create<PinningState>((set, get) => ({
  pinnedMessages: [],
  isLoading: false,
  isPinning: null,
  messageDetails: {},

  pinMessage: async (payload) => {
    const { messageId, chatPartnerId, groupId } = payload;

    if (!chatPartnerId && !groupId) {
      throw new Error("chatPartnerId or groupId is required");
    }

    // Optimistic update
    set((state) => ({
      pinnedMessages: [...state.pinnedMessages, messageId],
      isPinning: messageId
    }));

    try {
      const { data } = await axiosInstance.post("/chats/pin", payload);
      
      // Update with server response
      set({ pinnedMessages: data.pinnedMessages });
      
      return data.pinnedMessages;
    } catch (error: any) {
      // Revert optimistic update
      set((state) => ({
        pinnedMessages: state.pinnedMessages.filter(id => id !== messageId)
      }));
      throw new Error(error?.response?.data?.message || "Failed to pin message");
    } finally {
      set({ isPinning: null });
    }
  },

  unpinMessage: async (payload) => {
    const { messageId, chatPartnerId, groupId } = payload;

    if (!chatPartnerId && !groupId) {
      throw new Error("chatPartnerId or groupId is required");
    }

    // Optimistic update
    set((state) => ({
      pinnedMessages: state.pinnedMessages.filter(id => id !== messageId),
      isPinning: messageId
    }));

    try {
      await axiosInstance.post("/chats/unpin", payload);
    } catch (error: any) {
      // Revert optimistic update
      set((state) => ({
        pinnedMessages: [...state.pinnedMessages, messageId]
      }));
      throw new Error(error?.response?.data?.message || "Failed to unpin message");
    } finally {
      set({ isPinning: null });
    }
  },

  togglePinMessage: async (payload) => {
    const { messageId } = payload;
    const { pinnedMessages, pinMessage, unpinMessage } = get();
    
    const isPinned = pinnedMessages.includes(messageId);
    
    if (isPinned) {
      await unpinMessage(payload);
    } else {
      await pinMessage(payload);
    }
  },

loadPinnedData: async () => {
  set({ isLoading: true });
  try {
    const response = await axiosInstance.get("/chats/pinned-data");
    const { pinnedMessages } = response.data;
    
    console.log("📌 Raw pinnedMessages from API:", pinnedMessages);
    
    let pinnedMessageIds: string[] = [];
    
    if (pinnedMessages && Array.isArray(pinnedMessages)) {
      pinnedMessageIds = pinnedMessages.map((item: any) => {
        // If it's already a string ID, use it
        if (typeof item === 'string') {
          return item;
        }
        // If it's a full message object, extract the _id
        else if (item && item._id) {
          return item._id.toString();
        }
        // If it's an ObjectId, convert to string
        else if (item && item.toString && typeof item.toString === 'function') {
          return item.toString();
        }
        // Skip invalid items
        else {
          console.error("❌ Invalid pinned message item:", item);
          return null;
        }
      }).filter(Boolean); // Remove null values
    }
    
    console.log("📌 Extracted pinned message IDs:", pinnedMessageIds);
    
    set({ 
      pinnedMessages: pinnedMessageIds,
      isLoading: false 
    });
  } catch (error) {
    console.error("Failed to load pinned data:", error);
    set({ isLoading: false });
    throw error;
  }
},

  isMessagePinned: (messageId: string) => {
    return get().pinnedMessages.includes(messageId);
  },

  fetchMessageDetails: async (messageId: any) => {
  // Convert to string if it's an object
  const actualMessageId = typeof messageId === 'string' ? messageId : messageId._id || messageId.toString();
  
  console.log("🔍 fetchMessageDetails called with:", messageId);
  console.log("🔍 Converted to:", actualMessageId);
  
  try {
    const response = await axiosInstance.get(`/chats/message/${actualMessageId}`);
    const messageData = response.data.message;
    
    set((state) => ({
      messageDetails: {
        ...state.messageDetails,
        [actualMessageId]: messageData
      }
    }));
  } catch (error) {
    console.error("Failed to fetch message details:", error);
    throw error;
  }
},

fetchMultipleMessageDetails: async (messageIds: any[]) => {
  try {
    console.log("🔍 fetchMultipleMessageDetails called with:", messageIds);
    
    // Extract IDs from objects if needed
    const actualMessageIds = messageIds.map(item => {
      if (typeof item === 'string') {
        return item;
      } else if (item && item._id) {
        return item._id.toString();
      } else if (item && typeof item.toString === 'function') {
        return item.toString();
      } else {
        console.error("❌ Cannot extract ID from:", item);
        return null;
      }
    }).filter(Boolean);
    
    console.log("🔍 Extracted message IDs for batch fetch:", actualMessageIds);
    
    if (actualMessageIds.length === 0) {
      console.warn("No valid message IDs to fetch");
      return;
    }
    
    const response = await axiosInstance.post('/chats/messages/details', { 
      messageIds: actualMessageIds 
    });
    const messagesData = response.data.messages;
    
    set((state) => {
      const newMessageDetails = { ...state.messageDetails };
      messagesData.forEach((message: any) => {
        if (message && message._id) {
          newMessageDetails[message._id] = message;
        }
      });
      return { messageDetails: newMessageDetails };
    });
  } catch (error) {
    console.error("Failed to fetch multiple message details:", error);
    throw error;
  }
},
}));