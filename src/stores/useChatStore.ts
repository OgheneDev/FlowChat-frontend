// src/stores/useChatStore.ts
import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { sendMessageData } from "@/types/types";

/* -------------------------------------------------------------------------- */
/*  Types – keep everything strongly typed                                   */
/* -------------------------------------------------------------------------- */
interface User {
  _id: string;
  fullName: string;
  profileImage?: string;
}

interface Message {
  _id: string;
  text?: string;
  image?: string;
  senderId: User | string;          // populated or just id
  receiverId?: string;
  groupId?: string;
  status: "sent" | "delivered" | "seen";
  replyTo?: Message | string;
  createdAt: string;
  // add any other fields you receive from the backend
}

interface ReplyContext {
  _id: string;
  text?: string;
  image?: string;
  senderId: {
    _id: string;
    fullName: string;
    profileImage?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  Store interface                                                          */
/* -------------------------------------------------------------------------- */
interface ChatStore {
  /* data */
  contacts: any[];
  chats: any[];
  privateMessages: Message[];
  groups: any[];
  groupMessages: Message[];
  activeTab: string;
  selectedUser: string | null;
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;

  /* reply state */
  replyingTo: ReplyContext | null;

  /* actions */
  setActiveTab: (tab: string) => void;
  setSelectedUser: (selectedUser: string | null) => void;
  setReplyingTo: (msg: ReplyContext | null) => void;
  clearReply: () => void;

  getAllContacts: () => Promise<any[]>;
  getChatPartners: () => Promise<any[]>;
  getMyGroups: () => Promise<any[]>;
  getPrivateMessages: (id: string) => Promise<Message[]>;
  getGroupMessages: (groupId: string) => Promise<Message[]>;

  sendPrivateMessage: (id: string, data: sendMessageData) => Promise<Message>;
  sendGroupMessage: (groupId: string, data: sendMessageData) => Promise<Message>;

  /* socket helpers */
  addIncomingMessage: (msg: Message, isGroup?: boolean) => void;
  updateMessageStatus: (
    messageId: string,
    status: "sent" | "delivered" | "seen"
  ) => void;
}

/* -------------------------------------------------------------------------- */
/*  Store implementation                                                     */
/* -------------------------------------------------------------------------- */
export const useChatStore = create<ChatStore>((set, get) => ({
  /* ────── initial state ────── */
  contacts: [],
  chats: [],
  privateMessages: [],
  groups: [],
  groupMessages: [],
  activeTab: "chats",
  selectedUser: null,
  isLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  replyingTo: null,

  /* ────── simple setters ────── */
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  clearReply: () => set({ replyingTo: null }),

  /* ────── API calls ────── */
  getAllContacts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/messages/contacts");
      set({ contacts: data });
      return data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error fetching contacts";
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  getChatPartners: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/messages/chats");
      set({ chats: data });
      return data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error fetching chats";
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  getMyGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups/my-groups");
      set({ groups: data });
      return data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error fetching groups";
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  getPrivateMessages: async (id: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await axiosInstance.get(`/messages/${id}`);
      console.log("Private Messages",data)
      set({ privateMessages: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getGroupMessages: async (groupId: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      console.log("Group messages:",data)
      set({ groupMessages: data });
      return data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Error fetching group messages"
      );
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /* ────── SEND (private) ────── */
  sendPrivateMessage: async (id: string, data: sendMessageData) => {
    set({ isSendingMessage: true });
    try {
      const { data: newMessage } = await axiosInstance.post(
        `/messages/send/${id}`,
        data
      );

      // optimistic UI – append immediately
      set((state) => ({
        privateMessages: [...state.privateMessages, newMessage],
      }));

      return newMessage;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Error sending message";
      throw new Error(msg);
    } finally {
      set({ isSendingMessage: false });
    }
  },

  /* ────── SEND (group) ────── */
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
      const msg =
        error?.response?.data?.message || "Error sending message to group";
      throw new Error(msg);
    } finally {
      set({ isSendingMessage: false });
    }
  },

  /* ────── SOCKET HELPERS ────── */
  addIncomingMessage: (msg: Message, isGroup = false) => {
    set((state) => {
      if (isGroup) {
        return { groupMessages: [...state.groupMessages, msg] };
      }
      return { privateMessages: [...state.privateMessages, msg] };
    });
  },

  updateMessageStatus: (messageId: string, status: "sent" | "delivered" | "seen") => {
    set((state) => ({
      privateMessages: state.privateMessages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
      groupMessages: state.groupMessages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
    }));
  },
}));