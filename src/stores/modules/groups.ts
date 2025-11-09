import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { sendMessageData } from "@/types/types";
import { useAuthStore } from "./auth";

interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
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

  // Socket Methods
  addIncomingGroupMessage: (msg: Message) => void;
  updateGroupMessageStatus: (messageId: string, status: Message["status"]) => void;
  initializeGroupSocketListeners: () => void;
  cleanupGroupSocketListeners: () => void;
  updateRecentGroup: (data: {
    groupId: string;
    lastMessage: Message;
  }) => void;

  // Utility
  setCurrentGroup: (group: GroupWithPinned | null) => void;
  clearGroupMessages: () => void;
}

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
      
      // Optimistically add to messages
      set((state) => ({
        groupMessages: [...state.groupMessages, newMessage],
      }));

      // Also update recent groups optimistically
      get().updateRecentGroup({
        groupId,
        lastMessage: newMessage
      });

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

    const originalMessage = get().groupMessages.find(m => m._id === messageId);
    
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
      
      set((state) => ({
        groupMessages: state.groupMessages.map((m) =>
          m._id === messageId ? updatedMessage : m
        ),
      }));

      return updatedMessage;
    } catch (error: any) {
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

  /* ────── Socket Methods ────── */

  addIncomingGroupMessage: (msg: Message) => {
    set((state) => ({
      groupMessages: [...state.groupMessages, msg],
    }));
  },

  updateGroupMessageStatus: (messageId: string, status: Message["status"]) => {
    set((state) => ({
      groupMessages: state.groupMessages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
    }));
  },

initializeGroupSocketListeners: () => {
  const socket = useAuthStore.getState().socket;
  const currentUserId = useAuthStore.getState().authUser?._id;
  
  if (!socket) {
    console.warn("Socket not available for group chat");
    return;
  }

  console.log("🔌 Initializing socket listeners for group chat...");

  // Listen for new incoming group messages (from other users)
  socket.on("newGroupMessage", (message: Message) => {
    console.log("📨 newGroupMessage received:", message);
    const { groupMessages } = get();
    
    const senderId = typeof message.senderId === "string" 
      ? message.senderId 
      : message.senderId?._id;
    
    if (senderId === currentUserId) {
      console.log("⏭️  Skipping own message from socket");
      return;
    }
    
    const messageExists = groupMessages.some(m => m._id === message._id);
    if (!messageExists) {
      console.log("✅ Adding new group message to state");
      get().addIncomingGroupMessage(message);
      
      if (message.groupId) {
        get().updateRecentGroup({
          groupId: message.groupId,
          lastMessage: message
        });
      }
    } else {
      console.log("⚠️  Message already exists, skipping");
    }
  });

  // Listen for status updates for YOUR messages
  socket.on("groupMessageStatusUpdate", (data: {
    messageId: string;
    status: Message["status"];
  }) => {
    console.log("🔄 groupMessageStatusUpdate received:", data);
    
    set((state) => {
      const tempMessageIndex = state.groupMessages.findIndex(m => m._id.startsWith('temp-'));
      
      if (tempMessageIndex !== -1) {
        const updatedMessages = [...state.groupMessages];
        updatedMessages[tempMessageIndex] = {
          ...updatedMessages[tempMessageIndex],
          _id: data.messageId,
          status: data.status
        };
        
        console.log("✅ Updated temp group message at index", tempMessageIndex, "→", data.messageId, data.status);
        return { groupMessages: updatedMessages };
      } else {
        const updatedMessages = state.groupMessages.map(m =>
          m._id === data.messageId ? { ...m, status: data.status } : m
        );
        
        console.log("✅ Updated existing group message status:", data.messageId, data.status);
        return { groupMessages: updatedMessages };
      }
    });
  });

  // ⭐ NEW: Listen for bulk status updates when user comes online
  socket.on("bulkGroupMessageStatusUpdate", (data: {
    messageIds: string[];
    status: Message["status"];
  }) => {
    console.log("📦 bulkGroupMessageStatusUpdate received:", data);
    
    // Create the Set BEFORE using it in set()
    const messageIdSet = new Set(data.messageIds);
    
    set((state) => {
      // Update messages
      const updatedMessages = state.groupMessages.map(m =>
        messageIdSet.has(m._id) ? { ...m, status: data.status } : m
      );
      
      // Update recent groups with new status
      const updatedGroups = state.groups.map(group => {
        if (group.lastMessage && messageIdSet.has(group.lastMessage._id)) {
          return {
            ...group,
            lastMessage: {
              ...group.lastMessage,
              status: data.status
            }
          };
        }
        return group;
      });
      
      console.log(`✅ Updated ${data.messageIds.length} group messages to ${data.status}`);
      return { 
        groupMessages: updatedMessages,
        groups: updatedGroups
      };
    });
  });

  // Listen for recent group updates
  socket.on("recentGroupUpdated", (data: {
    groupId: string;
    lastMessage: Message;
  }) => {
    console.log("📬 recentGroupUpdated received:", data);
    get().updateRecentGroup(data);
  });

  // Listen for group message edits from other users
  socket.on("groupMessageEdited", (updatedMessage: Message) => {
    console.log("✏️  groupMessageEdited received:", updatedMessage);
    
    const senderId = typeof updatedMessage.senderId === "string" 
      ? updatedMessage.senderId 
      : updatedMessage.senderId?._id;
    
    if (senderId === currentUserId) {
      console.log("⏭️  Skipping own edit from socket");
      return;
    }
    
    set(state => ({
      groupMessages: state.groupMessages.map(m =>
        m._id === updatedMessage._id ? updatedMessage : m
      )
    }));
  });

  // Listen for group message deletes from other users
  socket.on("groupMessageDeleted", (data: { messageId: string; userId: string }) => {
    console.log("🗑️  groupMessageDeleted received:", data);
    
    if (data.userId === currentUserId) {
      console.log("⏭️  Skipping own delete from socket");
      return;
    }
    
    set(state => ({
      groupMessages: state.groupMessages.filter(m => m._id !== data.messageId)
    }));
  });

  // Listen for group updates
  socket.on("groupUpdated", (updatedGroup: GroupWithPinned) => {
    console.log("🔄 groupUpdated received:", updatedGroup);
    set(state => ({
      groups: state.groups.map(group => 
        group._id === updatedGroup._id ? updatedGroup : group
      ),
      currentGroup: state.currentGroup?._id === updatedGroup._id ? updatedGroup : state.currentGroup
    }));
  });

  // Listen for when user is removed from group
  socket.on("removedFromGroup", (data: { groupId: string }) => {
    console.log("🚫 removedFromGroup received:", data);
    set(state => ({
      groups: state.groups.filter(group => group._id !== data.groupId),
      currentGroup: state.currentGroup?._id === data.groupId ? null : state.currentGroup,
      groupMessages: state.currentGroup?._id === data.groupId ? [] : state.groupMessages
    }));
  });

  // Listen for socket errors
  socket.on("error", (error: { message: string }) => {
    console.error("❌ Socket error:", error);
  });
  
  console.log("✅ Socket listeners initialized for group chat");
},

cleanupGroupSocketListeners: () => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;

  console.log("Cleaning up group socket listeners...");

  socket.off("newGroupMessage");
  socket.off("groupMessageStatusUpdate");
  socket.off("bulkGroupMessageStatusUpdate");
  socket.off("recentGroupUpdated");
  socket.off("groupMessageEdited");
  socket.off("groupMessageDeleted");
  socket.off("groupUpdated");
  socket.off("removedFromGroup");
  socket.off("error");
},

  updateRecentGroup: (data: { groupId: string; lastMessage: Message }) => {
    set(state => {
      const existingGroupIndex = state.groups.findIndex(group => group._id === data.groupId);

      if (existingGroupIndex >= 0) {
        const updatedGroups = [...state.groups];
        const existingGroup = updatedGroups[existingGroupIndex];
        
        const updatedGroup = {
          ...existingGroup,
          lastMessage: data.lastMessage,
          updatedAt: new Date().toISOString()
        };
        updatedGroups[existingGroupIndex] = updatedGroup;

        // Move to top (most recent first)
        const [movedGroup] = updatedGroups.splice(existingGroupIndex, 1);
        updatedGroups.unshift(movedGroup);

        return { groups: updatedGroups };
      }
      
      return state;
    });
  },

  /* ────── Utility Functions ────── */

  setCurrentGroup: (group: GroupWithPinned | null) => {
    set({ currentGroup: group });
  },

  clearGroupMessages: () => {
    set({ groupMessages: [] });
  },
}));