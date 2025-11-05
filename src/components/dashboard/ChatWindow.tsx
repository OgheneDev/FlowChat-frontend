import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePrivateChatStore, useGroupStore, useUIStore, usePinningStore } from '@/stores';
import { useToastStore } from '@/stores/modules/toast';
import MessageList from './chat-window/messages/MessageList';
import MessageInput from './chat-window/messages/MessageInput';
import ChatHeader from './chat-window/ChatHeader';
import SelectionHeader from './chat-window/SelectionHeader';
import PinnedMessagesPanel from './chat-window/PinnedMessagesPanel';
import ForwardModalWrapper from './chat-window/ForwardModalWrapper';
import DeleteModalWrapper from './chat-window/DeleteModalWrapper';
import { useChatActions } from './chat-window/useChatActions';
import { getAuthUserId } from '@/utils/utils';
import { MoreActionsModal } from '../modals/MoreActionsModal';
import { User, MessageCircle } from 'lucide-react';

interface ChatWindowProps {
  selectedUser: any;
  type: 'user' | 'contact' | 'group';
}

const ChatWindow = ({ selectedUser, type }: ChatWindowProps) => {
  const { privateMessages, isMessagesLoading, getPrivateMessages } = usePrivateChatStore();
  const { groupMessages, getGroupMessages, getGroupById, currentGroup } = useGroupStore(); 
  const { setSelectedUser } = useUIStore();
  const { pinnedMessages, loadPinnedMessagesForChat } = usePinningStore();
  const { showToast } = useToastStore();

  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const messageListRef = useRef<any>(null);

  const messages = type === 'group' ? groupMessages : privateMessages;

  // Define clearSelection before using it in useChatActions
  const clearSelection = useCallback(() => {
    setSelectedMessages([]);
    setIsSelectionMode(false);
  }, []);

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
        isLoading={isMessagesLoading}
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

const EmptyChatState = ({ type }: { type: 'group' | 'user' | 'contact' }) => (
  <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#1e1e1e]">
    <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mx-auto w-28 h-28">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a]/20 to-[#00b8d4]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative size-full rounded-full bg-[#2a2a2a] flex items-center justify-center">
          {type === 'group' ? (
            <User className="w-14 h-14 text-[#666]" />
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

export default ChatWindow;