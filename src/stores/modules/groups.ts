// src/store/modules/groups.ts
import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { sendMessageData } from "@/types/types";

/* -------------------------------------------------------------------------- */
/*  Types (reused from main file)                                            */
/* -------------------------------------------------------------------------- */
interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

interface Message {
  _id: string;
  text?: string;
  image?: string | null;
  senderId: User | string;
  receiverId?: string;
  groupId?: string;
  status: "sent" | "delivered" | "seen";
  replyTo?: Message | string;
  createdAt: string;
  isDeleted?: boolean;
  editedAt?: string;
}

interface DeleteMessageData {
  messageId: string;
  deleteType: "everyone" | "me";
}

interface EditMessageData {
  text: string;
}

interface GroupWithPinned {
  _id: string;
  members: string[];
  pinnedMessages: string[];
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  avatar?: string;
}

/* -------------------------------------------------------------------------- */
/*  Group Store Interface                                                    */
/* -------------------------------------------------------------------------- */
interface GroupState {
  groups: GroupWithPinned[];
  groupMessages: Message[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;

  getMyGroups: () => Promise<GroupWithPinned[]>;
  getGroupMessages: (groupId: string) => Promise<Message[]>;
  sendGroupMessage: (groupId: string, data: sendMessageData) => Promise<Message>;
  deleteMessage: (data: DeleteMessageData) => Promise<void>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<Message>;
  // Note: pin/unpin handled in pinning module
}

/* -------------------------------------------------------------------------- */
/*  Group Store Implementation                                               */
/* -------------------------------------------------------------------------- */
export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  groupMessages: [],
  isLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  isDeletingMessage: false,
  isEditingMessage: false,

  /* ────── Fetch Groups ────── */
  getMyGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups/my-groups");
      set({ groups: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching groups");
    } finally {
      set({ isLoading: false });
    }
  },

  /* ────── Fetch Group Messages ────── */
  getGroupMessages: async (groupId: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /* ────── Send Group Message ────── */
  sendGroupMessage: async (groupId: string, data: sendMessageData) => {
    set({ isSendingMessage: true });
    try {
      const { data: newMessage } = await axiosInstance.post(
        `/groups/${groupId}/messages`,
        data
      );
      set((state) => ({
        groupMessages: [...state.groupMessages, newMessage],
      }));
      return newMessage;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error sending group message");
    } finally {
      set({ isSendingMessage: false });
    }
  },

  /* ────── Delete Message (Optimistic) ────── */
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
    groupMessages: optimisticUpdater(state.groupMessages),
  }));

  try {
    await axiosInstance.delete("/messages/delete", { data });
  } catch (error: any) {
    set((state) => ({ groupMessages: state.groupMessages }));
    throw new Error(error?.response?.data?.message || "Failed to delete message");
  } finally {
    set({ isDeletingMessage: false });
  }
},

  /* ────── Edit Message (Optimistic) ────── */
 editMessage: async (messageId: string, data: EditMessageData) => {
  const { text } = data;
  set({ isEditingMessage: true });

  // Store original message for proper rollback
  const originalMessage = get().groupMessages.find(m => m._id === messageId);
  
  // Optimistic update
  set((state) => ({
    groupMessages: state.groupMessages.map((m) =>
      m._id === messageId
        ? { ...m, text, editedAt: new Date().toISOString() }
        : m
    ),
  }));

  try {
    const { data: updatedMessage } = await axiosInstance.put(
      `/messages/edit/${messageId}`,
      data
    );
    
    // Update with server response
    set((state) => ({
      groupMessages: state.groupMessages.map((m) =>
        m._id === messageId ? updatedMessage : m
      ),
    }));

    return updatedMessage;
  } catch (error: any) {
    // Revert optimistic update properly
    if (originalMessage) {
      set((state) => ({ 
        groupMessages: state.groupMessages.map((m) =>
          m._id === messageId ? originalMessage : m
        )
      }));
    }
    throw new Error(error?.response?.data?.message || "Failed to edit message");
  } finally {
    set({ isEditingMessage: false });
  }
},
}));