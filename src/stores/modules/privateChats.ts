import { axiosInstance } from "@/api/axios";
import { sendMessageData, Message, DeleteMessageData, EditMessageData, ChatWithPinned } from "@/types/types";
import { create } from "zustand";
import { useAuthStore } from "./auth";
import { useUIStore } from "./ui";
import { createPrivateSocketHandlers } from "./privateChats/socketHandlers";
import { normalizeSelectedUserId } from "./privateChats/utils";

interface PrivateChatState {
  chats: ChatWithPinned[];
  privateMessages: Message[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;
  unreadCounts: Record<string, number>;

  // Core chat methods
  getChatPartners: () => Promise<ChatWithPinned[]>;
  getPrivateMessages: (id: string) => Promise<Message[]>;
  sendPrivateMessage: (id: string, data: sendMessageData) => Promise<Message>;
  deleteMessage: (data: DeleteMessageData) => Promise<void>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<Message>;
  addIncomingMessage: (msg: Message) => void;
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;
  markMessagesAsSeen: (chatPartnerId: string) => Promise<void>;
  getUnreadCount: (chatPartnerId: string) => number;
  incrementUnreadCount: (chatPartnerId: string) => void;
  clearUnreadCount: (chatPartnerId: string) => void;
  calculateUnreadCount: (chatPartnerId: string) => number;
  setUnreadCount: (chatPartnerId: string, count: number) => void;

  // Socket methods
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  updateRecentChat: (data: {
    partnerId: string;
    lastMessage: Message;
  }) => void;
}

export const usePrivateChatStore = create<PrivateChatState>((set, get) => {
  // create attach/detach using get/set
  const { attach, detach } = createPrivateSocketHandlers(get, set);

  // expose helper for internal use (used by utils via bump helper signature if needed)
  const getCurrentUserId = () => useAuthStore.getState().authUser?._id;

  return ({
    chats: [],
    privateMessages: [],
    isLoading: false,
    isMessagesLoading: false,
    isSendingMessage: false,
    isDeletingMessage: false, 
    isEditingMessage: false,
    unreadCounts: {},

    getChatPartners: async () => {
  set({ isLoading: true });
  try {
    const { data } = await axiosInstance.get("/messages/chats");
    
    const currentUserId = useAuthStore.getState().authUser?._id;
    
    // Backend now includes unreadCount, so just use it directly
    const chatsWithUnread = data.map((chat: ChatWithPinned) => {
      const partnerId = chat.participants?.find(p => p !== currentUserId) || chat._id;
      
      // Use unreadCount from backend response (already included)
      const unreadCount = chat.unreadCount || 0;
      
      // Also update the unreadCounts map for consistency
      set(state => ({
        unreadCounts: {
          ...state.unreadCounts,
          [partnerId]: unreadCount
        }
      }));
      
      return {
        ...chat,
        unreadCount
      };
    });
    
    set({ chats: chatsWithUnread });
    return chatsWithUnread;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Error fetching chats");
  } finally {
    set({ isLoading: false });
  }
},

    getPrivateMessages: async (id: string) => {
      set({ isMessagesLoading: true });
      try {
        const { data } = await axiosInstance.get(`/messages/${id}`);
        console.log("Messages:", data);
        set({ privateMessages: data });
        
        const unreadCount = get().calculateUnreadCount(id);
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [id]: unreadCount
          }
        }));
        
        return data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Error fetching messages");
      } finally {
        set({ isMessagesLoading: false });
      }
    },

    sendPrivateMessage: async (id: string, data: sendMessageData) => {
  set({ isSendingMessage: true });
  try {
    const { data: newMessage } = await axiosInstance.post(`/messages/send/${id}`, data);
    
    // Only update messages if we're currently viewing this chat
    const currentSelectedUser = useUIStore.getState().selectedUser;
    const currentChatPartnerId = currentSelectedUser?.chatPartnerId || currentSelectedUser?._id;
    
    if (currentChatPartnerId === id) {
      set((state) => ({
        privateMessages: [...state.privateMessages, newMessage],
      }));
    }

    get().updateRecentChat({
      partnerId: id,
      lastMessage: newMessage
    });

    return newMessage;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Error sending message");
  } finally {
    set({ isSendingMessage: false });
  } 
},

