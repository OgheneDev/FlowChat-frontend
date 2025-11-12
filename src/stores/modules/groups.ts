import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { sendMessageData } from "@/types/types";
import { useAuthStore } from "./auth";
import { useUIStore } from "./ui";

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
  members: User[];
  admins: User[] | string[];
  groupImage?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message | null;
  pinnedMessages?: string[];
  unreadCount?: number;
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

interface BaseGroupEvent {
  type: "admin_promoted" | "member_joined" | "member_left" | "member_removed" | "group_created" | "group_updated";
  userId?: string;
  userName?: string;
  targetUserId?: string;
  targetUserName?: string;
  groupId: string;
}

interface GroupEventMessage extends BaseGroupEvent {
  _id: string;
  createdAt: string;
  isEvent: true;
}

type GroupMessage = Message | GroupEventMessage;

const isGroupEventMessage = (message: GroupMessage): message is GroupEventMessage => {
  return 'isEvent' in message && message.isEvent === true;
};

interface GroupState {
  groups: GroupWithPinned[];
  groupMessages: GroupMessage[];
  currentGroup: GroupWithPinned | null;
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;
  isCreatingGroup: boolean;
  isUpdatingGroup: boolean;
  isManagingMembers: boolean;
  unreadCounts: Record<string, number>;

  getMyGroups: () => Promise<GroupWithPinned[]>;
  getGroupById: (groupId: string) => Promise<GroupWithPinned>;
  createGroup: (data: CreateGroupData) => Promise<GroupWithPinned>;
  updateGroup: (groupId: string, data: UpdateGroupData) => Promise<GroupWithPinned>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  updateGroups: (updatedGroup: GroupWithPinned) => void;
  updateCurrentGroup: (updatedGroup: GroupWithPinned) => void;

  addMembersToGroup: (groupId: string, members: string[]) => Promise<GroupWithPinned>;
  removeMemberFromGroup: (groupId: string, memberId: string) => Promise<GroupWithPinned>;
  makeGroupAdmin: (groupId: string, userIdToPromote: string) => Promise<GroupWithPinned>;

  getGroupMessages: (groupId: string) => Promise<GroupMessage[]>;
  sendGroupMessage: (groupId: string, data: sendMessageData) => Promise<Message>;
  deleteMessage: (data: DeleteMessageData) => Promise<void>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<Message>;
  markGroupMessagesAsSeen: (groupId: string) => Promise<void>;
  updateMultipleMessageStatus: (messageIds: string[], status: Message["status"]) => void;

  addIncomingGroupMessage: (msg: Message) => void;
  updateGroupMessageStatus: (messageId: string, status: Message["status"]) => void;
  initializeGroupSocketListeners: () => void;
  cleanupGroupSocketListeners: () => void;
  updateRecentGroup: (data: { groupId: string; lastMessage: Message }) => void;

  joinGroupRoom: (groupId: string) => void;
  leaveGroupRoom: (groupId: string) => void;

  setCurrentGroup: (group: GroupWithPinned | null) => void;
  clearGroupMessages: () => void;

  addGroupEventMessage: (event: BaseGroupEvent) => Promise<GroupEventMessage>;

  getUnreadCount: (groupId: string) => number;
  incrementUnreadCount: (groupId: string) => void;
  clearUnreadCount: (groupId: string) => void;
  calculateUnreadCount: (groupId: string) => number;
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
  unreadCounts: {},

  /* ────── Unread Count Methods ────── */
  calculateUnreadCount: (groupId: string) => {
    const { groupMessages } = get();
    const currentUserId = useAuthStore.getState().authUser?._id;
    if (!currentUserId) return 0;

    return groupMessages.filter(msg => {
      if (isGroupEventMessage(msg)) return false;
      const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
      return senderId !== currentUserId && msg.status !== 'seen';
    }).length;
  },

  getUnreadCount: (groupId: string) => get().unreadCounts[groupId] || 0,

