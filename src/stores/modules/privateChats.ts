import { axiosInstance } from "@/api/axios";
import { sendMessageData, Message } from "@/types/types";
import { create } from "zustand";
import { useAuthStore } from "./auth";

interface DeleteMessageData {
  messageId: string;
  deleteType: "everyone" | "me";
}

interface EditMessageData {
  text: string; 
}

interface ChatWithPinned {
  _id: string;
  participants: string[];
  participantDetails?: Array<{
    _id: string;
    fullName: string;
    profilePic?: string;
  }>;
  pinnedMessages: string[];
  fullName?: string;
  profilePic?: string;
  lastMessage?: Message;
  updatedAt?: string;
}

interface PrivateChatState {
  chats: ChatWithPinned[];
  privateMessages: Message[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;

  // Core chat methods
  getChatPartners: () => Promise<ChatWithPinned[]>;
  getPrivateMessages: (id: string) => Promise<Message[]>;
  sendPrivateMessage: (id: string, data: sendMessageData) => Promise<Message>;
  deleteMessage: (data: DeleteMessageData) => Promise<void>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<Message>;
  addIncomingMessage: (msg: Message) => void;
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;

  // Socket methods
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  updateRecentChat: (data: {
    partnerId: string;
    lastMessage: Message;
  }) => void;
}

export const usePrivateChatStore = create<PrivateChatState>((set, get) => ({
  chats: [],
  privateMessages: [],
  isLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  isDeletingMessage: false,
  isEditingMessage: false,

  getChatPartners: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/messages/chats");
      console.log("Chat Partners:", data);
      set({ chats: data });
      return data;
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
      
      // Optimistically add to messages
      set((state) => ({
        privateMessages: [...state.privateMessages, newMessage],
      }));

      // Also update recent chats optimistically
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

    // Different optimistic updates based on delete type
    const optimisticUpdater = (messages: Message[]) => {
      if (deleteType === "me") {
        // Remove completely for "delete for me"
        return messages.filter(m => m._id !== messageId);
      } else {
        // Show "You deleted this message" for "delete for everyone"
        return messages.map(m =>
          m._id === messageId 
            ? { 
                ...m, 
                isDeleted: true, 
                text: "You deleted this message",
                image: null // Remove image if it exists
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
      // Revert on error - you might want to implement proper revert logic
      set((state) => ({ privateMessages: state.privateMessages }));
      throw error;
    } finally {
      set({ isDeletingMessage: false });
    }
  },

  editMessage: async (messageId: string, data: EditMessageData) => {
    const { text } = data;
    set({ isEditingMessage: true });

    // Store original message for rollback
    const originalMessage = get().privateMessages.find(m => m._id === messageId);
    
    // Optimistic update
    set((state) => ({
      privateMessages: state.privateMessages.map((m) =>
        m._id === messageId ? { ...m, text, editedAt: new Date().toISOString() } : m
      ),
    }));
    
    try {
      const { data: updatedMessage } = await axiosInstance.put(`/messages/edit/${messageId}`, data);
      
      // Update with server response
      set((state) => ({
        privateMessages: state.privateMessages.map((m) =>
          m._id === messageId ? updatedMessage : m
        ),
      }));

      return updatedMessage;
    } catch (error: any) {
      // Revert optimistic update on error
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

  // Add this to your initializeSocketListeners in usePrivateChatStore

initializeSocketListeners: () => {
  const socket = useAuthStore.getState().socket;
  const currentUserId = useAuthStore.getState().authUser?._id;
  
  if (!socket) {
    console.warn("Socket not available - user might not be authenticated");
    return;
  }

  console.log("🔌 Initializing socket listeners for private chat...");

  // Listen for new incoming messages (from other users)
  socket.on("newMessage", (message: Message) => {
    console.log("📨 newMessage received:", message);
    const { privateMessages } = get();
    
    const senderId = typeof message.senderId === "string" 
      ? message.senderId 
      : message.senderId?._id;
    
    if (senderId === currentUserId) {
      console.log("⏭️  Skipping own message from socket");
      return;
    }
    
    const messageExists = privateMessages.some(m => m._id === message._id);
    if (!messageExists) {
      console.log("✅ Adding new message to state");
      get().addIncomingMessage(message);
      
      const partnerId = typeof message.senderId === "string" 
        ? message.senderId 
        : message.senderId?._id;
      const receiverId = typeof message.receiverId === "string"
        ? message.receiverId
        : message.receiverId?._id;
      
      const otherUserId = partnerId === currentUserId ? receiverId : partnerId;
      
      get().updateRecentChat({
        partnerId: otherUserId!,
        lastMessage: message
      });
    } else {
      console.log("⚠️  Message already exists, skipping");
    }
  });

  // Listen for status updates for YOUR messages
  socket.on("messageStatusUpdate", (data: {
    messageId: string;
    status: Message["status"];
  }) => {
    console.log("🔄 messageStatusUpdate received:", data);
    
    set((state) => {
      const tempMessageIndex = state.privateMessages.findIndex(m => m._id.startsWith('temp-'));
      
      if (tempMessageIndex !== -1) {
        const updatedMessages = [...state.privateMessages];
        updatedMessages[tempMessageIndex] = {
          ...updatedMessages[tempMessageIndex],
          _id: data.messageId,
          status: data.status
        };
        
        console.log("✅ Updated temp message at index", tempMessageIndex, "→", data.messageId, data.status);
        return { privateMessages: updatedMessages };
      } else {
        const updatedMessages = state.privateMessages.map(m =>
          m._id === data.messageId ? { ...m, status: data.status } : m
        );
        
        console.log("✅ Updated existing message status:", data.messageId, data.status);
        return { privateMessages: updatedMessages };
      }
    });
  });

  // ⭐ NEW: Listen for bulk status updates when user comes online
  socket.on("bulkMessageStatusUpdate", (data: {
    messageIds: string[];
    status: Message["status"];
  }) => {
    console.log("📦 bulkMessageStatusUpdate received:", data);
    
    // Create the Set BEFORE using it in set()
    const messageIdSet = new Set(data.messageIds);
    
    set((state) => {
      // Update messages
      const updatedMessages = state.privateMessages.map(m =>
        messageIdSet.has(m._id) ? { ...m, status: data.status } : m
      );
      
      // Update recent chats with new status
      const updatedChats = state.chats.map(chat => {
        if (chat.lastMessage && messageIdSet.has(chat.lastMessage._id)) {
          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              status: data.status
            }
          };
        }
        return chat;
      });
      
      console.log(`✅ Updated ${data.messageIds.length} messages to ${data.status}`);
      return { 
        privateMessages: updatedMessages,
        chats: updatedChats
      };
    });
  });

  // Listen for recent chat updates
  socket.on("recentChatUpdated", (data: {
    partnerId: string;
    lastMessage: Message;
  }) => {
    console.log("📬 recentChatUpdated received:", data);
    get().updateRecentChat(data);
  });

  // Listen for message edits from other users
  socket.on("messageEdited", (updatedMessage: Message) => {
    console.log("✏️  messageEdited received:", updatedMessage);
    
    const senderId = typeof updatedMessage.senderId === "string" 
      ? updatedMessage.senderId 
      : updatedMessage.senderId?._id;
    
    if (senderId === currentUserId) {
      console.log("⏭️  Skipping own edit from socket");
      return;
    }
    
    set(state => ({
      privateMessages: state.privateMessages.map(m =>
        m._id === updatedMessage._id ? updatedMessage : m
      )
    }));
  });

  // Listen for message deletes from other users
  socket.on("messageDeleted", (data: { messageId: string }) => {
    console.log("🗑️  messageDeleted received:", data);
    set(state => ({
      privateMessages: state.privateMessages.filter(m => m._id !== data.messageId)
    }));
  });

  // Listen for socket errors
  socket.on("error", (error: { message: string }) => {
    console.error("❌ Socket error:", error);
  });
  
  console.log("✅ Socket listeners initialized for private chat");
},

cleanupSocketListeners: () => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;

  console.log("Cleaning up socket listeners...");

  socket.off("newMessage");
  socket.off("messageStatusUpdate");
  socket.off("bulkMessageStatusUpdate");
  socket.off("recentChatUpdated");
  socket.off("messageEdited");
  socket.off("messageDeleted");
  socket.off("error");
},

  updateRecentChat: (data: { partnerId: string; lastMessage: Message }) => {
  set(state => {
    const existingChatIndex = state.chats.findIndex(chat =>
      chat.participants && chat.participants.includes(data.partnerId) ||
      chat._id === data.partnerId
    );

    if (existingChatIndex >= 0) {
      // Update existing chat with new last message
      const updatedChats = [...state.chats];
      const existingChat = updatedChats[existingChatIndex];
      
      const updatedChat = {
        ...existingChat,
        lastMessage: data.lastMessage,
        updatedAt: new Date().toISOString()
      };
      updatedChats[existingChatIndex] = updatedChat;

      // Move to top (most recent first)
      const [movedChat] = updatedChats.splice(existingChatIndex, 1);
      updatedChats.unshift(movedChat);

      return { chats: updatedChats };
    } else {
      // Create new temporary chat entry
      const newChat: ChatWithPinned = {
        _id: `temp-${Date.now()}`,
        participants: [data.partnerId],
        pinnedMessages: [],
        // Note: Full user details will be fetched when chat list is refreshed
      };
      return { chats: [newChat, ...state.chats] };
    }
  });
},
}));