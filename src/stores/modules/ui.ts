import { create } from "zustand";

export type Tab = "chats" | "contacts" | "groups";

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

interface UIState {
  activeTab: Tab;  // ← Change from `string` to `Tab`
  selectedUser: string | null;
  replyingTo: ReplyContext | null;
  setActiveTab: (tab: Tab) => void;
  setSelectedUser: (id: string | null) => void;
  setReplyingTo: (msg: ReplyContext | null) => void;
  clearReply: () => void;
  scrollToMessageId: string | null;
  setScrollToMessageId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "chats", // This is now correctly typed as Tab
  selectedUser: null,
  replyingTo: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  clearReply: () => set({ replyingTo: null }),
  scrollToMessageId: null,
  setScrollToMessageId: (id) => set({ scrollToMessageId: id }),
}));