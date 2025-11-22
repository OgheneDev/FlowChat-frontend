import { Message } from "@/types/types";
import { useAuthStore } from "../auth";
import { useUIStore } from "../ui";
import { normalizeSelectedUserId } from "./utils";

export const createGroupSocketHandlers = (get: any, set: any) => {
  const getCurrentUserId = () => useAuthStore.getState().authUser?._id || null;
  const getSelectedUserId = () => normalizeSelectedUserId(useUIStore.getState().selectedUser);

  const attach = (socket: any) => {
    if (!socket) return;
    const currentUserId = getCurrentUserId();

    socket.on("newGroupMessage", (message: Message & { groupId: string }) => {
      const senderId = typeof message.senderId === "string" 
        ? message.senderId 
        : message.senderId?._id;
      
      // Don't process our own messages
      if (senderId === currentUserId) return;

      const exists = get().groupMessages.some((m: any) => m._id === message._id);
      if (exists || !message.groupId) return;

      const selectedUserId = getSelectedUserId();
      const isInGroupWindow = selectedUserId === message.groupId;

      // Only add to messages array if we're viewing this group
      if (isInGroupWindow) {
        get().addIncomingGroupMessage(message);
        // Mark as seen immediately since we're viewing
        // This will also clear the unread count on the backend
        get().markGroupMessagesAsSeen(message.groupId);
      }

      // NOTE: Don't update unread count here - backend sends it via groupUnreadCountUpdated event
      // Just update the recent group list (without incrementing unread)
      set((state: any) => {
        const idx = state.groups.findIndex((g: any) => g._id === message.groupId);
        if (idx === -1) return state;

        const updated = [...state.groups];
        const group = updated[idx];
        
        updated[idx] = {
          ...group,
          lastMessage: message,
          updatedAt: new Date().toISOString(),
          // Don't touch unreadCount here - backend will send it
        };
        
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
        
        return { groups: updated };
      });
    });

    socket.on("groupUnreadCountUpdated", (data: { groupId: string; unreadCount: number }) => {
      console.log("📬 Group unread count updated:", data);
      
      // Check if we're currently viewing this group
      const selectedUserId = getSelectedUserId();
      const isInGroupWindow = selectedUserId === data.groupId;
      
      // If viewing this group, the count should be 0 (we'll clear it)
      const finalCount = isInGroupWindow ? 0 : data.unreadCount;
      
      // If we're viewing the group, also tell backend to clear
      if (isInGroupWindow && data.unreadCount > 0) {
        get().markGroupMessagesAsSeen(data.groupId);
      }
      
      set((state: any) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [data.groupId]: finalCount,
        },
        groups: state.groups.map((g: any) =>
          g._id === data.groupId ? { ...g, unreadCount: finalCount } : g
        ),
      }));
    });

    socket.on("bulkGroupMessageStatusUpdate", (data: { messageIds: string[]; status: Message["status"] }) => {
      const messageIdSet = new Set(data.messageIds);
      set((state: any) => ({
        groupMessages: state.groupMessages.map((m: any) =>
          !("isEvent" in m && m.isEvent) && messageIdSet.has(m._id) 
            ? { ...m, status: data.status } 
            : m
        ),
        groups: state.groups.map((g: any) =>
          g.lastMessage && messageIdSet.has(g.lastMessage._id)
            ? { ...g, lastMessage: { ...g.lastMessage, status: data.status } }
            : g
        ),
      }));
    });

    socket.on("memberPromoted", ({ groupId, admins }: { groupId: string; admins: any[] }) => {
      set((state: any) => ({
        groups: state.groups.map((g: any) => (g._id === groupId ? { ...g, admins } : g)),
        currentGroup: state.currentGroup?._id === groupId 
          ? { ...state.currentGroup, admins } 
          : state.currentGroup,
      }));
    });

    socket.on("memberRemoved", ({ groupId, removedMemberId }: { groupId: string; removedMemberId: string }) => {
      const current = getCurrentUserId();
      if (removedMemberId === current) {
        set((state: any) => ({
          groups: state.groups.filter((g: any) => g._id !== groupId),
          currentGroup: null,
          groupMessages: [],
        }));
        get().leaveGroupRoom(groupId);
      } else {
        set((state: any) => {
          const updateMembers = (grp: any) => ({
            ...grp,
            members: grp.members.filter((m: any) => 
              typeof m === "string" ? m !== removedMemberId : m._id !== removedMemberId
            ),
          });
          return {
            groups: state.groups.map((g: any) => (g._id === groupId ? updateMembers(g) : g)),
            currentGroup: state.currentGroup?._id === groupId 
              ? updateMembers(state.currentGroup) 
              : state.currentGroup,
          };
        });
      }
    });

    socket.on("recentGroupUpdated", (data: { groupId: string; lastMessage: Message }) => {
      // FIXED: Check if we're viewing this group before updating
      const selectedUserId = getSelectedUserId();
      const isInGroupWindow = selectedUserId === data.groupId;
      
      // If we're viewing the group, also add the message
      if (isInGroupWindow) {
        const messageExists = get().groupMessages.some((m: any) => m._id === data.lastMessage._id);
        if (!messageExists) {
          const senderId = typeof data.lastMessage.senderId === "string" 
            ? data.lastMessage.senderId 
            : data.lastMessage.senderId?._id;
          // Only add if it's not our own message
          if (senderId !== currentUserId) {
            get().addIncomingGroupMessage(data.lastMessage);
          }
        }
      }
      
      get().updateRecentGroup(data);
    });

    socket.on("groupUpdated", ({ group }: { group: any }) => {
      get().updateGroups(group);
    });

    socket.on("groupEventCreated", (event: any) => {
      if (!get().groupMessages.some((m: any) => m._id === event._id)) {
        set((state: any) => ({ 
          groupMessages: [...state.groupMessages, { ...event, isEvent: true }] 
        }));
      }
    });

    socket.on("groupMessageEdited", (msg: Message) => {
      const senderId = typeof msg.senderId === "string" 
        ? msg.senderId 
        : msg.senderId?._id;
      if (senderId !== currentUserId) {
        set((state: any) => ({ 
          groupMessages: state.groupMessages.map((m: any) => 
            !("isEvent" in m && m.isEvent) && m._id === msg._id ? msg : m
          ) 
        }));
      }
    });

    socket.on("groupMessageDeleted", ({ messageId }: { messageId: string }) => {
      set((state: any) => ({ 
        groupMessages: state.groupMessages.filter((m: any) => m._id !== messageId) 
      }));
    });

    socket.on("groupMessagesSeen", (data: { groupId: string; seenBy: string }) => {
      // Update message statuses when someone sees our messages
      const currentUser = getCurrentUserId();
      set((state: any) => {
        const updatedMessages = state.groupMessages.map((msg: any) => {
          if ("isEvent" in msg && msg.isEvent) return msg;
          const sender = typeof msg.senderId === "string" 
            ? msg.senderId 
            : msg.senderId?._id;
          // Update our sent messages to seen
          if (sender === currentUser && msg.status !== "seen") {
            return { ...msg, status: "seen" as const };
          }
          return msg;
        });
        return { groupMessages: updatedMessages };
      });
    });

    socket.on("error", (err: any) => {
      console.error("Socket error (group):", err);
    });
  };

  const detach = (socket: any) => {
    if (!socket) return;
    socket.off("newGroupMessage");
    socket.off("groupUnreadCountUpdated");
    socket.off("bulkGroupMessageStatusUpdate");
    socket.off("memberPromoted");
    socket.off("memberRemoved");
    socket.off("recentGroupUpdated");
    socket.off("groupUpdated");
    socket.off("groupEventCreated");
    socket.off("groupMessageEdited");
    socket.off("groupMessageDeleted");
    socket.off("groupMessagesSeen");
    socket.off("error");
  };

  return { attach, detach };
};