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
  members: User[];
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
  isEvent: true; // Explicit flag for event messages
}

// Union type for all message types
type GroupMessage = Message | GroupEventMessage;

// Helper type guard to check if a message is an event
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

  // Group Management
  getMyGroups: () => Promise<GroupWithPinned[]>;
  getGroupById: (groupId: string) => Promise<GroupWithPinned>;
  createGroup: (data: CreateGroupData) => Promise<GroupWithPinned>;
  updateGroup: (groupId: string, data: UpdateGroupData) => Promise<GroupWithPinned>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  updateGroups: (updatedGroup: GroupWithPinned) => void;
  updateCurrentGroup: (updatedGroup: GroupWithPinned) => void;

  // Member Management
  addMembersToGroup: (groupId: string, members: string[]) => Promise<GroupWithPinned>;
  removeMemberFromGroup: (groupId: string, memberId: string) => Promise<GroupWithPinned>;
  makeGroupAdmin: (groupId: string, userIdToPromote: string) => Promise<GroupWithPinned>;

  // Messages
  getGroupMessages: (groupId: string) => Promise<GroupMessage[]>;
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

  // Group Room Management
  joinGroupRoom: (groupId: string) => void;
  leaveGroupRoom: (groupId: string) => void;

  // Utility
  setCurrentGroup: (group: GroupWithPinned | null) => void;
  clearGroupMessages: () => void;

  // Updated addGroupEventMessage with proper typing
  addGroupEventMessage: (event: BaseGroupEvent) => Promise<GroupEventMessage>;
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
      console.log("Groups:", data);
      
      // Auto-join group rooms for all user's groups
      data.forEach((group: GroupWithPinned) => {
        get().joinGroupRoom(group._id);
      });
      
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
      console.log("Group:", data);
      
      // Join the group room when viewing group details
      get().joinGroupRoom(groupId);
      
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
      
      // Join the room for the newly created group
      get().joinGroupRoom(newGroup._id);
      
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

  updateGroups: (updatedGroup: GroupWithPinned) => {
    if (!updatedGroup || !updatedGroup._id) {
      console.error('🔴 [STORE] Invalid group data for updateGroups:', updatedGroup);
      return;
    }
    
    set((state) => ({
      groups: state.groups.map((group) =>
        group._id === updatedGroup._id ? updatedGroup : group
      )
    }));
    
    console.log('🟢 [STORE] Groups updated for group:', updatedGroup._id);
  },

  updateCurrentGroup: (updatedGroup: GroupWithPinned) => {
    if (!updatedGroup || !updatedGroup._id) {
      console.error('🔴 [STORE] Invalid group data for updateCurrentGroup:', updatedGroup);
      return;
    }
    
    set((state) => ({
      currentGroup: state.currentGroup?._id === updatedGroup._id ? updatedGroup : state.currentGroup
    }));
    
    console.log('🟢 [STORE] Current group updated:', updatedGroup._id);
  },

  leaveGroup: async (groupId: string) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/groups/${groupId}/leave`);
      
      // Leave the group room
      get().leaveGroupRoom(groupId);
      
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
      
      // Leave the group room
      get().leaveGroupRoom(groupId);
      
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
      console.log('🟠 [STORE] addMembersToGroup called:', { groupId, members });
      
      const { data: response } = await axiosInstance.post(
        `/groups/${groupId}/add-members`,
        { members }
      );
      
      console.log('🟠 [STORE] Raw API response:', response);
      
      // Handle different possible response structures
      let updatedGroup;
      if (response._id) {
        // Response is the group object directly
        updatedGroup = response;
      } else if (response.group) {
        // Response has { group: ... } structure
        updatedGroup = response.group;
      } else if (response.data) {
        // Response has { data: ... } structure
        updatedGroup = response.data;
      } else {
        // If no group data in response, fetch the updated group
        console.log('🟠 [STORE] No group data in response, fetching updated group...');
        const { data: freshGroup } = await axiosInstance.get(`/groups/${groupId}`);
        updatedGroup = freshGroup;
      }
      
      if (!updatedGroup || !updatedGroup._id) {
        throw new Error('Invalid group data received from server');
      }
      
      console.log('🟠 [STORE] Processed updated group:', {
        groupId: updatedGroup._id,
        memberCount: updatedGroup.members?.length,
        members: updatedGroup.members
      });
      
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
      }));
      
      console.log('🟠 [STORE] Store updated successfully');
      return updatedGroup;
    } catch (error: any) {
      console.error('🔴 [STORE] Error adding members:', error);
      throw new Error(error?.response?.data?.message || "Error adding members");
    } finally {
      set({ isManagingMembers: false });
    }
  },

  removeMemberFromGroup: async (groupId: string, memberId: string) => {
    set({ isManagingMembers: true });
    try {
      console.log('🟠 [STORE] removeMemberFromGroup called:', { groupId, memberId });
      
      const { data: response } = await axiosInstance.delete(
        `/groups/${groupId}/members/${memberId}`
      );
      
      console.log('🟠 [STORE] Raw API response:', response);
      
      // Extract group data from response
      let updatedGroup;
      if (response._id) {
        // Response is the group object directly
        updatedGroup = response;
      } else if (response.group && response.group._id) {
        // Response has { message: string, group: {...} } structure
        updatedGroup = response.group;
      } else if (response.data && response.data._id) {
        // Response has { data: {...} } structure
        updatedGroup = response.data;
      } else {
        // If no group data in response, fetch the updated group
        console.log('🟠 [STORE] No valid group data in response, fetching updated group...');
        const { data: freshGroup } = await axiosInstance.get(`/groups/${groupId}`);
        updatedGroup = freshGroup;
      }
      
      if (!updatedGroup || !updatedGroup._id) {
        throw new Error('Invalid group data received from server');
      }
      
      console.log('🟠 [STORE] Processed updated group:', {
        groupId: updatedGroup._id,
        memberCount: updatedGroup.members?.length,
        members: updatedGroup.members
      });
      
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
      }));
      
      console.log('🟠 [STORE] Store updated successfully');
      return updatedGroup;
    } catch (error: any) {
      console.error('🔴 [STORE] Error removing member:', error);
      throw new Error(error?.response?.data?.message || "Error removing member");
    } finally {
      set({ isManagingMembers: false });
    }
  },

  makeGroupAdmin: async (groupId: string, userIdToPromote: string) => {
    set({ isManagingMembers: true });
    try {
      console.log('🟠 [STORE] makeGroupAdmin called:', { groupId, userIdToPromote });
      
      const { data: response } = await axiosInstance.post(
        "/groups/make-admin",
        { groupId, userIdToPromote }
      );
      
      console.log('🟠 [STORE] Raw API response:', response);
      
      // Extract group data from response
      let updatedGroup;
      if (response._id) {
        updatedGroup = response;
      } else if (response.group && response.group._id) {
        updatedGroup = response.group;
      } else if (response.data && response.data._id) {
        updatedGroup = response.data;
      } else {
        console.log('🟠 [STORE] No valid group data in response, fetching updated group...');
        const { data: freshGroup } = await axiosInstance.get(`/groups/${groupId}`);
        updatedGroup = freshGroup;
      }
      
      if (!updatedGroup || !updatedGroup._id) {
        throw new Error('Invalid group data received from server');
      }
      
      console.log('🟠 [STORE] Processed updated group:', updatedGroup);
      
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
      }));
      
      return updatedGroup;
    } catch (error: any) {
      console.error('🔴 [STORE] Error promoting user to admin:', error);
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
      
      console.log('📦 [STORE] Loaded messages from backend:', data.length);
      
      // The backend now returns both regular messages and events combined
      // Ensure all event messages have the isEvent flag
      const processedMessages = data.map((message: GroupMessage) => {
        if (isGroupEventMessage(message)) {
          return { ...message, isEvent: true };
        }
        return message;
      });
      
      set({ groupMessages: processedMessages });
      return processedMessages;
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

    const optimisticUpdater = (messages: GroupMessage[]) => {
      if (deleteType === "me") {
        return messages.filter(m => m._id !== messageId);
      } else {
        return messages.map(m => {
          // Only update regular messages, not event messages
          if (!isGroupEventMessage(m) && m._id === messageId) {
            return { 
              ...m, 
              isDeleted: true, 
              text: "You deleted this message",
              image: null
            } as Message;
          }
          return m;
        });
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
      groupMessages: state.groupMessages.map((m) => {
        // Only update regular messages, not event messages
        if (!isGroupEventMessage(m) && m._id === messageId) {
          return { ...m, text, editedAt: new Date().toISOString() } as Message;
        }
        return m;
      }),
    }));

    try {
      const { data: updatedMessage } = await axiosInstance.put(
        `/messages/edit/${messageId}`,
        data
      );
      
      set((state) => ({
        groupMessages: state.groupMessages.map((m) => {
          if (!isGroupEventMessage(m) && m._id === messageId) {
            return updatedMessage as Message;
          }
          return m;
        }),
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

  // In groups.ts - enhance the addGroupEventMessage function
addGroupEventMessage: async (event: BaseGroupEvent): Promise<GroupEventMessage> => {
  try {
    console.log('🟢 [STORE] Saving group event message to backend:', event);
    
    // More aggressive deduplication - check by content and timing
    const existingEvent = get().groupMessages.find((msg: GroupMessage) => {
      if (isGroupEventMessage(msg)) {
        const isSameEvent = msg.type === event.type && 
               msg.targetUserId === event.targetUserId && 
               msg.groupId === event.groupId;
        
        // If same event and created within last 3 seconds, consider it duplicate
        const timeDiff = Date.now() - new Date(msg.createdAt).getTime();
        return isSameEvent && timeDiff < 3000;
      }
      return false;
    });
    
    if (existingEvent && isGroupEventMessage(existingEvent)) {
      console.log('🟡 [STORE] Similar event already exists recently, skipping');
      return existingEvent;
    }
    
    // Save to backend using the new events endpoint
    const { data: savedEvent } = await axiosInstance.post(
      `/groups/${event.groupId}/events`,
      event
    );

    console.log('🟢 [STORE] Event saved to backend:', savedEvent);

    // Ensure the saved event has the correct type
    const processedEvent: GroupEventMessage = {
      ...savedEvent,
      isEvent: true
    };

    // Add to local state with more aggressive deduplication
    set((state) => {
      const alreadyExists = state.groupMessages.some(
        (msg: GroupMessage) => isGroupEventMessage(msg) && msg._id === processedEvent._id
      );
      
      if (alreadyExists) {
        console.log('🟡 [STORE] Event already in state, skipping:', processedEvent._id);
        return state;
      }
      
      console.log('✅ [STORE] Adding new event to state');
      return {
        groupMessages: [...state.groupMessages, processedEvent],
      };
    });

    return processedEvent;
  } catch (error: any) {
    console.error('🔴 [STORE] Error saving event message:', error);
    
    // Only create fallback if absolutely necessary
    console.log('🟡 [STORE] Using fallback client-side event');
    const eventMessage: GroupEventMessage = {
      _id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...event,
      createdAt: new Date().toISOString(),
      isEvent: true,
    };

    set((state) => {
      const alreadyExists = state.groupMessages.some(
        (msg: GroupMessage) => isGroupEventMessage(msg) && msg._id === eventMessage._id
      );
      
      if (alreadyExists) {
        return state;
      }
      
      return {
        groupMessages: [...state.groupMessages, eventMessage],
      };
    });

    return eventMessage;
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
      groupMessages: state.groupMessages.map((m) => {
        // Only update regular messages, not event messages
        if (!isGroupEventMessage(m) && m._id === messageId) {
          return { ...m, status } as Message;
        }
        return m;
      }),
    }));
  },

  /* ────── Group Room Management ────── */

  joinGroupRoom: (groupId: string) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Socket not available for joining group room");
      return;
    }

    console.log("🚀 Joining group room:", groupId);
    socket.emit("groupAdded", { groupId });
  },

  leaveGroupRoom: (groupId: string) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Socket not available for leaving group room");
      return;
    }

    console.log("🚪 Leaving group room:", groupId);
    socket.emit("leaveGroup", { groupId });
  },

  /* ────── Socket Methods ────── */

  initializeGroupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    const currentUserId = useAuthStore.getState().authUser?._id;
    
    if (!socket) {
      console.warn("Socket not available for group chat");
      return;
    }

    console.log("🔌 Initializing socket listeners for group chat...");

    // Handle successful group room joining
    socket.on("joinedGroupRoom", ({ groupId }: { groupId: string }) => {
      console.log("✅ Successfully joined group room:", groupId);
    });

    // Handle group room leaving confirmation
    socket.on("leftGroupRoom", ({ groupId }: { groupId: string }) => {
      console.log("✅ Successfully left group room:", groupId);
    });

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

    // Listen for new group event messages from socket
    socket.on("groupEventCreated", (event: GroupEventMessage) => {
      console.log("📅 groupEventCreated received:", event);
      const { groupMessages } = get();
      
      const eventExists = groupMessages.some(m => m._id === event._id);
      if (!eventExists) {
        console.log("✅ Adding new group event to state");
        set((state) => ({
          groupMessages: [...state.groupMessages, event],
        }));
      } else {
        console.log("⚠️  Event already exists, skipping");
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
          const messageToUpdate = updatedMessages[tempMessageIndex];
          
          // Only update regular messages, not event messages
          if (!isGroupEventMessage(messageToUpdate)) {
            updatedMessages[tempMessageIndex] = {
              ...messageToUpdate,
              _id: data.messageId,
              status: data.status
            } as Message;
            
            console.log("✅ Updated temp group message at index", tempMessageIndex, "→", data.messageId, data.status);
            return { groupMessages: updatedMessages };
          }
        } else {
          const updatedMessages = state.groupMessages.map(m => {
            // Only update regular messages, not event messages
            if (!isGroupEventMessage(m) && m._id === data.messageId) {
              return { ...m, status: data.status } as Message;
            }
            return m;
          });
          
          console.log("✅ Updated existing group message status:", data.messageId, data.status);
          return { groupMessages: updatedMessages };
        }
        
        return state;
      });
    });

    // Listen for bulk status updates when user comes online
    socket.on("bulkGroupMessageStatusUpdate", (data: {
      messageIds: string[];
      status: Message["status"];
    }) => {
      console.log("📦 bulkGroupMessageStatusUpdate received:", data);
      
      const messageIdSet = new Set(data.messageIds);
      
      set((state) => {
        // Update messages
        const updatedMessages = state.groupMessages.map((m) => {
          // Only update regular messages, not event messages
          if (!isGroupEventMessage(m) && messageIdSet.has(m._id)) {
            return { ...m, status: data.status } as Message;
          }
          return m;
        });
        
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

    // Listen for group updates from socket helpers
    socket.on("groupUpdated", ({ group }: { group: GroupWithPinned }) => {
      console.log("🔄 groupUpdated received from socket:", group);
      set(state => ({
        groups: state.groups.map(g => 
          g._id === group._id ? group : g
        ),
        currentGroup: state.currentGroup?._id === group._id ? group : state.currentGroup
      }));
    });

    // Listen for member promotion events
    socket.on("memberPromoted", ({ groupId, newAdminId, admins }: { 
      groupId: string; 
      newAdminId: string; 
      admins: string[];
    }) => {
      console.log("⭐ memberPromoted received:", { groupId, newAdminId, admins });
      
      set(state => ({
        groups: state.groups.map(group => 
          group._id === groupId 
            ? { 
                ...group, 
                admins: admins 
              } 
            : group
        ),
        currentGroup: state.currentGroup?._id === groupId 
          ? { 
              ...state.currentGroup, 
              admins: admins 
            } 
          : state.currentGroup
      }));
    });

    // Listen for member removal events
    socket.on("memberRemoved", ({ groupId, removedMemberId, removedMemberName }: { 
  groupId: string; 
  removedMemberId: string;
  removedMemberName?: string;
}) => {
  console.log("🗑️  memberRemoved received:", { groupId, removedMemberId, removedMemberName });
  
  // Skip if this is the current user's own action (handled by direct call)
  if (removedMemberId === currentUserId) {
    console.log('🟡 Skipping own remove action from socket');
    return;
  }
  
  // If current user was removed, handle accordingly
  if (removedMemberId === currentUserId) {
    console.log("🚫 Current user was removed from group");
    set(state => ({
      groups: state.groups.filter(group => group._id !== groupId),
      currentGroup: state.currentGroup?._id === groupId ? null : state.currentGroup,
      groupMessages: state.currentGroup?._id === groupId ? [] : state.groupMessages
    }));
    
    // Leave the group room
    get().leaveGroupRoom(groupId);
  } else {
    // Another member was removed, update group members list
    set(state => {
      const updateGroupMembers = (group: GroupWithPinned): GroupWithPinned => {
        if (Array.isArray(group.members)) {
          const updatedMembers = group.members.filter(member => {
            if (typeof member === 'string') {
              return member !== removedMemberId;
            } else {
              return member._id !== removedMemberId;
            }
          });
          return { ...group, members: updatedMembers };
        }
        return group;
      };

      return {
        groups: state.groups.map(group => 
          group._id === groupId ? updateGroupMembers(group) : group
        ),
        currentGroup: state.currentGroup?._id === groupId 
          ? updateGroupMembers(state.currentGroup)
          : state.currentGroup
      };
    });
    
    // DON'T create event message here - let the server handle it via groupEventCreated
    console.log('🟡 Skipping event creation in memberRemoved - waiting for groupEventCreated');
  }
});

// Listen for new group event messages from socket - ENHANCE DEDUPLICATION
socket.on("groupEventCreated", (event: GroupEventMessage) => {
  console.log("📅 groupEventCreated received:", event);
  const { groupMessages } = get();
  
  // More aggressive deduplication
  const eventExists = groupMessages.some(m => 
    isGroupEventMessage(m) && 
    m._id === event._id
  );
  
  // Also check for similar events (same type, same target, within short time)
  const similarEventExists = groupMessages.some(m => {
    if (!isGroupEventMessage(m)) return false;
    
    return m.type === event.type && 
           m.targetUserId === event.targetUserId && 
           m.groupId === event.groupId &&
           Math.abs(new Date(m.createdAt).getTime() - new Date(event.createdAt).getTime()) < 5000; // 5 seconds
  });
  
  if (!eventExists && !similarEventExists) {
    console.log("✅ Adding new group event to state");
    set((state) => ({
      groupMessages: [...state.groupMessages, { ...event, isEvent: true }],
    }));
  } else {
    console.log("⚠️  Event already exists or similar event found, skipping");
  }
});

    // Listen for when user is specifically removed from group
    socket.on("youWereRemoved", ({ groupId }: { groupId: string }) => {
      console.log("🚫 youWereRemoved received:", groupId);
      set(state => ({
        groups: state.groups.filter(group => group._id !== groupId),
        currentGroup: state.currentGroup?._id === groupId ? null : state.currentGroup,
        groupMessages: state.currentGroup?._id === groupId ? [] : state.groupMessages
      }));
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
        groupMessages: state.groupMessages.map(m => {
          // Only update regular messages, not event messages
          if (!isGroupEventMessage(m) && m._id === updatedMessage._id) {
            return updatedMessage as Message;
          }
          return m;
        })
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

    // Listen for socket errors
    socket.on("error", (error: { message: string }) => {
      console.error("❌ Socket error:", error);
    });

    console.log("✅ Socket listeners initialized for group chat");
  },

  cleanupGroupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    console.log("🧹 Cleaning up group socket listeners...");

    socket.off("joinedGroupRoom");
    socket.off("leftGroupRoom");
    socket.off("newGroupMessage");
    socket.off("groupEventCreated");
    socket.off("groupMessageStatusUpdate");
    socket.off("bulkGroupMessageStatusUpdate");
    socket.off("groupUpdated");
    socket.off("memberPromoted");
    socket.off("memberRemoved");
    socket.off("youWereRemoved");
    socket.off("recentGroupUpdated");
    socket.off("groupMessageEdited");
    socket.off("groupMessageDeleted");
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

// Export the type guard for use in components
export { isGroupEventMessage };