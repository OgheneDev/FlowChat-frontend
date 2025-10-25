"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users, MessageCircle, Pin, Image as ImageIcon } from 'lucide-react';
import { usePrivateChatStore, useGroupStore, useUIStore, usePinningStore } from '@/stores';
import MessageList, {MessageListHandle} from './MessageList';
import MessageInput from './MessageInput';
import { formatTime } from '@/utils/utils';

interface ChatWindowProps {
  selectedUser: any;
  type: 'user' | 'contact' | 'group';
}

// PinnedMessagePreview component with real data fetching
const PinnedMessagePreview = ({ messageId, type, selectedUser }: { 
  messageId: string, 
  type: string,
  selectedUser: any 
}) => {
  const { messageDetails, fetchMessageDetails, isMessagePinned } = usePinningStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const message = messageDetails[messageId];
  const isPinned = isMessagePinned(messageId);
  const messageListRef = useRef<MessageListHandle>(null);

  useEffect(() => {
    const loadMessageDetails = async () => {
      if (!message && !isLoading) {
        setIsLoading(true);
        try {
          await fetchMessageDetails(messageId);
        } catch (error) {
          console.error('Failed to load pinned message details:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadMessageDetails();
  }, [messageId, message, fetchMessageDetails, isLoading]);

   const handleClick = () => {
    // Scroll to the pinned message in the chat
    if (messageListRef.current) {
      messageListRef.current.scrollToMessage(messageId);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs border-l-2 border-[#00d9ff] animate-pulse">
        <div className="flex items-start gap-2">
          <Pin className="w-3 h-3 text-[#00d9ff] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="h-3 bg-[#3a3a3a] rounded w-3/4"></div>
            <div className="h-2 bg-[#3a3a3a] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs text-[#ccc] border-l-2 border-[#00d9ff]">
        <div className="flex items-start gap-2">
          <Pin className="w-3 h-3 text-[#00d9ff] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="truncate text-white font-medium">Message not found</div>
            <div className="text-[#999] text-xs mt-1">Unable to load message</div>
          </div>
        </div>
      </div>
    );
  }

  const senderName = message.senderId?.fullName || 'Unknown';
  const messagePreview = message.text 
    ? (message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text)
    : message.image 
    ? '📷 Photo' 
    : 'Message';

  return (
    <div 
      onClick={handleClick}
      className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs text-[#ccc] border-l-2 border-[#00d9ff] hover:bg-[#2a2a2a]/70 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-2">
        <Pin className="w-3 h-3 text-[#00d9ff] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#00d9ff] font-medium truncate">{senderName}</span>
            <span className="text-[#999] text-xs">
              {formatTime(message.createdAt)}
            </span>
          </div>
          
          {message.replyTo && (
            <div className="mb-1 px-2 py-1 bg-[#1a1a1a]/50 rounded text-[#888] border-l border-[#00d9ff]/30">
              <div className="flex items-center gap-1">
                <span className="text-[#00d9ff] text-xs">↳</span>
                <span className="truncate text-xs">
                  {message.replyTo.text || '📷 Photo'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            {message.image && (
              <div className="flex-shrink-0 w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-[#00d9ff]" />
              </div>
            )}
            <div className={`${message.image ? 'flex-1' : ''}`}>
              <div className="text-white font-medium truncate">
                {messagePreview}
              </div>
              {message.editedAt && (
                <span className="text-[#999] text-xs italic ml-1">(edited)</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatWindow = ({ selectedUser, type }: ChatWindowProps) => {
  const { getPrivateMessages, isMessagesLoading } = usePrivateChatStore();
  const { getGroupMessages } = useGroupStore();
  const { setSelectedUser } = useUIStore();
  const { pinnedMessages, loadPinnedData, fetchMultipleMessageDetails } = usePinningStore();
  
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);

  const messageListRef = useRef<MessageListHandle>(null);

  // Use pinnedMessages directly from store
  const chatPinnedMessages = pinnedMessages;

  useEffect(() => {
    if (selectedUser) {
      if (type === 'group') {
        getGroupMessages(selectedUser._id);
      } else {
        getPrivateMessages(selectedUser._id);
      }
    }
  }, [selectedUser, type]);

  // Load pinned data when component mounts
  useEffect(() => {
    const loadData = async () => {
      await loadPinnedData();
    };
    loadData();
  }, [loadPinnedData]);

  // Preload pinned message details when pinned messages change
  useEffect(() => {
    if (chatPinnedMessages.length > 0) {
      fetchMultipleMessageDetails(chatPinnedMessages.slice(0, 3)); // Preload first 3
    }
  }, [chatPinnedMessages, fetchMultipleMessageDetails]);

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
        
        {/* Pinned Messages Header */}
        {chatPinnedMessages.length > 0 && (
          <div className="px-4 py-2 bg-gradient-to-r from-[#00d9ff]/10 to-transparent border-t border-[#00d9ff]/20">
            <button
              onClick={() => setShowPinnedMessages(!showPinnedMessages)}
              className="flex items-center gap-2 text-xs text-[#00d9ff] hover:text-white transition-colors group w-full"
            >
              <Pin className="w-3 h-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium">
                {chatPinnedMessages.length} pinned message{chatPinnedMessages.length !== 1 ? 's' : ''}
              </span>
              <span className="ml-auto text-[#999] group-hover:text-white">
                {showPinnedMessages ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>
        )}
        
        <div className="h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent" />
      </header>

      {/* Pinned Messages Section */}
      {showPinnedMessages && chatPinnedMessages.length > 0 && (
        <div className="bg-[#1a1a1a]/50 border-b border-[#2a2a2a]">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Pin className="w-4 h-4 text-[#00d9ff]" />
                Pinned Messages
              </h4>
              <button
                onClick={() => setShowPinnedMessages(false)}
                className="text-xs text-[#999] hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {chatPinnedMessages.slice(0, 3).map((messageId: string) => (
                <PinnedMessagePreview 
                  key={messageId} 
                  messageId={messageId} 
                  type={type}
                  selectedUser={selectedUser}
                />
              ))}
              {chatPinnedMessages.length > 3 && (
                <div className="text-xs text-[#999] text-center pt-2">
                  +{chatPinnedMessages.length - 3} more pinned messages
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MessageList 
        isLoading={isMessagesLoading} 
        type={type} 
        selectedUser={selectedUser}
      />
      <MessageInput receiverId={selectedUser._id} type={type} />
    </div>
  );
};

export default ChatWindow;