  incrementUnreadCount: (groupId: string) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [groupId]: (state.unreadCounts[groupId] || 0) + 1
      }
    }));
  },

  clearUnreadCount: (groupId: string) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [groupId]: 0
      }
    }));
  },

  /* ────── Group Management ────── */
  getMyGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups/my-groups");
      const currentUserId = useAuthStore.getState().authUser?._id;

      const groupsWithUnread = data.map((group: GroupWithPinned) => ({
        ...group,
        unreadCount: get().calculateUnreadCount(group._id)
      }));

      groupsWithUnread.forEach((group: GroupWithPinned) => get().joinGroupRoom(group._id));
      set({ groups: groupsWithUnread });
      return groupsWithUnread;
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
      get().joinGroupRoom(groupId);
      set({ currentGroup: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching group");
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (data: CreateGroupData) => {
    set({ isCreatingGroup: true });
    try {
      const { data: newGroup } = await axiosInstance.post("/groups", data);
      get().joinGroupRoom(newGroup._id);
      set((state) => ({ groups: [newGroup, ...state.groups] }));
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
      const { data: updatedGroup } = await axiosInstance.put(`/groups/${groupId}`, data);
      set((state) => ({
        groups: state.groups.map(g => g._id === groupId ? updatedGroup : g),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup
      }));
      return updatedGroup;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error updating group");
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  updateGroups: (updatedGroup: GroupWithPinned) => {
    if (!updatedGroup?._id) return;
    set((state) => ({
      groups: state.groups.map(g => g._id === updatedGroup._id ? updatedGroup : g)
    }));
  },

  updateCurrentGroup: (updatedGroup: GroupWithPinned) => {
    if (!updatedGroup?._id) return;
    set((state) => ({
      currentGroup: state.currentGroup?._id === updatedGroup._id ? updatedGroup : state.currentGroup
    }));
  },

  leaveGroup: async (groupId: string) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/groups/${groupId}/leave`);
      get().leaveGroupRoom(groupId);
      set((state) => ({
        groups: state.groups.filter(g => g._id !== groupId),
        currentGroup: state.currentGroup?._id === groupId ? null : state.currentGroup,
        groupMessages: state.currentGroup?._id === groupId ? [] : state.groupMessages
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
      get().leaveGroupRoom(groupId);
      set((state) => ({
        groups: state.groups.filter(g => g._id !== groupId),
        currentGroup: state.currentGroup?._id === groupId ? null : state.currentGroup,
        groupMessages: state.currentGroup?._id === groupId ? [] : state.groupMessages
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
      const { data: response } = await axiosInstance.post(`/groups/${groupId}/add-members`, { members });
      let updatedGroup: GroupWithPinned = response.group || response.data || response;

      if (!updatedGroup?._id) {
        const { data: fresh } = await axiosInstance.get(`/groups/${groupId}`);
        updatedGroup = fresh;
      }

      set((state) => ({
        groups: state.groups.map(g => g._id === groupId ? updatedGroup : g),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup
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
      const { data: response } = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
      let updatedGroup: GroupWithPinned = response.group || response.data || response;

      if (!updatedGroup?._id) {
        const { data: fresh } = await axiosInstance.get(`/groups/${groupId}`);
        updatedGroup = fresh;
      }

      set((state) => ({
        groups: state.groups.map(g => g._id === groupId ? updatedGroup : g),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup
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
      const { data: response } = await axiosInstance.post("/groups/send-admin", { groupId, userIdToPromote });
      let updatedGroup: GroupWithPinned = response.group || response.data || response;

      if (!updatedGroup?._id) {
        const { data: fresh } = await axiosInstance.get(`/groups/${groupId}`);
        updatedGroup = fresh;
      }

      set((state) => ({
        groups: state.groups.map(g => g._id === groupId ? updatedGroup : g),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup
      }));
      return updatedGroup;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error promoting admin");
    } finally {
      set({ isManagingMembers: false });
    }
  },

  /* ────── Messages ────── */
  getGroupMessages: async (groupId: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      const processed = data.map((m: GroupMessage) => isGroupEventMessage(m) ? { ...m, isEvent: true } : m);
      set({ groupMessages: processed });

      const unread = get().calculateUnreadCount(groupId);
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [groupId]: unread }
      }));

      return processed;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error loading messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendGroupMessage: async (groupId: string, data: sendMessageData) => {
    set({ isSendingMessage: true });
    try {
      const { data: msg } = await axiosInstance.post(`/groups/${groupId}/messages`, data);
      set((state) => ({ groupMessages: [...state.groupMessages, msg] }));
      get().updateRecentGroup({ groupId, lastMessage: msg });
      return msg;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error sending message");
    } finally {
      set({ isSendingMessage: false });
    }
  },

  deleteMessage: async (data: DeleteMessageData) => {
    const { messageId, deleteType } = data;
    set({ isDeletingMessage: true });
    set((state) => ({
      groupMessages: deleteType === "me"
        ? state.groupMessages.filter(m => m._id !== messageId)
        : state.groupMessages.map(m =>
            !isGroupEventMessage(m) && m._id === messageId
              ? { ...m, isDeleted: true, text: "You deleted this message", image: null } as Message
              : m
          )
    }));
    try { await axiosInstance.delete("/messages/delete", { data }); }
    catch { set((state) => ({ groupMessages: state.groupMessages })); }
    finally { set({ isDeletingMessage: false }); }
  },

  editMessage: async (messageId: string, data: EditMessageData) => {
    const { text } = data;
    set({ isEditingMessage: true });
    const original = get().groupMessages.find(m => m._id === messageId);
    set((state) => ({
      groupMessages: state.groupMessages.map(m =>
        !isGroupEventMessage(m) && m._id === messageId
          ? { ...m, text, editedAt: new Date().toISOString() } as Message
          : m
      )
    }));
    try {
      const { data: updated } = await axiosInstance.put(`/messages/edit/${messageId}`, data);
      set((state) => ({
        groupMessages: state.groupMessages.map(m =>
          !isGroupEventMessage(m) && m._id === messageId ? updated : m
        )
      }));
      return updated;
    } catch (error: any) {
      if (original) set((state) => ({ groupMessages: state.groupMessages.map(m => m._id === messageId ? original : m) }));
      throw error;
    } finally {
      set({ isEditingMessage: false });
    }
  },

  markGroupMessagesAsSeen: async (groupId: string) => {
    try {
      const { groupMessages } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;
      const unread = groupMessages.filter(m =>
        !isGroupEventMessage(m) &&
        (typeof m.senderId === "string" ? m.senderId : m.senderId?._id) !== currentUserId &&
        m.status !== 'seen'
      );
      if (unread.length === 0) return;

      get().clearUnreadCount(groupId);
      get().updateMultipleMessageStatus(unread.map(m => m._id), 'seen');
      set((state) => ({
        groups: state.groups.map(g => g._id === groupId ? { ...g, unreadCount: 0 } : g)
      }));

      const socket = useAuthStore.getState().socket;
      if (socket) socket.emit("markGroupMessagesAsSeen", { groupId });
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  },

  updateMultipleMessageStatus: (messageIds: string[], status: Message["status"]) => {
    set((state) => ({
      groupMessages: state.groupMessages.map(m =>
        !isGroupEventMessage(m) && messageIds.includes(m._id) ? { ...m, status } as Message : m
      )
    }));
  },

  addGroupEventMessage: async (event: BaseGroupEvent): Promise<GroupEventMessage> => {
    try {
      const existing = get().groupMessages.find(m =>
        isGroupEventMessage(m) &&
        m.type === event.type &&
        m.targetUserId === event.targetUserId &&
        m.groupId === event.groupId &&
        Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 3000
      );
      if (existing) return existing as GroupEventMessage;

      const { data: saved } = await axiosInstance.post(`/groups/${event.groupId}/events`, event);
      const processed: GroupEventMessage = { ...saved, isEvent: true };

      set((state) => {
        if (state.groupMessages.some(m => m._id === processed._id)) return state;
        return { groupMessages: [...state.groupMessages, processed] };
      });
      return processed;
    } catch (error: any) {
      const fallback: GroupEventMessage = {
        _id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event,
        createdAt: new Date().toISOString(),
        isEvent: true,
      };
      set((state) => {
        if (state.groupMessages.some(m => m._id === fallback._id)) return state;
        return { groupMessages: [...state.groupMessages, fallback] };
      });
      return fallback;
    }
  },

  /* ────── Socket Methods ────── */
  addIncomingGroupMessage: (msg: Message) => {
    set((state) => ({ groupMessages: [...state.groupMessages, msg] }));
  },

  updateGroupMessageStatus: (messageId: string, status: Message["status"]) => {
    set((state) => ({
      groupMessages: state.groupMessages.map(m =>
        !isGroupEventMessage(m) && m._id === messageId ? { ...m, status } as Message : m
      )
    }));
  },

  joinGroupRoom: (groupId: string) => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.emit("groupAdded", { groupId });
  },

  leaveGroupRoom: (groupId: string) => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.emit("leaveGroup", { groupId });
  },

  initializeGroupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    const currentUserId = useAuthStore.getState().authUser?._id;
    if (!socket) return;

    socket.on("newGroupMessage", (message: Message) => {
    const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId?._id;
    if (senderId === currentUserId) return;

    const exists = get().groupMessages.some(m => m._id === message._id);
    if (!exists && message.groupId) {
      get().addIncomingGroupMessage(message);

      const { selectedUser } = useUIStore.getState();
      const isInGroupWindow = selectedUser === message.groupId;

      if (!isInGroupWindow) {
        // Increment unread count
        get().incrementUnreadCount(message.groupId);
        
        // Update group in list with unread count
        set(state => ({
          groups: state.groups.map(group => 
            group._id === message.groupId 
              ? { ...group, unreadCount: (group.unreadCount || 0) + 1 }
              : group
          )
        }));
      }

      get().updateRecentGroup({ groupId: message.groupId, lastMessage: message });
    }
  });

  socket.on("groupUnreadCountUpdated", (data: { groupId: string; unreadCount: number }) => {
    set(state => ({
      unreadCounts: {
        ...state.unreadCounts,
        [data.groupId]: data.unreadCount
      },
      groups: state.groups.map(group => 
        group._id === data.groupId 
          ? { ...group, unreadCount: data.unreadCount }
          : group
      )
    }));
  });

    socket.on("bulkGroupMessageStatusUpdate", (data: { messageIds: string[]; status: Message["status"] }) => {
      const messageIdSet = new Set(data.messageIds);
      set((state: GroupState) => ({
        groupMessages: state.groupMessages.map((m: GroupMessage) =>
          !isGroupEventMessage(m) && messageIdSet.has(m._id) ? { ...m, status: data.status } as Message : m
        ),
        groups: state.groups.map((g: GroupWithPinned) =>
          g.lastMessage && messageIdSet.has(g.lastMessage._id)
            ? { ...g, lastMessage: { ...g.lastMessage, status: data.status } }
            : g
        )
      }));
    });

    socket.on("memberPromoted", ({ groupId, admins }: { groupId: string; admins: string[] | User[] }) => {
      set((state: GroupState) => ({
        groups: state.groups.map((g: GroupWithPinned) =>
          g._id === groupId ? { ...g, admins } : g
        ),
        currentGroup: state.currentGroup?._id === groupId
          ? { ...state.currentGroup, admins }
          : state.currentGroup
      }));
    });

    socket.on("memberRemoved", ({ groupId, removedMemberId }: { groupId: string; removedMemberId: string }) => {
      if (removedMemberId === currentUserId) {
        set((state: GroupState) => ({
          groups: state.groups.filter(g => g._id !== groupId),
          currentGroup: null,
          groupMessages: []
        }));
        get().leaveGroupRoom(groupId);
      } else {
        set((state: GroupState) => {
          const updateMembers = (group: GroupWithPinned): GroupWithPinned => ({
            ...group,
            members: group.members.filter(m =>
              typeof m === 'string' ? m !== removedMemberId : m._id !== removedMemberId
            )
          });

          return {
            groups: state.groups.map(g => g._id === groupId ? updateMembers(g) : g),
            currentGroup: state.currentGroup?._id === groupId ? updateMembers(state.currentGroup!) : state.currentGroup
          };
        });
      }
    });

    // ... other listeners (unchanged)
    socket.on("recentGroupUpdated", (data) => get().updateRecentGroup(data));
    socket.on("groupUpdated", ({ group }) => get().updateGroups(group));
    socket.on("groupEventCreated", (event: GroupEventMessage) => {
      if (!get().groupMessages.some(m => m._id === event._id)) {
        set((state) => ({ groupMessages: [...state.groupMessages, { ...event, isEvent: true }] }));
      }
    });
    socket.on("groupMessageEdited", (msg: Message) => {
      const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
      if (senderId !== currentUserId) {
        set((state) => ({
          groupMessages: state.groupMessages.map(m =>
            !isGroupEventMessage(m) && m._id === msg._id ? msg : m
          )
        }));
      }
    });
    socket.on("groupMessageDeleted", ({ messageId }) => {
      set((state) => ({ groupMessages: state.groupMessages.filter(m => m._id !== messageId) }));
    });
  },

  cleanupGroupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    const events = ["newGroupMessage", "bulkGroupMessageStatusUpdate", "memberPromoted", "memberRemoved", "recentGroupUpdated", "groupUpdated", "groupEventCreated", "groupMessageEdited", "groupMessageDeleted"];
    events.forEach(e => socket.off(e));
  },

  updateRecentGroup: (data: { groupId: string; lastMessage: Message }) => {
    set((state) => {
      const idx = state.groups.findIndex(g => g._id === data.groupId);
      if (idx === -1) return state;

      const { selectedUser } = useUIStore.getState();
      const isInGroupWindow = selectedUser === data.groupId;
      const senderId = typeof data.lastMessage.senderId === "string" ? data.lastMessage.senderId : data.lastMessage.senderId?._id;
      const isFromOther = senderId !== useAuthStore.getState().authUser?._id;

      const updated = [...state.groups];
      const group = updated[idx];
      updated[idx] = {
        ...group,
        lastMessage: data.lastMessage,
        updatedAt: new Date().toISOString(),
        unreadCount: isFromOther && !isInGroupWindow ? (group.unreadCount || 0) + 1 : group.unreadCount
      };
      const [moved] = updated.splice(idx, 1);
      updated.unshift(moved);
      return { groups: updated };
    });
  },

  setCurrentGroup: (group) => set({ currentGroup: group }),
  clearGroupMessages: () => set({ groupMessages: [] }),
}));

export { isGroupEventMessage };