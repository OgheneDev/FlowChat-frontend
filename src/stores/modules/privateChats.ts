import { axiosInstance } from "@/api/axios";
import { sendMessageData, Message } from "@/types/types";
import { create } from "zustand";
import { useAuthStore } from "./auth";
import { useUIStore } from "./ui";

interface DeleteMessageData {
  messageId: string;
  deleteType: "everyone" | "me";
}

interface EditMessageData {
  text: string; 
}

interface ChatWithPinned {
  _id: string;
  participants: string[];
  participantDetails?: Array<{
    _id: string;
    fullName: string;
    profilePic?: string;
  }>;
  pinnedMessages: string[];
  fullName?: string;
  profilePic?: string;
  lastMessage?: Message;
  updatedAt?: string;
  unreadCount?: number;
}

interface PrivateChatState {
  chats: ChatWithPinned[];
  privateMessages: Message[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  isDeletingMessage: boolean;
  isEditingMessage: boolean;
  unreadCounts: Record<string, number>;

  // Core chat methods
  getChatPartners: () => Promise<ChatWithPinned[]>;
  getPrivateMessages: (id: string) => Promise<Message[]>;
  sendPrivateMessage: (id: string, data: sendMessageData) => Promise<Message>;
  deleteMessage: (data: DeleteMessageData) => Promise<void>;
  editMessage: (messageId: string, data: EditMessageData) => Promise<Message>;
  addIncomingMessage: (msg: Message) => void;
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;
  markMessagesAsSeen: (chatPartnerId: string) => Promise<void>;
  getUnreadCount: (chatPartnerId: string) => number;
  incrementUnreadCount: (chatPartnerId: string) => void;
  clearUnreadCount: (chatPartnerId: string) => void;
  calculateUnreadCount: (chatPartnerId: string) => number;

  // Socket methods
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  updateRecentChat: (data: {
    partnerId: string;
    lastMessage: Message;
  }) => void;
}

export const usePrivateChatStore = create<PrivateChatState>((set, get) => ({
  chats: [],
  privateMessages: [],
  isLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  isDeletingMessage: false, 
  isEditingMessage: false,
  unreadCounts: {},

  getChatPartners: async () => {
  set({ isLoading: true });
  try {
    const { data } = await axiosInstance.get("/messages/chats");
    
    const currentUserId = useAuthStore.getState().authUser?._id;
    const chatsWithUnread = data.map((chat: ChatWithPinned) => {
      const partnerId = chat.participants?.find(p => p !== currentUserId) || chat._id;
      const unreadCount = get().calculateUnreadCount(partnerId);
      
      // Initialize the unreadCounts state
      set(state => ({
        unreadCounts: {
          ...state.unreadCounts,
          [partnerId]: unreadCount
        }
      }));
      
      return {
        ...chat,
        unreadCount
      };
    });
    
    set({ chats: chatsWithUnread });
    return chatsWithUnread;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Error fetching chats");
  } finally {
    set({ isLoading: false });
  }
},

  getPrivateMessages: async (id: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await axiosInstance.get(`/messages/${id}`);
      console.log("Messages:", data);
      set({ privateMessages: data });
      
      const unreadCount = get().calculateUnreadCount(id);
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [id]: unreadCount
        }
      }));
      
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendPrivateMessage: async (id: string, data: sendMessageData) => {
    set({ isSendingMessage: true });
    try {
      const { data: newMessage } = await axiosInstance.post(`/messages/send/${id}`, data);
      
      set((state) => ({
        privateMessages: [...state.privateMessages, newMessage],
      }));

      get().updateRecentChat({
        partnerId: id,
        lastMessage: newMessage
      });

      return newMessage;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error sending message");
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
      privateMessages: optimisticUpdater(state.privateMessages), 
    }));

    try {
      await axiosInstance.delete("/messages/delete", { data });
    } catch (error: any) {
      set((state) => ({ privateMessages: state.privateMessages }));
      throw error;
    } finally {
      set({ isDeletingMessage: false });
    }
  },

  editMessage: async (messageId: string, data: EditMessageData) => {
    const { text } = data;
    set({ isEditingMessage: true });

    const originalMessage = get().privateMessages.find(m => m._id === messageId);
    
    set((state) => ({
      privateMessages: state.privateMessages.map((m) =>
        m._id === messageId ? { ...m, text, editedAt: new Date().toISOString() } : m
      ),
    }));
    
    try {
      const { data: updatedMessage } = await axiosInstance.put(`/messages/edit/${messageId}`, data);
      
      set((state) => ({
        privateMessages: state.privateMessages.map((m) =>
          m._id === messageId ? updatedMessage : m
        ),
      }));

      return updatedMessage;
    } catch (error: any) {
      if (originalMessage) {
        set((state) => ({ 
          privateMessages: state.privateMessages.map((m) =>
            m._id === messageId ? originalMessage : m
          )
        }));
      }
      throw error;
    } finally {
      set({ isEditingMessage: false });
    }
  },

  addIncomingMessage: (msg: Message) => {
    set((state) => ({
      privateMessages: [...state.privateMessages, msg],
    }));
  },

  updateMessageStatus: (messageId: string, status: Message["status"]) => {
    set((state) => ({
      privateMessages: state.privateMessages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
    }));
  },

  calculateUnreadCount: (chatPartnerId: string) => {
    const { privateMessages } = get();
    const currentUserId = useAuthStore.getState().authUser?._id;
    
    if (!currentUserId) return 0;
    
    const unreadMessages = privateMessages.filter(msg => {
      const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
      const receiverId = typeof msg.receiverId === "string" ? msg.receiverId : msg.receiverId?._id;
      
      return senderId === chatPartnerId && 
             receiverId === currentUserId && 
             msg.status !== 'seen';
    });
    
    return unreadMessages.length;
  },

  getUnreadCount: (chatPartnerId: string) => {
    return get().unreadCounts[chatPartnerId] || 0;
  },

  incrementUnreadCount: (chatPartnerId: string) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatPartnerId]: (state.unreadCounts[chatPartnerId] || 0) + 1
      }
    }));
  },

  clearUnreadCount: (chatPartnerId: string) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatPartnerId]: 0
      }
    }));
  },

  markMessagesAsSeen: async (chatPartnerId: string) => {
    try {
      const { privateMessages } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      const unreadMessages = privateMessages.filter(msg => {
        const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
        return senderId !== currentUserId && msg.status !== 'seen';
      });

      if (unreadMessages.length === 0) return;

      get().clearUnreadCount(chatPartnerId);

      set(state => ({
        privateMessages: state.privateMessages.map(msg => {
          const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
          if (senderId !== currentUserId && msg.status !== 'seen') {
            return { ...msg, status: 'seen' as const };
          }
          return msg;
        }),
        chats: state.chats.map(chat => {
          const partnerId = chat.participants?.find(p => p !== currentUserId) || chat._id;
          if (partnerId === chatPartnerId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        })
      }));

      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("markMessagesAsSeen", { senderId: chatPartnerId });
      }
      
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  },

  initializeSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    const currentUserId = useAuthStore.getState().authUser?._id;
    
    if (!socket) {
      console.warn("Socket not available - user might not be authenticated");
      return;
    }

    console.log("Initializing socket listeners for private chat...");

   socket.on("newMessage", (message: Message) => {
    const senderId = typeof message.senderId === "string" 
      ? message.senderId 
      : message.senderId?._id;
    
    if (senderId === currentUserId) return;

    const messageExists = get().privateMessages.some(m => m._id === message._id);
    if (!messageExists) {
      get().addIncomingMessage(message);
      
      const partnerId = senderId;
      const { selectedUser } = useUIStore.getState();
      const isInChatWindow = selectedUser === partnerId;
      
      if (!isInChatWindow) {
        // Increment unread count for this chat
        get().incrementUnreadCount(partnerId);
        
        // Also update the chat in the list with unread count
        set(state => ({
          chats: state.chats.map(chat => {
            const chatPartnerId = chat.participants?.find(p => p !== currentUserId) || chat._id;
            if (chatPartnerId === partnerId) {
              return {
                ...chat,
                unreadCount: (chat.unreadCount || 0) + 1
              };
            }
            return chat;
          })
        }));
      }
      
      get().updateRecentChat({
        partnerId: partnerId,
        lastMessage: message
      });
    }
  });

  socket.on("unreadCountUpdated", (data: { chatId: string; unreadCount: number }) => {
    set(state => ({
      unreadCounts: {
        ...state.unreadCounts,
        [data.chatId]: data.unreadCount
      },
      chats: state.chats.map(chat => {
        const chatPartnerId = chat.participants?.find(p => p !== currentUserId) || chat._id;
        if (chatPartnerId === data.chatId) {
          return { ...chat, unreadCount: data.unreadCount };
        }
        return chat;
      })
    }));
  });

    socket.on("messageStatusUpdate", (data: {
      messageId: string;
      status: Message["status"];
    }) => {
      console.log("messageStatusUpdate received:", data);
      
      set((state) => {
        const tempMessageIndex = state.privateMessages.findIndex(m => m._id.startsWith('temp-'));
        
        if (tempMessageIndex !== -1) {
          const updatedMessages = [...state.privateMessages];
          updatedMessages[tempMessageIndex] = {
            ...updatedMessages[tempMessageIndex],
            _id: data.messageId,
            status: data.status
          };
          
          return { privateMessages: updatedMessages };
        } else {
          const updatedMessages = state.privateMessages.map(m =>
            m._id === data.messageId ? { ...m, status: data.status } : m
          );
          
          return { privateMessages: updatedMessages };
        }
      });
    });

    socket.on("bulkMessageStatusUpdate", (data: {
      messageIds: string[];
      status: Message["status"];
    }) => {
      console.log("bulkMessageStatusUpdate received:", data);
      
      const messageIdSet = new Set(data.messageIds);
      
      set((state) => {
        const updatedMessages = state.privateMessages.map(m =>
          messageIdSet.has(m._id) ? { ...m, status: data.status } : m
        );
        
        const updatedChats = state.chats.map(chat => {
          if (chat.lastMessage && messageIdSet.has(chat.lastMessage._id)) {
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                status: data.status
              }
            };
          }
          return chat;
        });
        
        return { 
          privateMessages: updatedMessages,
          chats: updatedChats
        };
      });
    });

    socket.on("recentChatUpdated", (data: {
      partnerId: string;
      lastMessage: Message;
    }) => {
      console.log("recentChatUpdated received:", data);
      get().updateRecentChat(data);
    });

    socket.on("messageEdited", (updatedMessage: Message) => {
      console.log("messageEdited received:", updatedMessage);
      
      const senderId = typeof updatedMessage.senderId === "string" 
        ? updatedMessage.senderId 
        : updatedMessage.senderId?._id;
      
      if (senderId === currentUserId) {
        console.log("Skipping own edit from socket");
        return;
      }
      
      set(state => ({
        privateMessages: state.privateMessages.map(m =>
          m._id === updatedMessage._id ? updatedMessage : m
        )
      }));
    });

    socket.on("messageDeleted", (data: { messageId: string }) => {
      console.log("messageDeleted received:", data);
      set(state => ({
        privateMessages: state.privateMessages.filter(m => m._id !== data.messageId)
      }));
    });

    socket.on("messagesSeen", (data: { seenBy: string; senderId: string }) => {
      console.log("Messages seen by user:", data.seenBy);
      
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      if (data.senderId === currentUserId) {
        set((state) => {
          const updatedMessages = state.privateMessages.map(msg => {
            const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
            if (senderId === currentUserId && msg.status !== 'seen') {
              return { ...msg, status: 'seen' as const };
            }
            return msg;
          });

          const updatedChats = state.chats.map(chat => {
            if (chat.lastMessage) {
              const lastMsgSenderId = typeof chat.lastMessage.senderId === "string" 
                ? chat.lastMessage.senderId 
                : chat.lastMessage.senderId?._id;
              
              const isPartnerInChat = chat.participants?.includes(data.seenBy) || chat._id === data.seenBy;
              
              if (lastMsgSenderId === currentUserId && isPartnerInChat && chat.lastMessage.status !== 'seen') {
                return {
                  ...chat,
                  lastMessage: {
                    ...chat.lastMessage,
                    status: 'seen' as const
                  }
                };
              }
            }
            return chat;
          });

          return { 
            privateMessages: updatedMessages,
            chats: updatedChats
          };
        });
      }
    });

    socket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
    });
    
    console.log("Socket listeners initialized for private chat");
  },

  cleanupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    console.log("Cleaning up socket listeners...");
    socket.off("newMessage");
    socket.off("messageStatusUpdate");
    socket.off("bulkMessageStatusUpdate");
    socket.off("recentChatUpdated");
    socket.off("messageEdited");
    socket.off("messageDeleted");
    socket.off("error");
  },

  updateRecentChat: (data: { partnerId: string; lastMessage: Message }) => {
    set(state => {
      const currentUserId = useAuthStore.getState().authUser?._id;
      const existingChatIndex = state.chats.findIndex(chat =>
        chat.participants && chat.participants.includes(data.partnerId) ||
        chat._id === data.partnerId
      );

      // FIXED: Use selectedUser as string
      const { selectedUser } = useUIStore.getState();
      const isInChatWindow = selectedUser === data.partnerId;
      const messageSenderId = typeof data.lastMessage.senderId === "string" 
        ? data.lastMessage.senderId 
        : data.lastMessage.senderId?._id;
      const isFromOther = messageSenderId !== currentUserId;

      if (existingChatIndex >= 0) {
        const updatedChats = [...state.chats];
        const existingChat = updatedChats[existingChatIndex];
        
        const updatedChat = {
          ...existingChat,
          lastMessage: data.lastMessage,
          updatedAt: new Date().toISOString(),
          unreadCount: isFromOther && !isInChatWindow 
            ? (existingChat.unreadCount || 0) + 1 
            : existingChat.unreadCount
        };
        updatedChats[existingChatIndex] = updatedChat;

        const [movedChat] = updatedChats.splice(existingChatIndex, 1);
        updatedChats.unshift(movedChat);

        return { chats: updatedChats };
      } else {
        const newChat: ChatWithPinned = {
          _id: `temp-${Date.now()}`,
          participants: [data.partnerId],
          pinnedMessages: [],
          unreadCount: 1
        };
        return { chats: [newChat, ...state.chats] };
      }
    });
  },
}));