"use client"

import React, { useEffect } from 'react'
import { User, ArrowLeft } from 'lucide-react'
import { useChatStore } from '@/stores/useChatStore'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

interface ChatWindowProps {
  selectedUser: any
  type: 'user' | 'contact' | 'group' 
}

const ChatWindow = ({ selectedUser, type }: ChatWindowProps) => {
  const { getPrivateMessages, getGroupMessages, isMessagesLoading, setSelectedUser } = useChatStore() as any

  useEffect(() => {
    if (selectedUser) {
      if (type === 'group') {
        getGroupMessages(selectedUser._id)
      } else {
        getPrivateMessages(selectedUser._id)
      }
    }
  }, [selectedUser, type])

  const handleBack = () => {
    setSelectedUser(null)
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex md:flex-1 flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#2a2a2a]">
        {/* Back button */}
        <button 
          className="p-1.5 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer duration-200"
          onClick={handleBack}
        >
          <ArrowLeft className="w-5 h-5 text-[#999999] hover:text-[#ffffff]" />
        </button>
        
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2a] flex items-center justify-center ml-0 md:ml-3">
          {selectedUser.profilePicture ? (
            <img 
              src={selectedUser.profilePicture} 
              alt={selectedUser.fullName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-[#999999]" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-white">
            {type === 'group' ? selectedUser.name : selectedUser.fullName}
          </h3>
          <p className="text-xs text-[#999999]">
            {type === 'group' ? `${selectedUser.members?.length || 0} members` : 'Online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageList isLoading={isMessagesLoading} type={type} />

      {/* Input */}
      <MessageInput receiverId={selectedUser._id} type={type} />
    </div>
  )
}

export default ChatWindow