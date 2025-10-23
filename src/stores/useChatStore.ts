import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { sendMessageData } from "@/types/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                    */
/* -------------------------------------------------------------------------- */
interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

interface Message {
  _id: string;
  text?: string;
  image?: string;
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

interface ReplyContext {
  _id: string;
  text?: string;
  image?: string;
  senderId: {
    _id: string;
    fullName: string;
    profilePic?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  Extended Models (for pinnedMessages, starred items)                     */
/* -------------------------------------------------------------------------- */
interface ChatWithPinned {
  _id: string;
  participants: string[];
  pinnedMessages: string[];
  fullName?: string;      // for private chats
  profilePic?: string;
}

interface GroupWithPinned {
  _id: string;
  members: string[];
  pinnedMessages: string[];
  // ... other group fields
}

/* -------------------------------------------------------------------------- */
/*  Store Interface                                                          */
/* -------------------------------------------------------------------------- */
interface ChatStore {
  /* ────── Data ────── */
  contacts: any[];
  chats: ChatWithPinned[];
  privateMessages: Message[];
  groups: GroupWithPinned[];
  groupMessages: Message[];
  activeTab: string;
  selectedUser: string | null;
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;
  replyingTo: ReplyContext | null;

  /* ────── User Preferences ────── */
  starredMessages: string[];
  starredChats: string[];

  /* ────── Actions ────── */
  setActiveTab: (tab: string) => void;
  setSelectedUser: (selectedUser: string | null) => void;
  setReplyingTo: (msg: ReplyContext | null) => void;
  clearReply: () => void;

  getAllContacts: () => Promise<any[]>;
  getChatPartners: () => Promise<ChatWithPinned[]>;
  getMyGroups: () => Promise<GroupWithPinned[]>;
  getPrivateMessages: (id: string) => Promise<Message[]>;
  getGroupMessages: (groupId: string) => Promise<Message[]>;

  sendPrivateMessage: (id: string, data: sendMessageData) => Promise<Message>;
  sendGroupMessage: (groupId: string, data: sendMessageData) => Promise<Message>;

  deleteMessage: (data: DeleteMessageData, isGroup: boolean) => Promise<void>;
  editMessage: (
    messageId: string,
    data: EditMessageData,
    isGroup: boolean
  ) => Promise<Message>;

  pinMessage: (payload: { messageId: string; chatId?: string; groupId?: string }) => Promise<void>;
  unpinMessage: (payload: { messageId: string; chatId?: string; groupId?: string }) => Promise<void>;
  toggleStarMessage: (messageId: string) => Promise<void>;
  toggleStarChat: (chatId: string) => Promise<void>;

  /* ────── Socket ────── */
  addIncomingMessage: (msg: Message, isGroup?: boolean) => void;
  updateMessageStatus: (
    messageId: string,
    status: "sent" | "delivered" | "seen"
  ) => void;
}

/* -------------------------------------------------------------------------- */
/*  Store Implementation                                                     */
/* -------------------------------------------------------------------------- */
export const useChatStore = create<ChatStore>((set, get) => ({
  /* ────── Initial State ────── */
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
  isDeletingMessage: false,
  isEditingMessage: false,
  replyingTo: null,
  starredMessages: [],
  starredChats: [],

  /* ────── Simple Setters ────── */
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  clearReply: () => set({ replyingTo: null }),

  /* ────── API: Fetch Data ────── */
  getAllContacts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/messages/contacts");
      set({ contacts: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching contacts");
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
      throw new Error(error?.response?.data?.message || "Error fetching chats");
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
      throw new Error(error?.response?.data?.message || "Error fetching groups");
    } finally {
      set({ isLoading: false });
    }
  },

  getPrivateMessages: async (id: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await axiosInstance.get(`/messages/${id}`);
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
      set({ groupMessages: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /* ────── SEND MESSAGE (Private) ────── */
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

  /* ────── SEND MESSAGE (Group) ────── */
  sendGroupMessage: async (groupId: string, data: sendMessageData) => {
    set({ isSendingMessage: true });
    try {
      const { data: newMessage } = await axiosInstance.post(`/groups/${groupId}/messages`, data);
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

  /* ────── DELETE MESSAGE (Optimistic) ────── */
  deleteMessage: async (data: DeleteMessageData, isGroup: boolean) => {
    const { messageId } = data;
    set({ isDeletingMessage: true });

    const optimisticUpdater = (messages: Message[]) =>
      messages.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, text: "[Deleted]" } : m
      );

    set((state) => ({
      privateMessages: isGroup ? state.privateMessages : optimisticUpdater(state.privateMessages),
      groupMessages: isGroup ? optimisticUpdater(state.groupMessages) : state.groupMessages,
    }));

    try {
      await axiosInstance.delete("/messages/delete", { data });
    } catch (error: any) {
      set((state) => ({
        privateMessages: isGroup ? state.privateMessages : state.privateMessages,
        groupMessages: isGroup ? state.groupMessages : state.groupMessages,
      }));
      throw new Error(error?.response?.data?.message || "Failed to delete message");
    } finally {
      set({ isDeletingMessage: false });
    }
  },

  /* ────── EDIT MESSAGE (Optimistic) ────── */
  editMessage: async (messageId: string, data: EditMessageData, isGroup: boolean) => {
    const { text } = data;
    set({ isEditingMessage: true });

    const optimisticUpdater = (messages: Message[]) =>
      messages.map((m) =>
        m._id === messageId
          ? { ...m, text, editedAt: new Date().toISOString() }
          : m
      );

    set((state) => ({
      privateMessages: isGroup ? state.privateMessages : optimisticUpdater(state.privateMessages),
      groupMessages: isGroup ? optimisticUpdater(state.groupMessages) : state.groupMessages,
    }));

    let updatedMessage: Message;
    try {
      const { data: res } = await axiosInstance.put(`/messages/edit/${messageId}`, data);
      updatedMessage = res;
    } catch (error: any) {
      set((state) => ({
        privateMessages: isGroup ? state.privateMessages : state.privateMessages,
        groupMessages: isGroup ? state.groupMessages : state.groupMessages,
      }));
      throw new Error(error?.response?.data?.message || "Failed to edit message");
    } finally {
      set({ isEditingMessage: false });
    }

    set((state) => ({
      privateMessages: isGroup
        ? state.privateMessages
        : state.privateMessages.map((m) => (m._id === messageId ? updatedMessage : m)),
      groupMessages: isGroup
        ? state.groupMessages.map((m) => (m._id === messageId ? updatedMessage : m))
        : state.groupMessages,
    }));

    return updatedMessage;
  },

  /* ────── PIN MESSAGE (Optimistic) ────── */
  pinMessage: async (payload: { messageId: string; chatId?: string; groupId?: string }) => {
    const { messageId, chatId, groupId } = payload;

    // Optimistic: Add to pinnedMessages
    set((state) => {
      if (chatId) {
        const chat = state.chats.find((c) => c._id === chatId);
        if (!chat || chat.pinnedMessages.includes(messageId)) return state;
        return {
          chats: state.chats.map((c) =>
            c._id === chatId
              ? { ...c, pinnedMessages: [...c.pinnedMessages, messageId] }
              : c
          ),
        };
      } else if (groupId) {
        const group = state.groups.find((g) => g._id === groupId);
        if (!group || group.pinnedMessages.includes(messageId)) return state;
        return {
          groups: state.groups.map((g) =>
            g._id === groupId
              ? { ...g, pinnedMessages: [...g.pinnedMessages, messageId] }
              : g
          ),
        };
      }
      return state;
    });

    try {
      const { data } = await axiosInstance.post("/chats/pin", payload);
      // Sync with server response
      set((state) => {
        if (chatId) {
          return {
            chats: state.chats.map((c) =>
              c._id === chatId ? { ...c, pinnedMessages: data.pinnedMessages } : c
            ),
          };
        } else if (groupId) {
          return {
            groups: state.groups.map((g) =>
              g._id === groupId ? { ...g, pinnedMessages: data.pinnedMessages } : g
            ),
          };
        }
        return state;
      });
    } catch (error: any) {
      // Revert
      set((state) => {
        if (chatId) {
          return {
            chats: state.chats.map((c) =>
              c._id === chatId
                ? { ...c, pinnedMessages: c.pinnedMessages.filter((id) => id !== messageId) }
                : c
            ),
          };
        } else if (groupId) {
          return {
            groups: state.groups.map((g) =>
              g._id === groupId
                ? { ...g, pinnedMessages: g.pinnedMessages.filter((id) => id !== messageId) }
                : g
            ),
          };
        }
        return state;
      });
      throw new Error(error?.response?.data?.message || "Failed to pin message");
    }
  },

  /* ────── UNPIN MESSAGE (Optimistic) ────── */
  unpinMessage: async (payload: { messageId: string; chatId?: string; groupId?: string }) => {
    const { messageId, chatId, groupId } = payload;

    // Optimistic: Remove from pinnedMessages
    set((state) => {
      if (chatId) {
        return {
          chats: state.chats.map((c) =>
            c._id === chatId
              ? { ...c, pinnedMessages: c.pinnedMessages.filter((id) => id !== messageId) }
              : c
          ),
        };
      } else if (groupId) {
        return {
          groups: state.groups.map((g) =>
            g._id === groupId
              ? { ...g, pinnedMessages: g.pinnedMessages.filter((id) => id !== messageId) }
              : g
          ),
        };
      }
      return state;
    });

    try {
      await axiosInstance.post("/chats/unpin", payload);
    } catch (error: any) {
      // Revert
      set((state) => {
        if (chatId) {
          const chat = state.chats.find((c) => c._id === chatId);
          if (chat && !chat.pinnedMessages.includes(messageId)) {
            return {
              chats: state.chats.map((c) =>
                c._id === chatId
                  ? { ...c, pinnedMessages: [...c.pinnedMessages, messageId] }
                  : c
              ),
            };
          }
        } else if (groupId) {
          const group = state.groups.find((g) => g._id === groupId);
          if (group && !group.pinnedMessages.includes(messageId)) {
            return {
              groups: state.groups.map((g) =>
                g._id === groupId
                  ? { ...g, pinnedMessages: [...g.pinnedMessages, messageId] }
                  : g
              ),
            };
          }
        }
        return state;
      });
      throw new Error(error?.response?.data?.message || "Failed to unpin message");
    }
  },

  /* ────── TOGGLE STAR MESSAGE ────── */
  toggleStarMessage: async (messageId: string) => {
    const wasStarred = get().starredMessages.includes(messageId);

    // Optimistic
    set((state) => ({
      starredMessages: wasStarred
        ? state.starredMessages.filter((id) => id !== messageId)
        : [...state.starredMessages, messageId],
    }));

    try {
      await axiosInstance.post("/chats/star-message", { messageId });
    } catch (error: any) {
      // Revert
      set((state) => ({
        starredMessages: wasStarred
          ? [...state.starredMessages, messageId]
          : state.starredMessages.filter((id) => id !== messageId),
      }));
      throw new Error(error?.response?.data?.message || "Failed to star/unstar message");
    }
  },

  /* ────── TOGGLE STAR CHAT ────── */
  toggleStarChat: async (chatId: string) => {
    const wasStarred = get().starredChats.includes(chatId);

    // Optimistic
    set((state) => ({
      starredChats: wasStarred
        ? state.starredChats.filter((id) => id !== chatId)
        : [...state.starredChats, chatId],
    }));

    try {
      await axiosInstance.post("/chats/star-chat", { chatId });
    } catch (error: any) {
      // Revert
      set((state) => ({
        starredChats: wasStarred
          ? [...state.starredChats, chatId]
          : state.starredChats.filter((id) => id !== chatId),
      }));
      throw new Error(error?.response?.data?.message || "Failed to star/unstar chat");
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