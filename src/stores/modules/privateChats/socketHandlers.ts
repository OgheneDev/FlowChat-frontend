import { Message } from "@/types/types";
import { useAuthStore } from "../auth";
import { useUIStore } from "../ui";
import { normalizeSelectedUserId } from "./utils";

export const createPrivateSocketHandlers = (get: any, set: any) => {
  const getCurrentUserId = () => useAuthStore.getState().authUser?._id || null;
  const getSelectedUserId = () => normalizeSelectedUserId(useUIStore.getState().selectedUser);

  const attach = (socket: any) => {
    if (!socket) return;
    const currentUserId = getCurrentUserId();

    // ✅ NEW MESSAGE HANDLER
    socket.on("newMessage", (message: Message) => {
      const senderId = typeof message.senderId === "string" 
        ? message.senderId 
        : message.senderId?._id;
      
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📩 [SOCKET] newMessage received");
      console.log("📩 [SOCKET] Message ID:", message._id);
      console.log("📩 [SOCKET] Sender ID:", senderId);
      console.log("📩 [SOCKET] Current User ID:", currentUserId);
      console.log("📩 [SOCKET] Selected User ID:", getSelectedUserId());
      
      // Don't process our own messages
      if (senderId === currentUserId) {
        console.log("📩 [SOCKET] Skipping - own message");
        return;
      }

      const messageExists = get().privateMessages.some((m: any) => m._id === message._id);
      if (messageExists) {
        console.log("📩 [SOCKET] Skipping - message already exists");
        return;
      }

      const partnerId = senderId;
      const selectedUserId = getSelectedUserId();
      const isInChatWindow = selectedUserId === partnerId;
      
      console.log("📩 [SOCKET] Partner ID:", partnerId);
      console.log("📩 [SOCKET] Is viewing this chat:", isInChatWindow);

      if (isInChatWindow) {
        console.log("📩 [SOCKET] Adding message and marking as seen");
        get().addIncomingMessage(message);
        get().markMessagesAsSeen(partnerId);
      } else {
        console.log("📩 [SOCKET] NOT viewing chat - NOT adding message locally");
      }
      
      // Update recent chat list (without touching unread)
      set((state: any) => {
        const existingChatIndex = state.chats.findIndex((chat: any) =>
          (chat.participants && chat.participants.includes(partnerId)) || 
          chat._id === partnerId
        );

        if (existingChatIndex >= 0) {
          const updatedChats = [...state.chats];
          const existingChat = updatedChats[existingChatIndex];
          
          console.log("📩 [SOCKET] Updating recent chat, current unread:", existingChat.unreadCount);
          
          updatedChats[existingChatIndex] = {
            ...existingChat,
            lastMessage: message,
            updatedAt: new Date().toISOString(),
            // ⚠️ NOT touching unreadCount here
          };

          const [movedChat] = updatedChats.splice(existingChatIndex, 1);
          updatedChats.unshift(movedChat);

          return { chats: updatedChats };
        }
        return state;
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    // ✅ UNREAD COUNT UPDATE FROM BACKEND
    socket.on("unreadCountUpdated", (data: { chatId: string; unreadCount: number }) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📬 [SOCKET] unreadCountUpdated received");
      console.log("📬 [SOCKET] Chat ID:", data.chatId);
      console.log("📬 [SOCKET] Unread Count from backend:", data.unreadCount);
      console.log("📬 [SOCKET] Selected User ID:", getSelectedUserId());
      
      const selectedUserId = getSelectedUserId();
      const isInChatWindow = selectedUserId === data.chatId;
      
      console.log("📬 [SOCKET] Is viewing this chat:", isInChatWindow);
      
      // If viewing this chat, the count should be 0
      const finalCount = isInChatWindow ? 0 : data.unreadCount;
      
      console.log("📬 [SOCKET] Final count to set:", finalCount);
      
      // If we're viewing the chat but got a non-zero count, tell backend to clear
      if (isInChatWindow && data.unreadCount > 0) {
        console.log("📬 [SOCKET] Viewing chat with unread > 0, calling markMessagesAsSeen");
        get().markMessagesAsSeen(data.chatId);
      }
      
      set((state: any) => {
        console.log("📬 [SOCKET] Current unreadCounts state:", state.unreadCounts);
        return {
          unreadCounts: {
            ...state.unreadCounts,
            [data.chatId]: finalCount,
          },
          chats: state.chats.map((chat: any) => {
            const currentUser = getCurrentUserId();
            const chatPartnerId = chat.participants?.find((p: string) => p !== currentUser) || chat._id;
            if (chatPartnerId === data.chatId) {
              console.log("📬 [SOCKET] Updating chat unreadCount from", chat.unreadCount, "to", finalCount);
              return { ...chat, unreadCount: finalCount };
            }
            return chat;
          }),
        };
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    // ✅ RECENT CHAT UPDATED
    socket.on("recentChatUpdated", (data: { partnerId: string; lastMessage: Message }) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔄 [SOCKET] recentChatUpdated received");
      console.log("🔄 [SOCKET] Partner ID:", data.partnerId);
      console.log("🔄 [SOCKET] Selected User ID:", getSelectedUserId());
      
      const selectedUserId = getSelectedUserId();
      const isInChatWindow = selectedUserId === data.partnerId;
      
      console.log("🔄 [SOCKET] Is viewing this chat:", isInChatWindow);
      
      if (isInChatWindow) {
        const messageExists = get().privateMessages.some((m: any) => m._id === data.lastMessage._id);
        const senderId = typeof data.lastMessage.senderId === "string" 
          ? data.lastMessage.senderId 
          : data.lastMessage.senderId?._id;
        
        console.log("🔄 [SOCKET] Message exists:", messageExists);
        console.log("🔄 [SOCKET] Is own message:", senderId === currentUserId);
        
        if (!messageExists && senderId !== currentUserId) {
          console.log("🔄 [SOCKET] Adding incoming message from recentChatUpdated");
          get().addIncomingMessage(data.lastMessage);
        }
      }
      
      // Update recent chat (without modifying unread count)
      set((state: any) => {
        const existingChatIndex = state.chats.findIndex((chat: any) =>
          (chat.participants && chat.participants.includes(data.partnerId)) || 
          chat._id === data.partnerId
        );

        if (existingChatIndex >= 0) {
          const updatedChats = [...state.chats];
          const existingChat = updatedChats[existingChatIndex];
          
          console.log("🔄 [SOCKET] Existing chat unreadCount:", existingChat.unreadCount);
          console.log("🔄 [SOCKET] NOT modifying unreadCount in recentChatUpdated");
          
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            lastMessage: data.lastMessage,
            updatedAt: new Date().toISOString(),
            // ⚠️ NOT touching unreadCount
          };
          const [movedChat] = updatedChats.splice(existingChatIndex, 1);
          updatedChats.unshift(movedChat);
          return { chats: updatedChats };
        }
        return state;
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    // Rest of handlers...
    socket.on("messageStatusUpdate", (data: { messageId: string; status: Message["status"] }) => {
      set((state: any) => {
        const tempMessageIndex = state.privateMessages.findIndex((m: any) => m._id.startsWith("temp-"));
        if (tempMessageIndex !== -1) {
          const updatedMessages = [...state.privateMessages];
          updatedMessages[tempMessageIndex] = {
            ...updatedMessages[tempMessageIndex],
            _id: data.messageId,
            status: data.status,
          };
          return { privateMessages: updatedMessages };
        } else {
          const updatedMessages = state.privateMessages.map((m: any) =>
            m._id === data.messageId ? { ...m, status: data.status } : m
          );
          return { privateMessages: updatedMessages };
        }
      });
    });

    socket.on("bulkMessageStatusUpdate", (data: { messageIds: string[]; status: Message["status"] }) => {
      const messageIdSet = new Set(data.messageIds);
      set((state: any) => {
        const updatedMessages = state.privateMessages.map((m: any) =>
          messageIdSet.has(m._id) ? { ...m, status: data.status } : m
        );
        const updatedChats = state.chats.map((chat: any) => {
          if (chat.lastMessage && messageIdSet.has(chat.lastMessage._id)) {
            return {
              ...chat,
              lastMessage: { ...chat.lastMessage, status: data.status },
            };
          }
          return chat;
        });
        return { privateMessages: updatedMessages, chats: updatedChats };
      });
    });

    socket.on("messageEdited", (updatedMessage: Message) => {
      const senderId = typeof updatedMessage.senderId === "string" 
        ? updatedMessage.senderId 
        : updatedMessage.senderId?._id;
      if (senderId === currentUserId) return;
      set((state: any) => ({
        privateMessages: state.privateMessages.map((m: any) => 
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      }));
    });

    socket.on("messageDeleted", (data: { messageId: string }) => {
      set((state: any) => ({ 
        privateMessages: state.privateMessages.filter((m: any) => m._id !== data.messageId) 
      }));
    });

    socket.on("messagesSeen", (data: { seenBy: string; senderId: string }) => {
      const currentUser = getCurrentUserId();
      if (data.senderId === currentUser) {
        set((state: any) => {
          const updatedMessages = state.privateMessages.map((msg: any) => {
            const sender = typeof msg.senderId === "string" 
              ? msg.senderId 
              : msg.senderId?._id;
            if (sender === currentUser && msg.status !== "seen") {
              return { ...msg, status: "seen" as const };
            }
            return msg;
          });
          const updatedChats = state.chats.map((chat: any) => {
            if (chat.lastMessage) {
              const lastMsgSenderId = typeof chat.lastMessage.senderId === "string" 
                ? chat.lastMessage.senderId 
                : chat.lastMessage.senderId?._id;
              const isPartnerInChat = chat.participants?.includes(data.seenBy) || chat._id === data.seenBy;
              if (lastMsgSenderId === currentUser && isPartnerInChat && chat.lastMessage.status !== "seen") {
                return { ...chat, lastMessage: { ...chat.lastMessage, status: "seen" as const } };
              }
            }
            return chat;
          });
          return { privateMessages: updatedMessages, chats: updatedChats };
        });
      }
    });

    socket.on("error", (err: { message: string }) => {
      console.error("Socket error (private):", err);
    });
  };

  const detach = (socket: any) => {
    if (!socket) return;
    socket.off("newMessage");
    socket.off("unreadCountUpdated");
    socket.off("messageStatusUpdate");
    socket.off("bulkMessageStatusUpdate");
    socket.off("recentChatUpdated");
    socket.off("messageEdited");
    socket.off("messageDeleted");
    socket.off("messagesSeen");
    socket.off("error");
  };

  return { attach, detach };
};