"use client"

import React, { useState } from 'react'
import { Send, Image } from 'lucide-react'
import { useChatStore } from '@/stores/useChatStore'

interface MessageInputProps {
  receiverId: string
  type: 'user' | 'contact' | 'group'
}

const MessageInput = ({ receiverId, type }: MessageInputProps) => {
  const [message, setMessage] = useState('')
  const { sendPrivateMessage, sendGroupMessage, isSendingMessage } = useChatStore() as any

  const handleSend = async () => {
    if (!message.trim() || isSendingMessage) return

    const messageData = {
      text: message,
      image: '',
      replyTo: ''
    }

    try {
      if (type === 'group') {
        await sendGroupMessage(receiverId, messageData)
      } else {
        await sendPrivateMessage(receiverId, messageData)
      }
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="p-4 border-t border-[#2a2a2a]">
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-[#2a2a2a] cursor-pointer rounded-lg transition-colors">
          <Image className="w-5 h-5 text-[#999999]" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-2 outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSendingMessage}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <Send className="w-5 h-5 text-[#00d9ff]" />
        </button>
      </div>
    </div>
  )
}

export default MessageInput
