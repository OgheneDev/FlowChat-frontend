"use client"

import React from 'react'
import { useChatStore } from '@/stores/useChatStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { formatTime } from '@/utils/utils'

interface MessageListProps {
  isLoading: boolean
  type: 'user' | 'contact' | 'group'
}

const MessageList = ({ isLoading, type }: MessageListProps) => {
  const { privateMessages, groupMessages } = useChatStore() as any
  const { authUser } = useAuthStore() as any
  const messages = type === 'group' ? groupMessages : privateMessages

  const MessageSkeleton = () => (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-[#2a2a2a]" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-[#2a2a2a] rounded mb-2" />
        <div className="h-8 w-48 bg-[#2a2a2a] rounded" />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto py-4">
        {[...Array(5)].map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Check if there are no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto py-4 flex items-center justify-center">
        <div className="text-center text-[#999999]">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">
            {type === 'group' ? 'Start the conversation!' : 'Say hello!'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message: any) => {
        const isOwn = message.sender === authUser?._id
        return (
          <div
            key={message._id}
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            <div className="flex flex-col gap-1 max-w-[70%]">
              {type === 'group' && !isOwn && (
                <span className="text-xs text-[#999999]">{message.senderName}</span>
              )}
              <div
                className={`rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-[#00d9ff] text-[#121212]'
                    : 'bg-[#2a2a2a] text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              <span className="text-xs text-[#999999] self-end">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MessageList