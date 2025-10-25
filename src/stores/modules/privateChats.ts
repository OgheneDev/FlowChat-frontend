import { axiosInstance } from "@/api/axios";
import { sendMessageData, Message } from "@/types/types";
import { create } from "zustand";

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
  fullName?: string;      // for private chats (legacy?)
  profilePic?: string;    // for private chats (legacy?)
}

interface PrivateChatState {
  chats: ChatWithPinned[];
  privateMessages: Message[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;

  getChatPartners: () => Promise<ChatWithPinned[]>;
  getPrivateMessages: (id: string) => Promise<Message[]>;
  sendPrivateMessage: (id: string, data: sendMessageData) => Promise<Message>;
  deleteMessage: (data: DeleteMessageData) => Promise<void>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<Message>;
  addIncomingMessage: (msg: Message) => void;
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;
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
      console.log("Messages:", data)
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
      set((state) => ({
        privateMessages: [...state.privateMessages, newMessage],
      }));
      return newMessage;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error sending message");
    } finally {
      set({ isSendingMessage: false });
    }
  },

  deleteMessage: async (data: DeleteMessageData) => {
    const { messageId } = data;
    set({ isDeletingMessage: true });

    const optimisticUpdater = (messages: Message[]) =>
      messages.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, text: "[Deleted]" } : m
      );

    set((state) => ({
      privateMessages: optimisticUpdater(state.privateMessages),
    }));

    try {
      await axiosInstance.delete("/messages/delete", { data });
    } catch (error: any) {
      set((state) => ({ privateMessages: state.privateMessages })); // revert
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
}));