import React from "react";
import { User, Image as ImageIcon, Star, Loader2 } from "lucide-react";
import { formatTime } from "@/utils/utils";
import { MessageStatus } from "./MessageStatus";
import Image from "next/image";
import FullScreenImageModal from "../../general/FullScreenImageModal";
import { useUIStore, useStarringStore, useAuthStore, useToastStore, useGroupStore, usePrivateChatStore } from "@/stores";

interface ChatItemProps {
  item: any;
  type: "user" | "contact" | "group";
}

const ChatItem: React.FC<ChatItemProps> = ({ item, type }) => {
  const { toggleStarChat, starredChats, isStarring } = useStarringStore();
  const { setSelectedUser } = useUIStore(); 
  const { showToast } = useToastStore();
  const { authUser } = useAuthStore();
  const [isImageFullscreen, setIsImageFullscreen] = React.useState(false);
  const displayName = type === "group" ? item.name : item.fullName;
  const image = type === "group" ? item.groupImage : item.profilePic;
  const isStarred = starredChats?.includes(item._id);
  const isCurrentlyStarring = isStarring === item._id;

  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const payload = type === "group" 
      ? { groupId: item._id }
      : { chatPartnerId: item._id };
    
    try {
      await toggleStarChat(payload);
      showToast(isStarred ? "Chat unstarred" : "Chat starred", "success");
    } catch (error: any) {
      showToast("Failed to star/unstar chat", "error");
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image) {
      setIsImageFullscreen(true);
    }
  };

  const handleChatClick = () => {
    const chatId = item._id;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🖱️ [CHAT_ITEM] handleChatClick called");
    console.log("🖱️ [CHAT_ITEM] Chat ID:", chatId);
    console.log("🖱️ [CHAT_ITEM] Type:", type);
    console.log("🖱️ [CHAT_ITEM] Current unreadCount on item:", item.unreadCount);
    
    setSelectedUser(item);
    
    if (type === 'group') {
      console.log("🖱️ [CHAT_ITEM] Clearing group unread count locally");
      useGroupStore.getState().clearUnreadCount(chatId);
      useGroupStore.setState(state => ({
        groups: state.groups.map(g => 
          g._id === chatId ? { ...g, unreadCount: 0 } : g
        )
      }));
      
      console.log("🖱️ [CHAT_ITEM] Calling markGroupMessagesAsSeen");
      useGroupStore.getState().markGroupMessagesAsSeen(chatId);
    } else {
      console.log("🖱️ [CHAT_ITEM] Clearing private unread count locally");
      usePrivateChatStore.getState().clearUnreadCount(chatId);
      usePrivateChatStore.setState(state => ({
        chats: state.chats.map(c => {
          const partnerId = c.participants?.find(
            p => p !== useAuthStore.getState().authUser?._id
          ) || c._id;
          return partnerId === chatId ? { ...c, unreadCount: 0 } : c;
        })
      }));
      
      console.log("🖱️ [CHAT_ITEM] Calling markMessagesAsSeen");
      usePrivateChatStore.getState().markMessagesAsSeen(chatId);
    }
    
    console.log("🖱️ [CHAT_ITEM] After clear - checking store state:");
    if (type === 'group') {
      console.log("🖱️ [CHAT_ITEM] Group unreadCounts:", useGroupStore.getState().unreadCounts);
    } else {
      console.log("🖱️ [CHAT_ITEM] Private unreadCounts:", usePrivateChatStore.getState().unreadCounts);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  };

  const closeFullscreenImage = () => {
    setIsImageFullscreen(false);
  };

  const getLastMessagePreview = () => {
    if (!item.lastMessage) return <span className="italic">No messages yet</span>;

    if (item.lastMessage.deletedForEveryone) {
      return <span className="italic text-[#999999]">This message was deleted</span>;
    }

    const { text, image, senderId } = item.lastMessage;
    
    if (type === "group") {
      const isMyMessage = authUser && senderId && senderId._id === authUser._id;
      const senderPrefix = isMyMessage ? "You: " : `${senderId?.fullName || 'Someone'}: `;
      
      if (text) return `${senderPrefix}${text}`;
      if (image) return (
        <span className="flex items-center gap-1 text-[#999999]">
          {senderPrefix}
          <ImageIcon className="w-3 h-3" /> Photo
        </span>
      );
      return `${senderPrefix}No messages`;
    }

    if (text) return text;
    if (image) return (
      <span className="flex items-center gap-1 text-[#999999]">
        <ImageIcon className="w-3 h-3" /> Photo
      </span>
    );
    return "No messages";
  };

  const getChatPreview = () => {
    if (type === "contact") {
      return "Tap to message";
    }
    return getLastMessagePreview();
  };

  const shouldShowMessageMetadata = () => {
    return type === "user" || type === "group";
  };

  const unreadCount = item.unreadCount || 0;
  
  // Debug log on every render
  console.log(`🔢 [CHAT_ITEM] Rendering ${displayName} with unreadCount:`, unreadCount);

  const isLastMessageFromAuthUser = () => {
    if (!item.lastMessage || !authUser) return false;
    
    if (type === "group") {
      return item.lastMessage.senderId?._id === authUser._id;
    }
    
    return item.lastMessage.senderId?._id === authUser._id;
  };

  return (
    <>
      <div
        onClick={handleChatClick}
        className="flex items-center gap-3 p-3.5 hover:bg-[#1a1a1a] transition-colors duration-200 cursor-pointer group relative"
        role="button"
        tabIndex={0}
      >
        <div 
          className="relative flex-shrink-0"
          onClick={handleImageClick}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2a2a2a] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
            {image ? (
              <Image 
                src={image} 
                width={50} 
                height={50} 
                alt={displayName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="w-6 h-6 text-[#999999]" />
            )}
          </div>
          {type === "user" && item.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121212] rounded-full"></span>
          )}
        </div>
 
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white text-sm truncate pr-2">{displayName}</h3>
            {isStarred && <Star className="w-3.5 h-3.5 text-[#00d9ff] fill-[#00d9ff] flex-shrink-0" />}
          </div>
          <p className="text-xs text-[#999999] truncate mt-0.5">
            {getChatPreview()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          {shouldShowMessageMetadata() && item.lastMessage && (
            <>
              <span className="text-xs text-[#999999]">{formatTime(item.lastMessage.createdAt)}</span>
              {type === "user" && isLastMessageFromAuthUser() && (
                <MessageStatus status={item.lastMessage.status} />
              )}
            </>
          )}

          {unreadCount > 0 && (
            <div className="bg-[#00d9ff] text-black text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
          
          <button
            onClick={handleStarClick}
            disabled={isCurrentlyStarring}
            className={`mt-1 p-1 rounded opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity ${
              isStarred ? "opacity-100" : ""
            } hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isStarred ? "Unstar" : "Star"}
          >
            {isCurrentlyStarring ? (
              <Loader2 className="w-3.5 h-3.5 text-[#666] animate-spin" />
            ) : (
              <Star className={`w-3.5 h-3.5 ${isStarred ? "text-[#00d9ff] fill-[#00d9ff]" : "text-[#666]"}`} />
            )}
          </button>
        </div>
      </div>

      {isImageFullscreen && image && (
        <FullScreenImageModal 
          closeFullscreenImage={closeFullscreenImage}
          image={image}
          type={type}
          displayName={displayName}
        />
      )}
    </>
  );
};

export default ChatItem;