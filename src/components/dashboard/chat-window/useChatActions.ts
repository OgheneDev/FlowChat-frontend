// components/chat/actions/useChatActions.ts
import { useState, useCallback } from 'react';
import { usePrivateChatStore, useGroupStore, usePinningStore, useStarringStore, useUIStore } from '@/stores';

export const useChatActions = ({
  type,
  selectedUser,
  messages,
  selectedMessages,
  setSelectedMessages,
  clearSelection, // This already handles both selectedMessages and isSelectionMode
  showToast,
  messageListRef,
  setReplyingTo,
  getAuthUserId: getAuthId,
  isSelectionMode,
  setIsSelectionMode,
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

  const handleStarSelected = async () => {
    for (const id of selectedMessages) await toggleStarMessage(id);
    showToast(`${selectedMessages.length} message(s) starred`, 'success');
    clearSelection(); // Clear after action
  };

  const handleCopySelected = async () => {
    const text = selectedMessages.map((id: string) => messages.find((m: any) => m._id === id)?.text).join('\n\n');
    await navigator.clipboard.writeText(text);
    showToast(`${selectedMessages.length} message(s) copied`, 'success');
    clearSelection(); // Clear after action
  };

  const handleForwardSelected = () => {
    const msgs = selectedMessages.map((id: string) => messages.find((m: any) => m._id === id)).filter(Boolean);
    setBulkForwardModal({ isOpen: true, messages: msgs });
    clearSelection(); // Clear immediately when opening forward modal
  };

  const handlePinSelected = async () => {
    const msg = getFirstSelectedMessage();
    const payload = type === 'group' ? { messageId: msg._id, groupId: selectedUser._id } : { messageId: msg._id, chatPartnerId: selectedUser._id };
    await togglePinMessage(payload);
    showToast('Message pinned', 'success');
    clearSelection(); // Clear after action
  };

  const handleReplySelected = () => {
    const msg = getFirstSelectedMessage();
    setReplyingTo({
      _id: msg._id,
      text: msg.text || '',
      image: msg.image || undefined,
      senderId: typeof msg.senderId === 'string' ? { _id: msg.senderId, fullName: 'User' } : msg.senderId,
    });
    clearSelection(); // Clear after action
  };

  const handleDeleteSelected = async (deleteType?: 'me' | 'everyone') => {
    if (selectedMessages.length === 1 && !deleteType) {
      setDeleteModal({ message: getFirstSelectedMessage(), isBulk: false });
      // Don't clear here - wait for user to confirm/cancel in modal
      return;
    }
    for (const id of selectedMessages) await deleteMessage({ messageId: id, deleteType: deleteType || 'me' });
    showToast(`${selectedMessages.length} message(s) deleted`, 'success');
    clearSelection(); // Clear after deletion is confirmed
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
    setBulkForwardModal({ isOpen: false, messages: [] });
    // No need to clear selection here - already cleared when modal opened
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
    clearSelection,
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