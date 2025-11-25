import { useState } from 'react';
import { usePrivateChatStore, useGroupStore, usePinningStore, useStarringStore, useUIStore } from '@/stores';

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
  isSelectionMode,
  setIsSelectionMode,
}: any) => {
  const { deleteMessage: deletePrivate } = usePrivateChatStore();
  const { deleteMessage: deleteGroup } = useGroupStore();
  const { togglePinMessage, isPinning, pinnedMessages } = usePinningStore();
  const { toggleStarMessage, starredMessages } = useStarringStore();
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
    const firstMsg = getFirstSelectedMessage();
    const isCurrentlyStarred = firstMsg && starredMessages.includes(firstMsg._id);
    const action = isCurrentlyStarred ? 'unstarred' : 'starred';
    showToast(`${selectedMessages.length} message(s) ${action}`, 'success');
    clearSelection();
  };

  const handleCopySelected = async () => {
    const text = selectedMessages.map((id: string) => messages.find((m: any) => m._id === id)?.text).filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(text);
    showToast(`${selectedMessages.length} message(s) copied`, 'success');
    clearSelection();
  };

  const handleForwardSelected = () => {
    const msgs = selectedMessages.map((id: string) => messages.find((m: any) => m._id === id)).filter(Boolean);
    setBulkForwardModal({ isOpen: true, messages: msgs });
    clearSelection();
  };

  const handlePinSelected = async () => {
    const msg = getFirstSelectedMessage();
    const payload = type === 'group' ? { messageId: msg._id, groupId: selectedUser._id } : { messageId: msg._id, chatPartnerId: selectedUser._id };
    await togglePinMessage(payload);
    const isPinned = pinnedMessages.includes(msg._id);
    const action = isPinned ? 'unpinned' : 'pinned';
    showToast(`Message ${action}`, 'success');
    clearSelection();
  };

  const handleReplySelected = () => { 
    const msg = getFirstSelectedMessage();
    setReplyingTo({
      _id: msg._id,
      text: msg.text || '',
      image: msg.image || undefined,
      senderId: typeof msg.senderId === 'string' ? { _id: msg.senderId, fullName: 'User' } : msg.senderId,
    });
    clearSelection();
  };

  const handleDeleteSelected = async (deleteType?: 'me' | 'everyone') => {
    if (selectedMessages.length === 1 && !deleteType) {
      setDeleteModal({ message: getFirstSelectedMessage(), isBulk: false });
      return;
    }
    for (const id of selectedMessages) await deleteMessage({ messageId: id, deleteType: deleteType || 'me' });
    showToast(`${selectedMessages.length} message(s) deleted`, 'success');
    clearSelection();
    setDeleteModal(null);
  };

  const handleBulkForward = async (recipientIds: string[], msgs: any[]) => {
    const groups = useGroupStore.getState().groups;
    const contacts = usePrivateChatStore.getState().chats;
    const isSingleRecipient = recipientIds.length === 1;
    
    // Close modal immediately
    setBulkForwardModal({ isOpen: false, messages: [] });
    
    // For single recipient, navigate FIRST before sending
    // This ensures optimistic updates appear in the correct chat
    if (isSingleRecipient) {
      const recipientId = recipientIds[0];
      const isGroup = groups.some((g: any) => g._id === recipientId);
      
      if (isGroup) {
        const targetGroup = groups.find((g: any) => g._id === recipientId);
        if (targetGroup) {
          // IMPORTANT: Set activeTab to 'groups' so ChatWindow gets correct type prop
          useUIStore.getState().setActiveTab('groups');
          setSelectedUser({ 
            ...targetGroup,
            _id: targetGroup._id,
            name: targetGroup.name,
            groupImage: targetGroup.groupImage,
            members: targetGroup.members,
            admin: targetGroup.admins,
          });
        }
      } else {
        // IMPORTANT: Set activeTab to 'chats' so ChatWindow gets correct type prop
        useUIStore.getState().setActiveTab('chats');
        
        const targetChat = contacts.find((c: any) => {
          const chatPartnerId = c.participants?.find((p: string) => p !== getAuthId()) || c._id;
          return chatPartnerId === recipientId || c._id === recipientId;
        });
        
        if (targetChat) {
          const partnerId = targetChat.participants?.find((p: string) => p !== getAuthId()) || recipientId;
          setSelectedUser({ 
            ...targetChat, 
            _id: partnerId,
            chatPartnerId: partnerId,
          });
        } else {
          setSelectedUser({ _id: recipientId, chatPartnerId: recipientId });
        }
      }
      
      // Small delay to ensure navigation completes before sending
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Now send the messages
    for (const recipientId of recipientIds) {
      const isGroup = groups.some((g: any) => g._id === recipientId);
      
      for (const msg of msgs) {
        const data: any = {
          replyTo: '',
          isForwarded: true
        };
        
        if (msg.text && msg.text.trim()) {
          data.text = msg.text;
        }
        
        if (msg.image) {
          data.image = msg.image;
        }
        
        if (!data.text && !data.image) {
          console.warn('Skipping message with no content:', msg._id);
          continue;
        }
        
        try {
          if (isGroup) {
            await useGroupStore.getState().sendGroupMessage(recipientId, data);
          } else {
            await usePrivateChatStore.getState().sendPrivateMessage(recipientId, data);
          }
        } catch (error) {
          console.error('Failed to forward message:', error);
        }
      }
    }
    
    showToast(`Forwarded ${msgs.length} message(s) to ${recipientIds.length} chat(s)`, 'success');
  };

  const isFirstSelectedPinned = () => selectedMessages.length === 1 && pinnedMessages.includes(selectedMessages[0]);
  const isFirstSelectedStarred = () => selectedMessages.length === 1 && starredMessages.includes(selectedMessages[0]);
  const isFirstSelectedOwn = () => {
    const msg = getFirstSelectedMessage();
    const authId = getAuthId();
    const senderId = typeof msg?.senderId === 'object' ? msg.senderId._id : msg?.senderId;
    return msg && authId && senderId === authId;
  };

  const singleSelectionMoreActions = [
    { 
      label: isFirstSelectedPinned() ? 'Unpin' : 'Pin', 
      onClick: handlePinSelected, 
      disabled: isPinning === getFirstSelectedMessage()?._id 
    },
    { 
      label: isFirstSelectedStarred() ? 'Unstar' : 'Star', 
      onClick: handleStarSelected, 
      disabled: false 
    },
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
    isFirstSelectedStarred,
    isFirstSelectedOwn,
    isSingleSelection: selectedMessages.length === 1,
  };
};