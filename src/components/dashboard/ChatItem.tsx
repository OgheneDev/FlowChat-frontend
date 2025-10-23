"use client";

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
    if (!item.lastMessage) return "No messages yet";

    const { text, image } = item.lastMessage;
    if (text) return text;
    if (image) {
      return (
        <span className="flex items-center gap-1 text-[#999999]">
          <Image className="w-3 h-3" />
          <span>Photo</span>
        </span>
      );
    }
    return "No messages yet";
  };

  return (
    <div
      onClick={() => setSelectedUser(item)}
      className="flex items-center gap-3 p-4 border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors cursor-pointer duration-200 relative group"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
        {image ? (
          <img src={image} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <User className="w-6 h-6 text-[#999999]" />
        )}
      </div>

      <div className="flex flex-col justify-center flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[#ffffff] truncate text-sm">{displayName}</h3>
          {isChat && isStarred && (
            <Star className="w-3 h-3 text-cyan-500 fill-cyan-500 flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-[#999999] truncate">
          {isChat
            ? getLastMessagePreview()
            : type === "contact"
            ? "Contact"
            : getLastMessagePreview()}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isChat && item.lastMessage && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="text-xs text-[#999999]">{formatTime(item.lastMessage.createdAt)}</div>
            <MessageStatus status={item.lastMessage.status} />
          </div>
        )}

        {/* Star button - shows on hover */}
        {isChat && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarChat(item._id);
            }}
            className={`opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity p-1.5 rounded hover:bg-[#3a3a3a] flex-shrink-0 ${
              isStarred ? "opacity-100" : ""
            }`}
            aria-label={isStarred ? "Unstar chat" : "Star chat"}
          >
            <Star
              className={`w-3.5 h-3.5 transition-colors ${
                isStarred ? "text-cyan-500 fill-cyan-500" : "text-[#666]"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatItem;