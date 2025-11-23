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

    // ✅ NEW GROUP MESSAGE HANDLER - Matches private chat pattern
    socket.on("newGroupMessage", (message: Message & { groupId: string }) => {
      const senderId = typeof message.senderId === "string" 
        ? message.senderId 
        : message.senderId?._id;
      
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📩 [GROUP SOCKET] newGroupMessage received");
      console.log("📩 [GROUP SOCKET] Message ID:", message._id);
      console.log("📩 [GROUP SOCKET] Sender ID:", senderId);
      console.log("📩 [GROUP SOCKET] Group ID:", message.groupId);
      console.log("📩 [GROUP SOCKET] Current User ID:", currentUserId);
      console.log("📩 [GROUP SOCKET] Selected User ID:", getSelectedUserId());
      
      // Don't process our own messages
      if (senderId === currentUserId) {
        console.log("📩 [GROUP SOCKET] Skipping - own message");
        return;
      }

      const exists = get().groupMessages.some((m: any) => m._id === message._id);
      if (exists || !message.groupId) {
        console.log("📩 [GROUP SOCKET] Skipping - message exists or no groupId");
        return;
      }

      const selectedUserId = getSelectedUserId();
      const isInGroupWindow = selectedUserId === message.groupId;

      console.log("📩 [GROUP SOCKET] Is viewing this group:", isInGroupWindow);

      // Only add to messages if we're viewing this group
      if (isInGroupWindow) {
        console.log("📩 [GROUP SOCKET] Adding message and marking as seen");
        get().addIncomingGroupMessage(message);
        get().markGroupMessagesAsSeen(message.groupId);
      } else {
        console.log("📩 [GROUP SOCKET] NOT viewing group - NOT adding message locally");
      }

      // Update recent group list (without touching unread - backend will send it)
      set((state: any) => {
        const idx = state.groups.findIndex((g: any) => g._id === message.groupId);
        if (idx === -1) return state;

        const updated = [...state.groups];
        const group = updated[idx];
        
        console.log("📩 [GROUP SOCKET] Updating recent group, current unread:", group.unreadCount);
        
        updated[idx] = {
          ...group,
          lastMessage: message,
          updatedAt: new Date().toISOString(),
          // ⚠️ NOT touching unreadCount here - backend will send it via groupUnreadCountUpdated
        };
        
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
        
        return { groups: updated };
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    // ✅ UNREAD COUNT UPDATE FROM BACKEND
    socket.on("groupUnreadCountUpdated", (data: { groupId: string; unreadCount: number }) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📬 [GROUP SOCKET] groupUnreadCountUpdated received");
      console.log("📬 [GROUP SOCKET] Group ID:", data.groupId);
      console.log("📬 [GROUP SOCKET] Unread Count from backend:", data.unreadCount);
      
      // Simply set what the backend tells us - don't override based on current view
      // The ChatWindow component already handles clearing when opening a chat
      set((state: any) => {
        console.log("📬 [GROUP SOCKET] Setting unread count to:", data.unreadCount);
        return {
          unreadCounts: {
            ...state.unreadCounts,
            [data.groupId]: data.unreadCount,
          },
          groups: state.groups.map((g: any) =>
            g._id === data.groupId ? { ...g, unreadCount: data.unreadCount } : g
          ),
        };
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    // ✅ RECENT GROUP UPDATED - Matches private chat pattern
    socket.on("recentGroupUpdated", (data: { groupId: string; lastMessage: Message }) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔄 [GROUP SOCKET] recentGroupUpdated received");
      console.log("🔄 [GROUP SOCKET] Group ID:", data.groupId);
      console.log("🔄 [GROUP SOCKET] Selected User ID:", getSelectedUserId());
      
      const selectedUserId = getSelectedUserId();
      const isInGroupWindow = selectedUserId === data.groupId;
      
      console.log("🔄 [GROUP SOCKET] Is viewing this group:", isInGroupWindow);
      
      // If viewing the group, add the message if it doesn't exist
      if (isInGroupWindow) {
        const messageExists = get().groupMessages.some((m: any) => m._id === data.lastMessage._id);
        const senderId = typeof data.lastMessage.senderId === "string" 
          ? data.lastMessage.senderId 
          : data.lastMessage.senderId?._id;
        
        console.log("🔄 [GROUP SOCKET] Message exists:", messageExists);
        console.log("🔄 [GROUP SOCKET] Is own message:", senderId === currentUserId);
        
        if (!messageExists && senderId !== currentUserId) {
          console.log("🔄 [GROUP SOCKET] Adding incoming message from recentGroupUpdated");
          get().addIncomingGroupMessage(data.lastMessage);
        }
      }
      
      // Update recent group (without modifying unread count)
      set((state: any) => {
        const idx = state.groups.findIndex((g: any) => g._id === data.groupId);
        if (idx === -1) return state;

        const updated = [...state.groups];
        const existingGroup = updated[idx];
        
        console.log("🔄 [GROUP SOCKET] Existing group unreadCount:", existingGroup.unreadCount);
        console.log("🔄 [GROUP SOCKET] NOT modifying unreadCount in recentGroupUpdated");
        
        updated[idx] = {
          ...existingGroup,
          lastMessage: data.lastMessage,
          updatedAt: new Date().toISOString(),
          // ⚠️ NOT touching unreadCount - backend handles this
        };
        
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
        
        return { groups: updated };
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    // Rest of handlers remain the same
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
      const currentUser = getCurrentUserId();
      set((state: any) => {
        const updatedMessages = state.groupMessages.map((msg: any) => {
          if ("isEvent" in msg && msg.isEvent) return msg;
          const sender = typeof msg.senderId === "string" 
            ? msg.senderId 
            : msg.senderId?._id;
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