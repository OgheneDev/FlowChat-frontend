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
  profileImage?: string;
  email: string;
  online?: boolean;
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
  deleted?: boolean;
  deletedForEveryone?: boolean;
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
  name: string;
  members: User[] | string[];
  admins: User[] | string[];
  groupImage?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message | null;
  pinnedMessages?: string[];
}

interface CreateGroupData {
  name: string;
  members: string[];
  groupImage?: string;
  description: string;
} 

interface UpdateGroupData {
  name?: string;
  newImage?: string;
  members?: string[];
  description?: string; 
}

/* -------------------------------------------------------------------------- */
/*  Group Store Interface                                                    */
/* -------------------------------------------------------------------------- */
interface GroupState {
  groups: GroupWithPinned[];
  groupMessages: Message[];
  currentGroup: GroupWithPinned | null;
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;
  isCreatingGroup: boolean;
  isUpdatingGroup: boolean;
  isManagingMembers: boolean;

  // Group Management
  getMyGroups: () => Promise<GroupWithPinned[]>;
  getGroupById: (groupId: string) => Promise<GroupWithPinned>;
  createGroup: (data: CreateGroupData) => Promise<GroupWithPinned>;
  updateGroup: (groupId: string, data: UpdateGroupData) => Promise<GroupWithPinned>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;

  // Member Management
  addMembersToGroup: (groupId: string, members: string[]) => Promise<GroupWithPinned>;
  removeMemberFromGroup: (groupId: string, memberId: string) => Promise<GroupWithPinned>;
  makeGroupAdmin: (groupId: string, userIdToPromote: string) => Promise<GroupWithPinned>;

  // Messages
  getGroupMessages: (groupId: string) => Promise<Message[]>;
  sendGroupMessage: (groupId: string, data: sendMessageData) => Promise<Message>;
  deleteMessage: (data: DeleteMessageData) => Promise<void>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<Message>;

  // Utility
  setCurrentGroup: (group: GroupWithPinned | null) => void;
  clearGroupMessages: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Group Store Implementation                                               */
/* -------------------------------------------------------------------------- */
export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  groupMessages: [],
  currentGroup: null,
  isLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  isDeletingMessage: false,
  isEditingMessage: false,
  isCreatingGroup: false,
  isUpdatingGroup: false,
  isManagingMembers: false,

  /* ────── Group Management ────── */

  getMyGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups/my-groups");
      console.log("Groups:", data)
      set({ groups: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching groups");
    } finally {
      set({ isLoading: false });
    }
  },

  getGroupById: async (groupId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}`);
      console.log("Group:", data)
      set({ currentGroup: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching group details");
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (data: CreateGroupData) => {
    set({ isCreatingGroup: true });
    try {
      const { data: newGroup } = await axiosInstance.post("/groups", data);
      set((state) => ({
        groups: [newGroup, ...state.groups],
      }));
      return newGroup;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error creating group");
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  updateGroup: async (groupId: string, data: UpdateGroupData) => {
    set({ isUpdatingGroup: true });
    try {
      const { data: updatedGroup } = await axiosInstance.put(
        `/groups/${groupId}`,
        data
      );
      
      // Update in groups list
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
      }));
      
      return updatedGroup;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error updating group");
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  leaveGroup: async (groupId: string) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/groups/${groupId}/leave`);
      
      // Remove from local state
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        currentGroup: state.currentGroup?._id === groupId ? null : state.currentGroup,
        groupMessages: state.currentGroup?._id === groupId ? [] : state.groupMessages,
      }));
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error leaving group");
    } finally {
      set({ isLoading: false });
    }
  },

  deleteGroup: async (groupId: string) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      
      // Remove from local state
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        currentGroup: state.currentGroup?._id === groupId ? null : state.currentGroup,
        groupMessages: state.currentGroup?._id === groupId ? [] : state.groupMessages,
      }));
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error deleting group");
    } finally {
      set({ isLoading: false });
    }
  },

  /* ────── Member Management ────── */

  addMembersToGroup: async (groupId: string, members: string[]) => {
    set({ isManagingMembers: true });
    try {
      const { data: updatedGroup } = await axiosInstance.post(
        `/groups/${groupId}/add-members`,
        { members }
      );
      
      // Update in groups list and current group
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
      }));
      
      return updatedGroup;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error adding members");
    } finally {
      set({ isManagingMembers: false });
    }
  },

  removeMemberFromGroup: async (groupId: string, memberId: string) => {
    set({ isManagingMembers: true });
    try {
      const { data: updatedGroup } = await axiosInstance.delete(
        `/groups/${groupId}/members/${memberId}`
      );
      
      // Update in groups list and current group
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
      }));
      
      return updatedGroup;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error removing member");
    } finally {
      set({ isManagingMembers: false });
    }
  },

  makeGroupAdmin: async (groupId: string, userIdToPromote: string) => {
    set({ isManagingMembers: true });
    try {
      const { data: updatedGroup } = await axiosInstance.post(
        "/groups/make-admin",
        { groupId, userIdToPromote }
      );
      
      // Update in groups list and current group
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
      }));
      
      return updatedGroup;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error promoting user to admin");
    } finally {
      set({ isManagingMembers: false });
    }
  },

  /* ────── Messages ────── */

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

  /* ────── Utility Functions ────── */

  setCurrentGroup: (group: GroupWithPinned | null) => {
    set({ currentGroup: group });
  },

  clearGroupMessages: () => {
    set({ groupMessages: [] });
  },
}));