"use client";

import React, { useEffect } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users, MessageCircle } from 'lucide-react';
import { usePrivateChatStore, useGroupStore, useUIStore } from '@/stores';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  selectedUser: any;
  type: 'user' | 'contact' | 'group';
}

const ChatWindow = ({ selectedUser, type }: ChatWindowProps) => {
  const { getPrivateMessages, isMessagesLoading } = usePrivateChatStore();
  const { getGroupMessages } = useGroupStore();
  const { setSelectedUser } = useUIStore();


  useEffect(() => {
    if (selectedUser) {
      if (type === 'group') {
        getGroupMessages(selectedUser._id);
      } else {
        getPrivateMessages(selectedUser._id);
      }
    }
  }, [selectedUser, type]);

  const handleBack = () => setSelectedUser(null);

  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#1e1e1e]">
        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d9ff]/20 to-[#00b8d4]/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative size-full rounded-full bg-[#2a2a2a] flex items-center justify-center">
              {type === 'group' ? (
                <Users className="w-14 h-14 text-[#666]" />
              ) : (
                <MessageCircle className="w-14 h-14 text-[#666]" />
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">No conversation selected</h3>
            <p className="text-sm text-[#999] mt-1">Pick a chat from the sidebar to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#1e1e1e] md:flex-1">
      {/* Glass Header */}
      <header className="relative bg-[#1e1e1e]/70 backdrop-blur-2xl border-b border-[#2a2a2a]/50 z-10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleBack}
              className="p-2 cursor-pointer rounded-xl hover:bg-[#2a2a2a] transition-all duration-200 group"
              aria-label="Back to chats"
            >
              <ArrowLeft className="w-5 h-5 text-[#999] group-hover:text-white transition-colors" />
            </button>

            <div className="relative">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#2a2a2a] ring-offset-2 ring-offset-[#1e1e1e]">
                {selectedUser.profilePic || selectedUser.groupImage ? (
                  <img
                    src={selectedUser.profilePic || selectedUser.groupImage}
                    alt={type === 'group' ? selectedUser.name : selectedUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                    {type === 'group' ? (
                      <Users className="w-6 h-6 text-[#666]" />
                    ) : (
                      <div className="text-lg font-bold text-[#00d9ff]">
                        {(selectedUser.fullName || selectedUser.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {type !== 'group' && selectedUser.isOnline && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00ff88] border-2 border-[#1e1e1e] rounded-full animate-pulse"></span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate text-base">
                {type === 'group' ? selectedUser.name : selectedUser.fullName}
              </h3>
              <p className="text-xs text-[#00d9ff] font-medium">
                {type === 'group'
                  ? `${selectedUser.members?.length || 0} members`
                  : selectedUser.isOnline
                  ? 'Active now'
                  : 'Offline'}
              </p>
            </div>
          </div>

        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent" />
      </header>

      <MessageList isLoading={isMessagesLoading} type={type} />
      <MessageInput receiverId={selectedUser._id} type={type} />
    </div>
  );
};

export default ChatWindow;