import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePrivateChatStore, useGroupStore, useUIStore, usePinningStore, useAuthStore, useToastStore } from '@/stores';
import MessageList from './message-list/MessageList';
import MessageInput from './message-input/MessageInput';
import ChatHeader from './ChatHeader';
import SelectionHeader from './selection/SelectionHeader';
import PinnedMessagesPanel from './pinned-message/PinnedMessagesPanel';
import ForwardModalWrapper from './message-actions/ForwardModalWrapper';
import DeleteModalWrapper from './message-actions/DeleteModalWrapper';
import { useChatActions } from '@/hooks/useChatActions';
import { getAuthUserId } from '@/utils/utils';
import { MoreActionsModal } from './selection/MoreActionsModal';
import { EmptyChatState } from './EmptyChatState';

interface ChatWindowProps {
  selectedUser: any;
  type: 'user' | 'contact' | 'group';
}

const ChatWindow = ({ selectedUser, type }: ChatWindowProps) => {
  const { 
    privateMessages, 
    isMessagesLoading: isPrivateMessagesLoading, 
    getPrivateMessages, 
    initializeSocketListeners, 
    cleanupSocketListeners,
    markMessagesAsSeen,
    clearUnreadCount: clearPrivateUnreadCount
  } = usePrivateChatStore();
  const { 
    groupMessages, 
    isMessagesLoading: isGroupMessagesLoading, 
    getGroupMessages, 
    initializeGroupSocketListeners, 
    cleanupGroupSocketListeners, 
    markGroupMessagesAsSeen,
    clearUnreadCount: clearGroupUnreadCount
  } = useGroupStore(); 
  const { setSelectedUser, scrollToMessageId, setScrollToMessageId, clearReply } = useUIStore();
  const { pinnedMessages, loadPinnedMessagesForChat } = usePinningStore();
  const { showToast } = useToastStore();
  const { socket, authUser } = useAuthStore();

  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const messageListRef = useRef<any>(null);

  const messages = type === 'group' ? groupMessages : privateMessages;
  const isLoading = type === 'group' ? isGroupMessagesLoading : isPrivateMessagesLoading;

  const clearSelection = useCallback(() => {
    setSelectedMessages([]);
    setIsSelectionMode(false);
    if (messageListRef.current) {
      messageListRef.current.clearSelection?.();
    }
  }, []);

  // ✅ FIXED: Clear selection mode when selected user changes
  useEffect(() => {
    clearSelection();
  }, [selectedUser, type, clearSelection]);

  // ✅ FIXED: Clear unread counts IMMEDIATELY and on backend when selecting a chat
  useEffect(() => {
    if (selectedUser) {
      const chatId = type === 'group' 
        ? selectedUser._id 
        : (selectedUser.chatPartnerId || selectedUser._id);
      
      console.log(`📬 Opening chat: ${chatId}, clearing unread immediately`);
      
      if (type === 'group') {
        // Clear locally first for instant UI update
        clearGroupUnreadCount(chatId);
        
        // Update the group in the list
        useGroupStore.setState(state => ({
          groups: state.groups.map(g => 
            g._id === chatId ? { ...g, unreadCount: 0 } : g
          )
        }));
        
        // ✅ IMMEDIATELY mark as seen on backend (no delay!)
        markGroupMessagesAsSeen(chatId);
      } else {
        // Clear locally first for instant UI update
        clearPrivateUnreadCount(chatId);
        
        // Update the chat in the list
        usePrivateChatStore.setState(state => ({
          chats: state.chats.map(c => {
            const partnerId = c.participants?.find(
              p => p !== useAuthStore.getState().authUser?._id
            ) || c._id;
            return partnerId === chatId ? { ...c, unreadCount: 0 } : c;
          })
        }));
        
        // ✅ IMMEDIATELY mark as seen on backend (no delay!)
        markMessagesAsSeen(chatId);
      }
    }
  }, [selectedUser, type, markMessagesAsSeen, markGroupMessagesAsSeen, clearPrivateUnreadCount, clearGroupUnreadCount]);

  // Socket initialization and cleanup
  useEffect(() => {
    if (authUser && socket?.connected) {
      console.log('Initializing socket listeners for real-time chat...');
      
      if (type === 'group') {
        initializeGroupSocketListeners();
      } else {
        initializeSocketListeners();
      }
    }

    return () => {
      console.log('Cleaning up socket listeners...');
      if (type === 'group') {
        cleanupGroupSocketListeners();
      } else {
        cleanupSocketListeners();
      }
    };
  }, [authUser, socket?.connected, type, initializeSocketListeners, cleanupSocketListeners, initializeGroupSocketListeners, cleanupGroupSocketListeners]);

  // Handle scroll to message
  useEffect(() => {
    if (scrollToMessageId && messageListRef.current) {
      const timer = setTimeout(() => {
        messageListRef.current?.scrollToMessage(scrollToMessageId);
        setScrollToMessageId(null);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [scrollToMessageId, setScrollToMessageId, messages]);

  // Load messages and pinned messages when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      console.log(`Loading ${type} messages for:`, selectedUser._id);
      if (type === 'group') {
        getGroupMessages(selectedUser._id);
        loadPinnedMessagesForChat({ groupId: selectedUser._id });
      } else {
        getPrivateMessages(selectedUser._id);
        loadPinnedMessagesForChat({ chatPartnerId: selectedUser._id });
      }
    }
  }, [selectedUser, type, getPrivateMessages, getGroupMessages, loadPinnedMessagesForChat]);

  // Clear reply preview when selectedUser changes
  useEffect(() => {
    clearReply();
  }, [selectedUser, clearReply]);

  // Chat actions
  const {
    handleBack,
    handleStarSelected,
    handleCopySelected,
    handleForwardSelected,
    handlePinSelected,
    handleReplySelected,
    handleDeleteSelected,
    handleBulkForward,
    bulkForwardModal,
    setBulkForwardModal,
    deleteModal,
    setDeleteModal,
    moreModalOpen,
    setMoreModalOpen,
    singleSelectionMoreActions,
    multipleSelectionMoreActions,
    isFirstSelectedPinned,
    isFirstSelectedOwn, 
    isSingleSelection,
  } = useChatActions({
    type,
    selectedUser,
    messages,
    selectedMessages,
    setSelectedMessages,
    clearSelection,
    showToast,
    messageListRef,
    setReplyingTo: useUIStore.getState().setReplyingTo,
    getAuthUserId,
    setSelectedUser,
    isSelectionMode,
    setIsSelectionMode,
  });

  if (!selectedUser) {
    return <EmptyChatState type={type} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#1e1e1e] md:flex-1">
      {isSelectionMode ? (
        <SelectionHeader
          selectedCount={selectedMessages.length}
          isSingle={isSingleSelection}
          onCancel={clearSelection}
          onReply={handleReplySelected}
          onForward={handleForwardSelected}
          onDelete={() => handleDeleteSelected()}
          onCopy={handleCopySelected}
          onStar={handleStarSelected}
          onMore={() => setMoreModalOpen(true)}
        />
      ) : (
        <ChatHeader
          selectedUser={selectedUser}
          type={type}
          pinnedCount={pinnedMessages.length}
          showPinned={showPinnedMessages}
          onTogglePinned={() => setShowPinnedMessages((s) => !s)}
          onBack={handleBack}
        />
      )}

      <PinnedMessagesPanel
        isVisible={showPinnedMessages && !isSelectionMode}
        messageIds={pinnedMessages.slice(0, 3)}
        type={type}
        selectedUser={selectedUser}
        onClose={() => setShowPinnedMessages(false)}
      />

      <MessageList
        ref={messageListRef}
        isLoading={isLoading}
        type={type}
        selectedUser={selectedUser}
        onSelectionModeChange={setIsSelectionMode}
        onSelectedMessagesChange={setSelectedMessages}
      />

      {!isSelectionMode && <MessageInput receiverId={selectedUser._id} type={type} />}

      <ForwardModalWrapper
        isOpen={bulkForwardModal.isOpen}
        messages={bulkForwardModal.messages}
        onForward={handleBulkForward}
        onClose={() => setBulkForwardModal({ isOpen: false, messages: [] })}
      />

      <DeleteModalWrapper
        modal={deleteModal}
        isOwn={isFirstSelectedOwn()}
        onDelete={handleDeleteSelected}
        onClose={() => setDeleteModal(null)} 
      />

      <MoreActionsModal
        isOpen={moreModalOpen}
        onClose={() => setMoreModalOpen(false)}
        actions={isSingleSelection ? singleSelectionMoreActions : multipleSelectionMoreActions}
      />
    </div>
  );
};

export default ChatWindow;