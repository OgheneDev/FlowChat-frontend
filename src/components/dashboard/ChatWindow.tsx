"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users, MessageCircle, Pin, Image as ImageIcon, Star, Copy, Forward, Trash2, X } from 'lucide-react';
import { usePrivateChatStore, useGroupStore, useUIStore, usePinningStore, useStarringStore } from '@/stores';
import { useToastStore } from '@/stores/modules/toast';
import MessageList, {MessageListHandle} from './MessageList';
import MessageInput from './MessageInput';
import { formatTime } from '@/utils/utils';
import ForwardModal from './ForwardModal';

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
      <div className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs border-l-2 border-[#2a2a2a] animate-pulse">
        <div className="flex items-start gap-2">
          <Pin className="w-3 h-3 text-[#2a2a2a] mt-0.5 flex-shrink-0" />
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
      <div className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs text-[#ccc] border-l-2 border-[#2a2a2a]">
        <div className="flex items-start gap-2">
          <Pin className="w-3 h-3 text-[#2a2a2a] mt-0.5 flex-shrink-0" />
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
      className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs text-[#ccc] border-l-2 border-[#2a2a2a] hover:bg-[#2a2a2a]/70 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-2">
        <Pin className="w-3 h-3 text-[#2a2a2a] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#2a2a2a] font-medium truncate">{senderName}</span>
            <span className="text-[#999] text-xs">
              {formatTime(message.createdAt)}
            </span>
          </div>
          
          {message.replyTo && (
            <div className="mb-1 px-2 py-1 bg-[#1a1a1a]/50 rounded text-[#888] border-l border-[#2a2a2a]/30">
              <div className="flex items-center gap-1">
                <span className="text-[#2a2a2a] text-xs">↳</span>
                <span className="truncate text-xs">
                  {message.replyTo.text || '📷 Photo'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            {message.image && (
              <div className="flex-shrink-0 w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-[#2a2a2a]" />
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
  const { getPrivateMessages, isMessagesLoading, privateMessages, deleteMessage: deletePrivate } = usePrivateChatStore();
  const { getGroupMessages, groupMessages, deleteMessage: deleteGroup } = useGroupStore();
  const { setSelectedUser } = useUIStore();
  const { 
    pinnedMessages,
    loadPinnedMessagesForChat,
    fetchMultipleMessageDetails 
  } = usePinningStore();
  const { toggleStarMessage } = useStarringStore();
  const { showToast } = useToastStore();
  
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [bulkForwardModal, setBulkForwardModal] = useState<{
    isOpen: boolean;
    messages: any[];
  }>({
    isOpen: false,
    messages: []
  });
  const messageListRef = useRef<MessageListHandle>(null);

  const chatPinnedMessages = pinnedMessages;
  const messages = type === "group" ? groupMessages : privateMessages;
  const deleteMessage = type === "group" ? deleteGroup : deletePrivate;

  useEffect(() => {
    if (selectedUser) {
      if (type === 'group') {
        getGroupMessages(selectedUser._id);
        loadPinnedMessagesForChat({ groupId: selectedUser._id });
      } else {
        getPrivateMessages(selectedUser._id);
        loadPinnedMessagesForChat({ chatPartnerId: selectedUser._id });
      }
    }
  }, [selectedUser, type, getPrivateMessages, getGroupMessages, loadPinnedMessagesForChat]);

  useEffect(() => {
    if (chatPinnedMessages.length > 0) {
      fetchMultipleMessageDetails(chatPinnedMessages.slice(0, 3));
    }
  }, [chatPinnedMessages, fetchMultipleMessageDetails]);

  const handleBack = () => {
    if (isSelectionMode) {
      clearSelection();
    } else {
      setSelectedUser(null);
    }
  };

  const handleSelectionModeChange = useCallback((mode: boolean) => {
    setIsSelectionMode(mode);
  }, []);

  const handleSelectedMessagesChange = useCallback((messageIds: string[]) => {
    setSelectedMessages(messageIds);
  }, []);

  const clearSelection = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.clearSelection();
    }
    setIsSelectionMode(false);
    setSelectedMessages([]);
  }, []);

  // Action handlers for selected messages
  const handleStarSelected = async () => {
    if (selectedMessages.length === 0) return;

    try {
      for (const messageId of selectedMessages) {
        await toggleStarMessage(messageId);
      }
      showToast(`${selectedMessages.length} message${selectedMessages.length === 1 ? '' : 's'} starred`, 'success');
      clearSelection();
    } catch (error) {
      console.error('Error starring messages:', error);
      showToast('Failed to star messages', 'error');
    }
  };

  const handleCopySelected = async () => {
    if (selectedMessages.length === 0) return;
    
    const selectedTexts = selectedMessages
      .map(id => {
        const message = messages.find(m => m._id === id);
        return message?.text;
      })
      .filter(Boolean)
      .join('\n\n');

    if (selectedTexts) {
      try {
        await navigator.clipboard.writeText(selectedTexts);
        showToast(`${selectedMessages.length} message${selectedMessages.length === 1 ? '' : 's'} copied to clipboard`, 'success');
        clearSelection();
      } catch (error) {
        console.error('Error copying messages:', error);
        showToast('Failed to copy messages', 'error');
      }
    } else {
      showToast('No text content to copy', 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;

    try {
      for (const messageId of selectedMessages) {
        await deleteMessage({
          messageId: messageId,
          deleteType: "me",
        });
      }
      showToast(`${selectedMessages.length} message${selectedMessages.length === 1 ? '' : 's'} deleted`, 'success');
      clearSelection();
    } catch (error) {
      console.error('Error deleting messages:', error);
      showToast('Failed to delete messages', 'error');
    }
  };

  const handleForwardSelected = () => {
    if (selectedMessages.length === 0) return;

    const messagesToForward = selectedMessages
      .map(id => messages.find(m => m._id === id))
      .filter(Boolean);

    if (messagesToForward.length > 0) {
      setBulkForwardModal({
        isOpen: true,
        messages: messagesToForward
      });
    }
  };

  const handleBulkForward = async (selectedIds: string[], messagesToForward: any[]) => {
    try {
      // Get groups to check if recipient is a group
      const groups = useGroupStore.getState().groups;
      
      // Forward each message to each selected chat
      for (const recipientId of selectedIds) {
        for (const message of messagesToForward) {
          const messageData = {
            text: message.text || "",
            image: message.image || "",
            replyTo: "",
            isForwarded: true
          };

          // Determine if it's a group or private chat
          const isGroup = groups.some(g => g._id === recipientId);
          
          if (isGroup) {
            await useGroupStore.getState().sendGroupMessage(recipientId, messageData);
          } else {
            await usePrivateChatStore.getState().sendPrivateMessage(recipientId, messageData);
          }
        }
      }
      
      showToast(`Forwarded ${messagesToForward.length} message${messagesToForward.length === 1 ? '' : 's'} to ${selectedIds.length} ${selectedIds.length === 1 ? 'chat' : 'chats'}`, 'success');
      clearSelection();
      setBulkForwardModal({ isOpen: false, messages: [] });
    } catch (error) {
      console.error('Error forwarding messages:', error);
      showToast('Failed to forward messages', 'error');
    }
  };

  // Early return if no user is selected
  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#1e1e1e]">
        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a]/20 to-[#00b8d4]/20 rounded-full blur-xl animate-pulse"></div>
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

  // Safe access to selectedUser properties
  const profilePic = selectedUser?.profilePic || selectedUser?.groupImage;
  const displayName = type === 'group' ? selectedUser?.name : selectedUser?.fullName;
  const memberCount = selectedUser?.members?.length || 0;
  const isOnline = selectedUser?.isOnline;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#1e1e1e] md:flex-1">
      {/* Selection Header */}
      {isSelectionMode && (
        <header className="relative bg-[#1e1e1e]/70 backdrop-blur-2xl border-b border-[#2a2a2a]/50 z-20">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={clearSelection}
                className="p-2 cursor-pointer rounded-xl hover:bg-[#2a2a2a]/20 transition-all duration-200"
                aria-label="Cancel selection"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">
                  {selectedMessages.length} {selectedMessages.length === 1 ? 'message' : 'messages'} selected
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStarSelected}
                className="p-3 cursor-pointer rounded-xl hover:bg-[#2a2a2a]/20 transition-all duration-200 group"
                aria-label="Star messages"
                disabled={selectedMessages.length === 0}
              >
                <Star className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-yellow-400'}`} />
              </button>

              <button
                onClick={handleCopySelected}
                className="p-3 cursor-pointer rounded-xl hover:bg-[#2a2a2a]/20 transition-all duration-200 group"
                aria-label="Copy messages"
                disabled={selectedMessages.length === 0}
              >
                <Copy className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-green-400'}`} />
              </button>

              <button
                onClick={handleForwardSelected}
                className="p-3 cursor-pointer rounded-xl hover:bg-[#2a2a2a]/20 transition-all duration-200 group"
                aria-label="Forward messages"
                disabled={selectedMessages.length === 0}
              >
                <Forward className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-blue-400'}`} />
              </button>

              <button
                onClick={handleDeleteSelected}
                className="p-3 cursor-pointer rounded-xl hover:bg-red-500/20 transition-all duration-200 group"
                aria-label="Delete messages"
                disabled={selectedMessages.length === 0}
              >
                <Trash2 className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-red-400'}`} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Normal Header */}
      {!isSelectionMode && (
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
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt={displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                      {type === 'group' ? (
                        <Users className="w-6 h-6 text-[#666]" />
                      ) : (
                        <div className="text-lg font-bold text-[#00d9ff]">
                          {initials}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {type !== 'group' && isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00ff88] border-2 border-[#1e1e1e] rounded-full animate-pulse"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-base">
                  {displayName || 'Unknown User'}
                </h3>
                <p className="text-xs text-[#00d9ff] font-medium">
                  {type === 'group'
                    ? `${memberCount} members`
                    : isOnline
                    ? 'Active now'
                    : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Pinned Messages Header */}
          {chatPinnedMessages.length > 0 && (
            <div className="px-4 py-2 bg-gradient-to-r from-[#2a2a2a]/10 to-transparent border-t border-[#2a2a2a]/20">
              <button
                onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                className="flex items-center cursor-pointer gap-2 text-xs text-[#2a2a2a] hover:text-white transition-colors group w-full"
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
          
          <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a]/30 to-transparent" />
        </header>
      )}

      {/* Pinned Messages Section */}
      {showPinnedMessages && chatPinnedMessages.length > 0 && !isSelectionMode && (
        <div className="bg-[#1a1a1a]/50 border-b border-[#2a2a2a]">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Pin className="w-4 h-4 text-[#2a2a2a]" />
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
        ref={messageListRef}
        isLoading={isMessagesLoading} 
        type={type} 
        selectedUser={selectedUser}
        onSelectionModeChange={handleSelectionModeChange}
        onSelectedMessagesChange={handleSelectedMessagesChange}
      />
      
      {/* Hide message input in selection mode */}
      {!isSelectionMode && <MessageInput receiverId={selectedUser._id} type={type} />}

      {/* Bulk Forward Modal */}
      {bulkForwardModal.isOpen && (
        <ForwardModal
          isOpen={bulkForwardModal.isOpen}
          onClose={() => setBulkForwardModal({ isOpen: false, messages: [] })}
          messages={bulkForwardModal.messages}
          onForward={handleBulkForward}
          isBulk={true}
        />
      )}
    </div>
  );
};

export default ChatWindow;