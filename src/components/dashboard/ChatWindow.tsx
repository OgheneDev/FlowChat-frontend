import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  ArrowLeft, Users, MessageCircle, Pin, Star, Copy, Forward, Trash2, X, 
  Reply, MoreVertical 
} from 'lucide-react';
import { 
  usePrivateChatStore, useGroupStore, useUIStore, 
  usePinningStore, useStarringStore 
} from '@/stores';
import { useToastStore } from '@/stores/modules/toast';
import MessageList, { MessageListHandle } from './chat-window/messages/MessageList';
import MessageInput from './chat-window/messages/MessageInput';
import ForwardModal from '../modals/ForwardModal';
import { PinnedMessagePreview } from './chat-window/PinnedMessagePreview';
import DeleteModal from '../modals/DeleteModal';

interface ChatWindowProps { 
  selectedUser: any;
  type: 'user' | 'contact' | 'group';
}

// ──────────────────────────────────────────────────────────────
// Simple More Actions Modal
// ──────────────────────────────────────────────────────────────
const SimpleMoreActionsModal = ({
  isOpen,
  onClose,
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={modalRef}
        className="absolute right-4 top-20 w-48 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] shadow-lg py-1"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              if (!action.disabled) {
                action.onClick();
                onClose();
              }
            }}
            disabled={action.disabled}
            className={`
              w-full text-left px-4 py-2 text-sm
              ${action.disabled 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-white hover:bg-[#3a3a3a]'
              }
              ${i !== actions.length - 1 ? 'border-b border-[#3a3a3a]' : ''}
            `}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatWindow = ({ selectedUser, type }: ChatWindowProps) => {
  const { getPrivateMessages, isMessagesLoading, privateMessages, deleteMessage: deletePrivate } = usePrivateChatStore();
  const { getGroupMessages, groupMessages, deleteMessage: deleteGroup } = useGroupStore();
  const { setSelectedUser, setReplyingTo } = useUIStore();
  const { 
    pinnedMessages,
    loadPinnedMessagesForChat,
    fetchMultipleMessageDetails,
    togglePinMessage,
    isPinning
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
  const [deleteModal, setDeleteModal] = useState<{ 
    message: any; 
    deleteType?: "me" | "everyone";
    isBulk?: boolean;
  } | null>(null);
  const [moreModalOpen, setMoreModalOpen] = useState(false);

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

  const getFirstSelectedMessage = () => {
    if (selectedMessages.length === 0) return null;
    return messages.find(m => m._id === selectedMessages[0]);
  };

  const getAuthUserId = (): string | null => {
    try {
      const privateChatState = usePrivateChatStore.getState() as any;
      if (privateChatState.authUser?._id) return privateChatState.authUser._id;
      const authStore = (window as any).useAuthStore;
      if (authStore?.getState?.()?.authUser?._id) return authStore.getState().authUser._id;
      return null;
    } catch (error) {
      console.warn('Could not get auth user ID:', error);
      return null;
    }
  };

  // Action Handlers
  const handleStarSelected = async () => {
    if (selectedMessages.length === 0) return;
    try {
      for (const messageId of selectedMessages) {
        await toggleStarMessage(messageId);
      }
      showToast(`${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''} starred`, 'success');
      clearSelection();
    } catch (error) {
      showToast('Failed to star messages', 'error');
    }
  };

  const handleCopySelected = async () => {
    if (selectedMessages.length === 0) return;
    const selectedTexts = selectedMessages
      .map(id => messages.find(m => m._id === id)?.text)
      .filter(Boolean)
      .join('\n\n');

    if (selectedTexts) {
      try {
        await navigator.clipboard.writeText(selectedTexts);
        showToast(`${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''} copied`, 'success');
        clearSelection();
      } catch (error) {
        showToast('Failed to copy', 'error');
      }
    }
  };

  const handleForwardSelected = () => {
    if (selectedMessages.length === 0) return;
    const messagesToForward = selectedMessages
      .map(id => messages.find(m => m._id === id))
      .filter(Boolean);

    if (messagesToForward.length > 0) {
      setBulkForwardModal({ isOpen: true, messages: messagesToForward });
    }
  };

  const handlePinSelected = async () => {
    if (selectedMessages.length !== 1) return;
    const message = getFirstSelectedMessage();
    if (!message) return;

    try {
      const payload = {
        messageId: message._id,
        ...(type === 'group' ? { groupId: selectedUser?._id } : { chatPartnerId: selectedUser?._id })
      };
      await togglePinMessage(payload);
      showToast('Message pinned', 'success');
      clearSelection();
    } catch (error) {
      showToast('Failed to pin', 'error');
    }
  };

  const handleReplySelected = () => {
    if (selectedMessages.length !== 1) return;
    const message = getFirstSelectedMessage();
    if (!message) return;

    const replySenderId = typeof message.senderId === 'string' 
      ? { _id: message.senderId, fullName: 'User' }
      : message.senderId;

    setReplyingTo({
      _id: message._id,
      text: message.text || '',
      image: message.image || undefined,
      senderId: replySenderId,
    });
    clearSelection();
  };

  const handleDeleteSelected = async (deleteType?: "me" | "everyone") => {
    if (selectedMessages.length === 0) return;

    if (selectedMessages.length === 1 && !deleteType) {
      const message = getFirstSelectedMessage();
      if (message) {
        setDeleteModal({ message, isBulk: false });
      }
      return;
    }

    const actualDeleteType = deleteType || "me";
    try {
      for (const messageId of selectedMessages) {
        await deleteMessage({ messageId, deleteType: actualDeleteType });
      }
      showToast(`${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''} deleted`, 'success');
      clearSelection();
      setDeleteModal(null);
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleBulkForward = async (selectedIds: string[], messagesToForward: any[]) => {
    try {
      const groups = useGroupStore.getState().groups;
      for (const recipientId of selectedIds) {
        for (const message of messagesToForward) {
          const messageData = {
            text: message.text || "",
            image: message.image || "",
            replyTo: "",
            isForwarded: true
          };
          const isGroup = groups.some(g => g._id === recipientId);
          if (isGroup) {
            await useGroupStore.getState().sendGroupMessage(recipientId, messageData);
          } else {
            await usePrivateChatStore.getState().sendPrivateMessage(recipientId, messageData);
          }
        }
      }
      showToast(`Forwarded ${messagesToForward.length} message${messagesToForward.length > 1 ? 's' : ''}`, 'success');
      clearSelection();
      setBulkForwardModal({ isOpen: false, messages: [] });
    } catch (error) {
      showToast('Failed to forward', 'error');
    }
  };

  const isFirstSelectedPinned = () => {
    if (selectedMessages.length !== 1) return false;
    const message = getFirstSelectedMessage();
    return message ? chatPinnedMessages.includes(message._id) : false;
  };

  const isFirstSelectedOwn = (): boolean => {
    if (selectedMessages.length !== 1) return false;
    const message = getFirstSelectedMessage();
    const authUserId = getAuthUserId();
    return !!(message && authUserId && message.senderId === authUserId);
  };

  const isSingleSelection = selectedMessages.length === 1;
  const firstMessage = getFirstSelectedMessage();
  const isPinningThis = isPinning === firstMessage?._id;

  // More Modal Actions for single selection
  const singleSelectionMoreActions = [
    {
      label: isFirstSelectedPinned() ? 'Unpin' : 'Pin',
      onClick: handlePinSelected,
      disabled: isPinningThis,
    },
    {
      label: 'Star',
      onClick: handleStarSelected,
      disabled: false,
    }
  ];

  // More Modal Actions for multiple selection
  const multipleSelectionMoreActions = [
    {
      label: 'Star',
      onClick: handleStarSelected,
      disabled: selectedMessages.length === 0,
    }
  ];

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

  const profilePic = selectedUser?.profilePic || selectedUser?.groupImage || undefined;
  const displayName = type === 'group' ? selectedUser?.name : selectedUser?.fullName;
  const memberCount = selectedUser?.members?.length || 0;
  const isOnline = Boolean(selectedUser?.isOnline);
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
                className="p-2 rounded-xl hover:bg-[#2a2a2a]/20 transition-all"
                aria-label="Cancel selection"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">
                  {selectedMessages.length} selected
                </h3>
              </div>
            </div>

            {/* Action buttons - different for single vs multiple selection */}
            <div className="flex items-center gap-2">
              {/* Single selection actions */}
              {isSingleSelection && (
                <>
                  <button
                    onClick={handleReplySelected}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Reply"
                  >
                    <Reply className="w-5 h-5 text-white group-hover:text-blue-400" />
                  </button>
                  
                  <button
                    onClick={handleForwardSelected}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Forward"
                  >
                    <Forward className="w-5 h-5 text-white group-hover:text-green-400" />
                  </button>

                  <button
                    onClick={() => handleDeleteSelected()}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-white group-hover:text-red-400" />
                  </button>

                  <button
                    onClick={handleCopySelected}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Copy"
                  >
                    <Copy className="w-5 h-5 text-white group-hover:text-blue-400" />
                  </button>

                  <button
                    onClick={() => setMoreModalOpen(true)}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-5 h-5 text-white group-hover:text-[#999]" />
                  </button>
                </>
              )}

              {/* Multiple selection actions */}
              {!isSingleSelection && (
                <>
                  <button
                    onClick={handleForwardSelected}
                    disabled={selectedMessages.length === 0}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Forward"
                  >
                    <Forward className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-green-400'}`} />
                  </button>

                  <button
                    onClick={handleStarSelected}
                    disabled={selectedMessages.length === 0}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Star"
                  >
                    <Star className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-yellow-400'}`} />
                  </button>

                  <button
                    onClick={() => handleDeleteSelected()}
                    disabled={selectedMessages.length === 0}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Delete"
                  >
                    <Trash2 className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-red-400'}`} />
                  </button>

                  <button
                    onClick={handleCopySelected}
                    disabled={selectedMessages.length === 0}
                    className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
                    aria-label="Copy"
                  >
                    <Copy className={`w-5 h-5 ${selectedMessages.length === 0 ? 'text-gray-400' : 'text-white group-hover:text-blue-400'}`} />
                  </button>
                </>
              )}
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
                className="p-2 rounded-xl hover:bg-[#2a2a2a] transition-all group"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-[#999] group-hover:text-white" />
              </button>

              <div className="relative">
                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#2a2a2a] ring-offset-2 ring-offset-[#1e1e1e]">
                  {profilePic ? (
                    <img src={profilePic} alt={displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                      {type === 'group' ? (
                        <Users className="w-6 h-6 text-[#666]" />
                      ) : (
                        <div className="text-lg font-bold text-[#00d9ff]">{initials}</div>
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
                  {type === 'group' ? `${memberCount} members` : isOnline ? 'Active now' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          {chatPinnedMessages.length > 0 && (
            <div className="px-4 py-2 bg-gradient-to-r from-[#00d9ff]/10 to-transparent border-t border-[#00d9ff]/20">
              <button
                onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                className="flex items-center gap-2 text-xs text-[#00d9ff] hover:text-white transition-colors group w-full"
              >
                <Pin className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium">
                  {chatPinnedMessages.length} pinned
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

      {/* Pinned Messages */}
      {showPinnedMessages && chatPinnedMessages.length > 0 && !isSelectionMode && (
        <div className="bg-[#1a1a1a]/50 border-b border-[#00d9ff]">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Pin className="w-4 h-4 text-[#00d9ff]" />
                Pinned Messages
              </h4>
              <button
                onClick={() => setShowPinnedMessages(false)}
                className="text-xs text-[#999] hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {chatPinnedMessages.slice(0, 3).map((messageId: string) => (
                <PinnedMessagePreview key={messageId} messageId={messageId} type={type} selectedUser={selectedUser} />
              ))}
              {chatPinnedMessages.length > 3 && (
                <div className="text-xs text-[#999] text-center pt-2">
                  +{chatPinnedMessages.length - 3} more
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
      
      {!isSelectionMode && <MessageInput receiverId={selectedUser._id} type={type} />}

      {/* Simple More Actions Modal */}
      <SimpleMoreActionsModal
        isOpen={moreModalOpen}
        onClose={() => setMoreModalOpen(false)}
        actions={isSingleSelection ? singleSelectionMoreActions : multipleSelectionMoreActions}
      />

      {bulkForwardModal.isOpen && (
        <ForwardModal
          isOpen={bulkForwardModal.isOpen}
          onClose={() => setBulkForwardModal({ isOpen: false, messages: [] })}
          messages={bulkForwardModal.messages}
          onForward={handleBulkForward}
          isBulk={true}
        />
      )}

      {deleteModal && (
        <DeleteModal
          message={deleteModal.message}
          deleteType={deleteModal.deleteType}
          onDelete={(deleteType) => handleDeleteSelected(deleteType)}
          onClose={() => setDeleteModal(null)}
          isSendingMessage={false}
          isOwn={isFirstSelectedOwn()}
        />
      )}
    </div>
  );
};

export default ChatWindow;