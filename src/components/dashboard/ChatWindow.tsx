"use client"

import React, { useEffect } from 'react'
import { User, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react'
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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#252525]">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-[#2a2a2a] flex items-center justify-center">
            <User className="w-12 h-12 text-[#666]" />
          </div>
          <div>
            <p className="text-gray-400 text-lg font-medium">No chat selected</p>
            <p className="text-gray-600 text-sm mt-1">Choose a conversation to start messaging</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex md:flex-1 flex-col bg-gradient-to-b from-[#1a1a1a] to-[#1e1e1e]">
      {/* Enhanced Header */}
      <div className="relative bg-[#1e1e1e]/80 backdrop-blur-xl border-b border-[#2a2a2a]/50 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Back button with hover effect */}
            <button 
              className="group p-2 hover:bg-[#2a2a2a] cursor-pointer rounded-xl transition-all duration-200 active:scale-95"
              onClick={handleBack}
            >
              <ArrowLeft className="w-5 h-5 text-[#999999] group-hover:text-white transition-colors" />
            </button>
            
            {/* Avatar with online indicator */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#00d9ff] to-[#0099cc] p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#2a2a2a] flex items-center justify-center">
                  {selectedUser.profilePic ? (
                    <img 
                      src={selectedUser.profilePic} 
                      alt={selectedUser.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-[#999999]" />
                  )}
                </div>
              </div>
              {type !== 'group' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00ff88] rounded-full border-2 border-[#1e1e1e]" />
              )}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">
                {type === 'group' ? selectedUser.name : selectedUser.fullName}
              </h3>
              <p className="text-xs text-[#00d9ff] font-medium">
                {type === 'group' 
                  ? `${selectedUser.members?.length || 0} members` 
                  : 'Active now'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {type !== 'group' && (
              <>
                <button className="p-2.5 hover:bg-[#2a2a2a] rounded-xl transition-all duration-200 active:scale-95 group">
                  <Phone className="w-5 h-5 text-[#999999] group-hover:text-[#00d9ff] transition-colors" />
                </button>
                <button className="p-2.5 hover:bg-[#2a2a2a] rounded-xl transition-all duration-200 active:scale-95 group">
                  <Video className="w-5 h-5 text-[#999999] group-hover:text-[#00d9ff] transition-colors" />
                </button>
              </>
            )}
            <button className="p-2.5 hover:bg-[#2a2a2a] rounded-xl transition-all duration-200 active:scale-95 group">
              <MoreVertical className="w-5 h-5 text-[#999999] group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
        
        {/* Subtle gradient line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent" />
      </div>

        <MessageList isLoading={isMessagesLoading} type={type} />

      {/* Enhanced Input */}
      <MessageInput receiverId={selectedUser._id} type={type} />
    </div>
  )
}

export default ChatWindow