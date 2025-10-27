import { create } from "zustand";
import { axiosInstance } from "@/api/axios";

interface PinningState {
  pinnedMessages: string[]; // These are now always chat-specific pinned messages
  isLoading: boolean;
  isPinning: string | null;
  messageDetails: Record<string, any>;

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

  // Load pinned messages for specific chat
  loadPinnedMessagesForChat: (payload: {
    chatPartnerId?: string;
    groupId?: string;
  }) => Promise<string[]>;
  
  // Combined toggle function
  togglePinMessage: (payload: {
    messageId: string;
    chatPartnerId?: string;
    groupId?: string;
  }) => Promise<void>;
  
  // Check if a message is pinned
  isMessagePinned: (messageId: string) => boolean;

  fetchMessageDetails: (messageId: string) => Promise<void>;
  fetchMultipleMessageDetails: (messageIds: string[]) => Promise<void>;
}

export const usePinningStore = create<PinningState>((set, get) => ({
  pinnedMessages: [],
  isLoading: false,
  isPinning: null,
  messageDetails: {},

  // Load pinned messages for specific chat - this is the main method now
  loadPinnedMessagesForChat: async (payload) => {
    const { chatPartnerId, groupId } = payload;
    
    if (!chatPartnerId && !groupId) {
      throw new Error("Either chatPartnerId or groupId is required");
    }

    set({ isLoading: true });
    
    try {
      const params = new URLSearchParams();
      if (chatPartnerId) params.append('chatPartnerId', chatPartnerId);
      if (groupId) params.append('groupId', groupId);
      
      const response = await axiosInstance.get(`/chats/pinned-data?${params}`);
      const pinnedMessageIds = response.data.pinnedMessages;
      
      console.log(`📌 Loaded ${pinnedMessageIds.length} pinned messages for chat:`, 
        chatPartnerId || groupId);
      
      set({ pinnedMessages: pinnedMessageIds });
      return pinnedMessageIds;
    } catch (error: any) {
      console.error("Failed to load pinned messages for chat:", error);
      throw new Error(error?.response?.data?.message || "Failed to load pinned messages");
    } finally {
      set({ isLoading: false });
    }
  },

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
      
      // After successful pin, reload the chat-specific pinned messages
      const { loadPinnedMessagesForChat } = get();
      await loadPinnedMessagesForChat({ chatPartnerId, groupId });
      
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
      
      // After successful unpin, reload the chat-specific pinned messages
      const { loadPinnedMessagesForChat } = get();
      await loadPinnedMessagesForChat({ chatPartnerId, groupId });
      
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

  isMessagePinned: (messageId: string) => {
    return get().pinnedMessages.includes(messageId);
  },

  fetchMessageDetails: async (messageId: any) => {
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