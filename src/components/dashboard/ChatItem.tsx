"use client"

import React from 'react'
import { User } from "lucide-react"
import { formatTime } from "@/utils/utils"
import { MessageStatus } from "./MessageStatus"
import { useChatStore } from "@/stores/useChatStore"

interface ChatItemProps {
  item: any
  type: 'user' | 'contact' | 'group'
}

const ChatItem: React.FC<ChatItemProps> = ({ item, type }) => {
  const { setSelectedUser } = useChatStore() as any
  const displayName = type === 'group' ? item.name : item.fullName
  const image = type === 'group' ? item.groupImage : item.profilePicture
  const isChat = type === 'user'

  return (
    <div
      onClick={() => setSelectedUser(item)}
      className="flex items-center gap-3 p-4 border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors cursor-pointer duration-200"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
        {image ? (
          <img src={image} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <User className="w-6 h-6 text-[#999999]" />
        )}
      </div>

      <div className="flex flex-col justify-center flex-1 min-w-0">
        <h3 className="font-semibold text-[#ffffff] truncate text-sm">{displayName}</h3>
        <p className="text-xs text-[#999999] truncate">
          {isChat
            ? item.lastMessage?.text || 'No messages yet'
            : type === 'contact'
              ? 'Contact'
              : item.lastMessage?.text || 'No messages yet'}
        </p>
      </div>

      {isChat && item.lastMessage && (
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="text-xs text-[#999999]">{formatTime(item.lastMessage.createdAt)}</div>
          <MessageStatus status={item.lastMessage.status} />
        </div>
      )}
    </div>
  )
}

export default ChatItem