    deleteMessage: async (data: DeleteMessageData) => {
      const { messageId, deleteType } = data;
      set({ isDeletingMessage: true });

      const optimisticUpdater = (messages: Message[]) => {
        if (deleteType === "me") {
          return messages.filter(m => m._id !== messageId);
        } else {
          return messages.map(m =>
            m._id === messageId 
              ? { 
                  ...m, 
                  isDeleted: true, 
                  text: "You deleted this message",
                  image: null
                } 
              : m
          );
        }
      };

      set((state) => ({
        privateMessages: optimisticUpdater(state.privateMessages), 
      }));

      try {
        await axiosInstance.delete("/messages/delete", { data });
      } catch (error: any) {
        set((state) => ({ privateMessages: state.privateMessages }));
        throw error;
      } finally {
        set({ isDeletingMessage: false });
      }
    },

    editMessage: async (messageId: string, data: EditMessageData) => {
      const { text } = data;
      set({ isEditingMessage: true });

      const originalMessage = get().privateMessages.find(m => m._id === messageId);
      
      set((state) => ({
        privateMessages: state.privateMessages.map((m) =>
          m._id === messageId ? { ...m, text, editedAt: new Date().toISOString() } : m
        ),
      }));
      
      try {
        const { data: updatedMessage } = await axiosInstance.put(`/messages/edit/${messageId}`, data);
        
        set((state) => ({
          privateMessages: state.privateMessages.map((m) =>
            m._id === messageId ? updatedMessage : m
          ),
        }));

        return updatedMessage;
      } catch (error: any) {
        if (originalMessage) {
          set((state) => ({ 
            privateMessages: state.privateMessages.map((m) =>
              m._id === messageId ? originalMessage : m
            )
          }));
        }
        throw error;
      } finally {
        set({ isEditingMessage: false });
      }
    },

    addIncomingMessage: (msg: Message) => {
      set((state) => ({
        privateMessages: [...state.privateMessages, msg],
      }));
    },

    updateMessageStatus: (messageId: string, status: Message["status"]) => {
      set((state) => ({
        privateMessages: state.privateMessages.map((m) =>
          m._id === messageId ? { ...m, status } : m
        ),
      }));
    },

    calculateUnreadCount: (chatPartnerId: string) => {
      const { privateMessages } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      if (!currentUserId) return 0;
      
      const getId = (val: any) => (typeof val === "string" ? val : val && (val as any)._id);
      
      const unreadMessages = privateMessages.filter(msg => {
        const senderId = getId(msg.senderId);
        const receiverId = getId(msg.receiverId);
        
        return senderId === chatPartnerId && 
               receiverId === currentUserId && 
               msg.status !== 'seen';
      });
      
      return unreadMessages.length;
    },

    getUnreadCount: (chatPartnerId: string) => {
      return get().unreadCounts[chatPartnerId] || 0;
    },

    incrementUnreadCount: (chatPartnerId: string) => {
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [chatPartnerId]: (state.unreadCounts[chatPartnerId] || 0) + 1
        }
      }));
    },

    clearUnreadCount: (chatPartnerId: string) => {
  console.log("🧹 [STORE] clearUnreadCount called for:", chatPartnerId);
  console.log("🧹 [STORE] Before - unreadCounts:", get().unreadCounts);
  
  set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [chatPartnerId]: 0
    }
  }));
  
  console.log("🧹 [STORE] After - unreadCounts:", get().unreadCounts);
},

    setUnreadCount: (chatPartnerId: string, count: number) => {
  set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [chatPartnerId]: count
    },
    chats: state.chats.map(chat => {
      const partnerId = chat.participants?.find(
        p => p !== useAuthStore.getState().authUser?._id
      ) || chat._id;
      if (partnerId === chatPartnerId) {
        return { ...chat, unreadCount: count };
      }
      return chat;
    })
  }));
},

    markMessagesAsSeen: async (chatPartnerId: string) => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👁️ [STORE] markMessagesAsSeen called");
  console.log("👁️ [STORE] chatPartnerId:", chatPartnerId);
  
  try {
    const { privateMessages } = get();
    const currentUserId = useAuthStore.getState().authUser?._id;
    
    console.log("👁️ [STORE] Current User ID:", currentUserId);
    console.log("👁️ [STORE] Total messages in store:", privateMessages.length);
    
    const unreadMessages = privateMessages.filter(msg => {
      const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
      return senderId !== currentUserId && msg.status !== 'seen';
    });

    console.log("👁️ [STORE] Unread messages count:", unreadMessages.length);

    // Clear unread count locally first
    console.log("👁️ [STORE] Clearing unread count locally");
    get().clearUnreadCount(chatPartnerId);

    // Update local message status
    set(state => ({
      privateMessages: state.privateMessages.map(msg => {
        const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
        if (senderId !== currentUserId && msg.status !== 'seen') {
          return { ...msg, status: 'seen' as const };
        }
        return msg;
      }),
      chats: state.chats.map(chat => {
        const partnerId = chat.participants?.find(p => p !== currentUserId) || chat._id;
        if (partnerId === chatPartnerId) {
          console.log("👁️ [STORE] Setting chat unreadCount to 0 for:", partnerId);
          return { ...chat, unreadCount: 0 };
        }
        return chat;
      })
    }));

    // Emit socket event to backend
    const socket = useAuthStore.getState().socket;
    console.log("👁️ [STORE] Socket connected:", socket?.connected);
    
    if (socket) {
      console.log("👁️ [STORE] Emitting markMessagesAsSeen to backend");
      socket.emit("markMessagesAsSeen", { senderId: chatPartnerId });
    } else {
      console.log("👁️ [STORE] ⚠️ Socket not available!");
    }
    
    console.log("👁️ [STORE] After markMessagesAsSeen - unreadCounts:", get().unreadCounts);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error('👁️ [STORE] Error marking messages as seen:', error);
  }
},

    initializeSocketListeners: () => {
      const socket = useAuthStore.getState().socket;
      if (!socket) {
        console.warn("Socket not available - user might not be authenticated");
        return;
      }
      console.log("Initializing socket listeners for private chat...");
      attach(socket);
    },

    cleanupSocketListeners: () => {
      const socket = useAuthStore.getState().socket;
      if (!socket) return;
      console.log("Cleaning up socket listeners...");
      detach(socket);
    },

    updateRecentChat: (data: { partnerId: string; lastMessage: Message }) => {
  set((state) => {
    const currentUserId = useAuthStore.getState().authUser?._id;
    const existingChatIndex = state.chats.findIndex((chat) =>
      (chat.participants && chat.participants.includes(data.partnerId)) || 
      chat._id === data.partnerId
    );

    const selectedUser = useUIStore.getState().selectedUser;
    const selectedUserId = selectedUser?.chatPartnerId || selectedUser?._id;
    const isInChatWindow = selectedUserId === data.partnerId;

    const messageSenderId = typeof data.lastMessage.senderId === "string"
      ? data.lastMessage.senderId
      : data.lastMessage.senderId?._id;
    const isFromOther = messageSenderId !== currentUserId;

    // Only increment unread if:
    // 1. Message is from someone else
    // 2. We're NOT currently viewing this chat
    const shouldIncrementUnread = isFromOther && !isInChatWindow;

    if (existingChatIndex >= 0) {
      const updatedChats = [...state.chats];
      const existingChat = updatedChats[existingChatIndex];
      
      const newUnreadCount = shouldIncrementUnread
        ? (existingChat.unreadCount || 0) + 1
        : existingChat.unreadCount || 0;

      const updatedChat = {
        ...existingChat,
        lastMessage: data.lastMessage,
        updatedAt: new Date().toISOString(),
        unreadCount: newUnreadCount,
      };
      updatedChats[existingChatIndex] = updatedChat;

      const [movedChat] = updatedChats.splice(existingChatIndex, 1);
      updatedChats.unshift(movedChat);

      // Also update unreadCounts map
      const newUnreadCounts = shouldIncrementUnread
        ? {
            ...state.unreadCounts,
            [data.partnerId]: (state.unreadCounts[data.partnerId] || 0) + 1
          }
        : state.unreadCounts;

      return { 
        chats: updatedChats,
        unreadCounts: newUnreadCounts
      };
    } else {
      const newChat: ChatWithPinned = {
        _id: `temp-${Date.now()}`,
        participants: [data.partnerId],
        pinnedMessages: [],
        unreadCount: shouldIncrementUnread ? 1 : 0,
        lastMessage: data.lastMessage,
      };
      
      const newUnreadCounts = shouldIncrementUnread
        ? { ...state.unreadCounts, [data.partnerId]: 1 }
        : state.unreadCounts;
        
      return { 
        chats: [newChat, ...state.chats],
        unreadCounts: newUnreadCounts
      };
    }
  });
},
    
  } as PrivateChatState);
});