import React from "react";
import { User, Image, Star } from "lucide-react";
import { formatTime } from "@/utils/utils";
import { MessageStatus } from "./MessageStatus";
import { useChatStore } from "@/stores/useChatStore";

interface ChatItemProps {
  item: any;
  type: "user" | "contact" | "group";
}

const ChatItem: React.FC<ChatItemProps> = ({ item, type }) => {
  const { setSelectedUser, toggleStarChat, starredChats } = useChatStore() as any;

  const displayName = type === "group" ? item.name : item.fullName;
  const image = type === "group" ? item.groupImage : item.profilePic;
  const isChat = type === "user";
  const isStarred = starredChats?.includes(item._id);

  const getLastMessagePreview = () => {
    if (!item.lastMessage) return <span className="italic">No messages yet</span>;
    const { text, image } = item.lastMessage;
    if (text) return text;
    if (image) return (
      <span className="flex items-center gap-1 text-[#999999]">
        <Image className="w-3 h-3" /> Photo
      </span>
    );
    return "No messages";
  };

  return (
    <div
      onClick={() => setSelectedUser(item)}
      className="flex items-center gap-3 p-3.5 hover:bg-[#1a1a1a] transition-colors duration-200 cursor-pointer group relative"
      role="button"
      tabIndex={0}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2a2a2a] flex items-center justify-center">
          {image ? (
            <img src={image} alt={displayName} className="w-full h-full object-cover" />
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
          {isChat && isStarred && <Star className="w-3.5 h-3.5 text-[#00d9ff] fill-[#00d9ff] flex-shrink-0" />}
        </div>
        <p className="text-xs text-[#999999] truncate mt-0.5">
          {isChat ? getLastMessagePreview() : type === "contact" ? "Tap to message" : "Group chat"}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 text-right">
        {isChat && item.lastMessage && (
          <>
            <span className="text-xs text-[#999999]">{formatTime(item.lastMessage.createdAt)}</span>
            <MessageStatus status={item.lastMessage.status} />
          </>
        )}
        {isChat && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarChat(item._id);
            }}
            className={`mt-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
              isStarred ? "opacity-100" : ""
            } hover:bg-[#2a2a2a]`}
            aria-label={isStarred ? "Unstar" : "Star"}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? "text-[#00d9ff] fill-[#00d9ff]" : "text-[#666]"}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatItem;