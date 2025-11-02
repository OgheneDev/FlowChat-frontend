// components/chat/actions/useChatActions.ts
import { useState, useCallback } from 'react';
import { usePrivateChatStore, useGroupStore, usePinningStore, useStarringStore, useUIStore } from '@/stores';
import { useToastStore } from '@/stores';
import { getAuthUserId } from '@/utils/utils';

export const useChatActions = ({
  type,
  selectedUser,
  messages,
  selectedMessages,
  setSelectedMessages,
  clearSelection,
  showToast,
  messageListRef,
  setReplyingTo,
  getAuthUserId: getAuthId,
  isSelectionMode, // Add this parameter
  setIsSelectionMode, // Add this parameter
}: any) => {
  const { deleteMessage: deletePrivate } = usePrivateChatStore();
  const { deleteMessage: deleteGroup } = useGroupStore();
  const { togglePinMessage, isPinning, pinnedMessages } = usePinningStore();
  const { toggleStarMessage } = useStarringStore();
  const { setSelectedUser } = useUIStore();

  const deleteMessage = type === 'group' ? deleteGroup : deletePrivate;

  const [bulkForwardModal, setBulkForwardModal] = useState({ isOpen: false, messages: [] });
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [moreModalOpen, setMoreModalOpen] = useState(false);

  const getFirstSelectedMessage = () => messages.find((m: any) => m._id === selectedMessages[0]);

  const handleBack = () => {
    if (isSelectionMode) {
      clearSelection();
    } else {
      setSelectedUser(null);
    }
  };

  // Update clearSelection to also exit selection mode
  const enhancedClearSelection = useCallback(() => {
    setSelectedMessages([]);
    setIsSelectionMode(false);
  }, [setSelectedMessages, setIsSelectionMode]);

  const handleStarSelected = async () => {
    for (const id of selectedMessages) await toggleStarMessage(id);
    showToast(`${selectedMessages.length} message(s) starred`, 'success');
    enhancedClearSelection();
  };

  const handleCopySelected = async () => {
    const text = selectedMessages.map((id: string) => messages.find((m: any) => m._id === id)?.text).join('\n\n');
    await navigator.clipboard.writeText(text);
    showToast(`${selectedMessages.length} message(s) copied`, 'success');
    enhancedClearSelection();
  };

  const handleForwardSelected = () => {
    const msgs = selectedMessages.map((id: string) => messages.find((m: any) => m._id === id)).filter(Boolean);
    setBulkForwardModal({ isOpen: true, messages: msgs });
  };

  const handlePinSelected = async () => {
    const msg = getFirstSelectedMessage();
    const payload = type === 'group' ? { messageId: msg._id, groupId: selectedUser._id } : { messageId: msg._id, chatPartnerId: selectedUser._id };
    await togglePinMessage(payload);
    showToast('Message pinned', 'success');
    enhancedClearSelection();
  };

  const handleReplySelected = () => {
    const msg = getFirstSelectedMessage();
    setReplyingTo({
      _id: msg._id,
      text: msg.text || '',
      image: msg.image || undefined,
      senderId: typeof msg.senderId === 'string' ? { _id: msg.senderId, fullName: 'User' } : msg.senderId,
    });
    enhancedClearSelection();
  };

  const handleDeleteSelected = async (deleteType?: 'me' | 'everyone') => {
    if (selectedMessages.length === 1 && !deleteType) {
      setDeleteModal({ message: getFirstSelectedMessage(), isBulk: false });
      return;
    }
    for (const id of selectedMessages) await deleteMessage({ messageId: id, deleteType: deleteType || 'me' });
    showToast(`${selectedMessages.length} message(s) deleted`, 'success');
    enhancedClearSelection();
    setDeleteModal(null);
  };

  const handleBulkForward = async (ids: string[], msgs: any[]) => {
    const groups = useGroupStore.getState().groups;
    for (const recipientId of ids) {
      for (const msg of msgs) {
        const data = { text: msg.text || '', image: msg.image || '', replyTo: '', isForwarded: true };
        const isGroup = groups.some((g: any) => g._id === recipientId);
        isGroup
          ? await useGroupStore.getState().sendGroupMessage(recipientId, data)
          : await usePrivateChatStore.getState().sendPrivateMessage(recipientId, data);
      }
    }
    showToast(`Forwarded ${msgs.length} message(s)`, 'success');
    enhancedClearSelection();
    setBulkForwardModal({ isOpen: false, messages: [] });
  };

  const isFirstSelectedPinned = () => selectedMessages.length === 1 && pinnedMessages.includes(selectedMessages[0]);
  const isFirstSelectedOwn = () => {
    const msg = getFirstSelectedMessage();
    const authId = getAuthId();
    return msg && authId && msg.senderId === authId;
  };

  const singleSelectionMoreActions = [
    { label: isFirstSelectedPinned() ? 'Unpin' : 'Pin', onClick: handlePinSelected, disabled: isPinning === getFirstSelectedMessage()?._id },
    { label: 'Star', onClick: handleStarSelected, disabled: false },
  ];

  const multipleSelectionMoreActions = [
    { label: 'Star', onClick: handleStarSelected, disabled: selectedMessages.length === 0 },
  ];

  return {
    handleBack,
    clearSelection: enhancedClearSelection, // Return the enhanced version
    handleSelectedMessagesChange: setSelectedMessages,
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
    isSingleSelection: selectedMessages.length === 1,
  };
};