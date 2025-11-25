import React, { useState, forwardRef, useEffect } from "react";
import { CheckCheck, Forward } from "lucide-react";
import { usePrivateChatStore, useGroupStore, useUIStore, useStarringStore, usePinningStore } from "@/stores";
import { formatTime } from "@/utils/utils";
import useContextMenu from "@/hooks/useContextMenu";
import { ImageModal } from "./ImageModal";
import ContextMenu from "../message-actions/ContextMenu";
import DeleteModal from "../message-actions/DeleteModal"; 
import ForwardModal from "../message-actions/ForwardModal";
import MessageBubble from "./MessageBubble"; 
import MessageMedia from "./MessageMedia";
import MessageReplyPreview from "./MessageReplyPreview";
import MessageMeta from "./MessageMeta";
import SelectionCheckbox from "../selection/SelectionCheckbox"; 

interface MessageItemProps {
  message: any; 
  index: number;
  type: "user" | "contact" | "group";
  authUser: { _id: string } | null;
  messages: any[];
  isSendingMessage: boolean;
  selectedUser?: any;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
  onSelectMode?: (message: any) => void;
}

const MessageItem = forwardRef<HTMLDivElement, MessageItemProps>(
  ({ 
    message, 
    index, 
    type, 
    authUser, 
    messages, 
    isSendingMessage, 
    selectedUser, 
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect,
    onSelectMode
  }, ref) => {
    const { setReplyingTo } = useUIStore();
    const { toggleStarMessage, starredMessages } = useStarringStore();
    const { deleteMessage: deletePrivate, editMessage: editPrivate } = usePrivateChatStore();
    const { deleteMessage: deleteGroup, editMessage: editGroup } = useGroupStore();
    const { isMessagePinned } = usePinningStore();

    const [fullImage, setFullImage] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [deleteModal, setDeleteModal] = useState<{ message: any; deleteType?: "me" | "everyone" } | null>(null);
    const [forwardModal, setForwardModal] = useState<{ isOpen: boolean; message: any }>({
      isOpen: false,
      message: null
    });
    const [isLongPressing, setIsLongPressing] = useState(false);

    const deleteMessage = type === "group" ? deleteGroup : deletePrivate;
    const editMessage = type === "group" ? editGroup : editPrivate;
    const isStarred = starredMessages.includes(message._id);
    const isPinned = isMessagePinned(message._id);

    const { contextMenu, setContextMenu, contextMenuRef, showContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd } = useContextMenu();

    const senderId = message.senderId?._id;
    const isOwn = senderId === authUser?._id;

    // Determine if an image message is still pending (optimistic)
    const isPendingImage = Boolean(
  message.image &&
  typeof message._id === "string" && 
  message._id.startsWith("temp-")
);

    let senderFullName: string | null = null;

    if (!isOwn && typeof message.senderId === "object") {
      senderFullName = message.senderId.fullName || null;
    }

    const showDateSeparator =
      index === 0 ||
      new Date(messages[index - 1].createdAt).toDateString() !==
        new Date(message.createdAt).toDateString();

    const isEditing = editingMessageId === message._id;

    // Handle long press event from useContextMenu
    useEffect(() => {
      const handleLongPress = (event: CustomEvent) => {
        if (event.detail.message._id === message._id && onSelectMode) {
          setIsLongPressing(true);
          onSelectMode(event.detail.message);
          
          // Reset long press state after animation
          setTimeout(() => setIsLongPressing(false), 200);
        }
      };

      window.addEventListener('messageLongPress', handleLongPress as EventListener);
      
      return () => {
        window.removeEventListener('messageLongPress', handleLongPress as EventListener);
      };
    }, [message._id, onSelectMode]);

    // Handler functions
    const closeContextMenu = () => {
      setContextMenu(null);
    };

    const startReply = (msg: any) => {
      setReplyingTo({
        _id: msg._id,
        text: msg.text,
        image: msg.image,
        senderId: msg.senderId,
      });
      closeContextMenu();
    };

    const handleEdit = (msg: any) => {
      setEditingMessageId(msg._id);
      setEditText(msg.text ?? "");
      closeContextMenu();
    };

    const saveEdit = async () => {
      if (!editingMessageId || !editText.trim()) return;
      try {
        await editMessage(editingMessageId, { text: editText.trim() });
        setEditingMessageId(null);
        setEditText("");
      } catch (err) {
        console.error("Edit failed:", err);
      }
    };

    const cancelEdit = () => {
      setEditingMessageId(null);
      setEditText("");
    };

    const handleDelete = async (deleteType: "me" | "everyone") => {
      if (!deleteModal) return;
      try {
        await deleteMessage({
          messageId: deleteModal.message._id,
          deleteType,
        });
      } catch (err) {
        console.error("Delete failed:", err);
      }
      setDeleteModal(null);
      closeContextMenu();
    };

    const openDeleteModal = (msg: any, deleteType?: "me" | "everyone") => {
      setDeleteModal({ message: msg, deleteType });
    };

    const handleContextMenuDelete = (msg: any, deleteType?: "me" | "everyone") => {
      openDeleteModal(msg, deleteType);
      closeContextMenu();
    };

    const handleStarToggle = async (msgId: string) => {
      try {
        await toggleStarMessage(msgId);
      } catch (e) {
        console.error(e);
      }
      closeContextMenu();
    };

    const handleForward = (msg: any) => {
      setForwardModal({
        isOpen: true,
        message: msg
      });
      closeContextMenu();
    };

    const handleForwardMessages = async (selectedIds: string[], messagesToForward: any[]) => {
  const groups = useGroupStore.getState().groups;
  const chats = usePrivateChatStore.getState().chats;
  const authUserId = authUser?._id;
  const isSingleRecipient = selectedIds.length === 1;
  
  // Close modal first
  setForwardModal({ isOpen: false, message: null });
  
  try {
    // For single recipient, navigate FIRST before sending
    if (isSingleRecipient) {
      const recipientId = selectedIds[0];
      const isGroup = groups.some((g: any) => g._id === recipientId);
      
      if (isGroup) {
        const targetGroup = groups.find((g: any) => g._id === recipientId);
        if (targetGroup) {
          // IMPORTANT: Set activeTab to 'groups' so ChatWindow gets correct type prop
          useUIStore.getState().setActiveTab('groups');
          useUIStore.getState().setSelectedUser({ 
            ...targetGroup,
            _id: targetGroup._id,
            name: targetGroup.name,
            groupImage: targetGroup.groupImage,
            members: targetGroup.members,
            admin: targetGroup.admins,
          });
        }
      } else {
        const targetChat = chats.find((c: any) => {
          const chatPartnerId = c.participants?.find((p: string) => p !== authUserId) || c._id;
          return chatPartnerId === recipientId || c._id === recipientId;
        });
        
        // IMPORTANT: Set activeTab to 'chats' so ChatWindow gets correct type prop
        useUIStore.getState().setActiveTab('chats');
        
        if (targetChat) {
          const partnerId = targetChat.participants?.find((p: string) => p !== authUserId) || recipientId;
          useUIStore.getState().setSelectedUser({ 
            ...targetChat, 
            _id: partnerId,
            chatPartnerId: partnerId,
          });
        } else {
          useUIStore.getState().setSelectedUser({ 
            _id: recipientId, 
            chatPartnerId: recipientId, 
          });
        }
      }
      
      // Small delay to ensure navigation completes before sending
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Now send the messages
    for (const recipientId of selectedIds) {
      const isGroup = groups.some((g: any) => g._id === recipientId);
      
      for (const msg of messagesToForward) {
        await sendForwardedMessage(recipientId, msg, isGroup);
      }
    }
  } catch (error) {
    console.error("Error forwarding message:", error);
  }
};

const sendForwardedMessage = async (
  recipientId: string, 
  message: any, 
  isGroup: boolean = false
) => {
  const text = message?.text || message?.content || message?.body || '';
  const image = message?.image || message?.media || message?.attachment || '';
  
  const messageData: any = {
    replyTo: '',
    isForwarded: true
  };

  if (text && typeof text === 'string' && text.trim()) {
    messageData.text = text.trim();
  }

  if (image && typeof image === 'string' && image.trim()) {
    messageData.image = image;
  }

  if (!messageData.text && !messageData.image) {
    throw new Error('Cannot forward message: no text or image content');
  }

  if (isGroup) {
    await useGroupStore.getState().sendGroupMessage(recipientId, messageData);
  } else {
    await usePrivateChatStore.getState().sendPrivateMessage(recipientId, messageData);
  }
};

    const handleSelectMode = (msg: any) => {
      if (onSelectMode) {
        onSelectMode(msg);
      }
    };

    const handleMessageClick = () => {
      if (isSelectionMode && onToggleSelect) {
        onToggleSelect(message._id);
      }
    };

    const handleImageClick = () => {
      if (!isSelectionMode && message.image) {
        setFullImage(message.image);
      }
    };

    // Custom touch handlers that work with selection mode
    const handleMessageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isSelectionMode) {
        handleTouchStart(e, message);
      } else {
        e.preventDefault();
      } 
    };

    const handleMessageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isSelectionMode) {
        handleTouchMove(e);
      } else {
        e.preventDefault();
      }
    };

    const handleMessageTouchEnd = () => {
      if (!isSelectionMode) {
        handleTouchEnd();
      }
    };

    if (message.isDeleted && message.text === "You deleted this message") {
      return (
        <div
          ref={ref}
          className={`flex gap-3 group transition-all duration-300 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <div className="flex flex-col gap-1 max-w-[70%] sm:max-w-[60%]">
            <div className="relative rounded-2xl overflow-hidden transition-all duration-300 bg-[#1f1f1f] shadow-lg border border-[#2a2a2a] opacity-70">
              <p className="px-4 py-3 text-sm leading-relaxed text-gray-400 italic">
                {message.text}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-1 text-xs text-[#666] ${isOwn ? "justify-end" : "justify-start"}`}>
              <span>{formatTime(message.createdAt)}</span>
              {isOwn && <CheckCheck className="w-4 h-4 text-[#00d9ff] opacity-80" />}
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {showDateSeparator && (
          <div className="flex items-center justify-center my-6">
            <div className="px-4 py-1.5 bg-[#1a1a1a]/90 backdrop-blur-md rounded-full text-xs font-medium text-[#888] border border-[#2a2a2a] shadow-sm">
              {new Date(message.createdAt).toLocaleDateString("en-US", {
                weekday: "short", 
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        )}

        <div
          ref={ref}
          data-message-id={message._id}  // Add this line
          className={`flex gap-3 group transition-all duration-300 message-item ${
            isSelectionMode ? 'cursor-pointer selectable-message' : ''
          } ${
            isSelected ? 'bg-[#00d9ff]/10 rounded-xl border border-[#00d9ff]/20' : ''
          } ${
            isLongPressing ? 'bg-[#00d9ff]/15 scale-[0.98] rounded-xl' : '' 
          }`}
          onTouchStart={handleMessageTouchStart}
          onTouchMove={handleMessageTouchMove}
          onTouchEnd={handleMessageTouchEnd}
          onTouchCancel={handleMessageTouchEnd}
          onClick={handleMessageClick}
        >
          {/* Selection Checkbox - positioned based on ownership */}
          <SelectionCheckbox
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
            isOwn={isOwn}
          />

          {/* Message content column */}
          <div className={`flex flex-col gap-1.5 flex-1 min-w-0 ${
            isOwn ? "items-end" : "items-start"
          }`}>
            
            {/* Forwarded Indicator */}
            {message.isForwarded && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${
                isOwn ? 'justify-end' : 'justify-start'
              }`}>
                <Forward className="w-3 h-3 text-[#8696a0]" />
                <span className="text-[#8696a0]">Forwarded</span>
              </div>
            )}

            {/* Sender Name in Group */}
            {type === "group" && !isOwn && typeof message.senderId === "object" && (
              <span className="text-xs font-semibold text-[#00d9ff] ml-1 tracking-tight">
                {message.senderId.fullName}
              </span>
            )}

            {/* Reply preview */}
            {message.replyTo && (
              <MessageReplyPreview
                replyTo={message.replyTo}
                isOwn={isOwn}
                authUser={authUser ?? undefined}
              />
            )}

            {/* Main bubble + image (use modular components) */}
            <MessageBubble
              message={message}
              isOwn={isOwn}
              isEditing={isEditing}
              editText={editText}
              setEditText={setEditText}
              saveEdit={saveEdit}
              cancelEdit={cancelEdit}
              onContextMenu={(e:any) => showContextMenu(e, message)}
            >
              {message.image && (
                <div className="relative">
                  <MessageMedia src={message.image} onClick={handleImageClick} />
                  {isPendingImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {message.text && !isEditing && (
                <p className={`px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? "text-white font-medium" : "text-gray-100"}`}>
                  {message.text}
                  {message.editedAt && <span className="text-xs opacity-70 ml-2 inline-block italic">edited</span>}
                </p>
              )}
            </MessageBubble>

            {/* Timestamp & status */}
            <MessageMeta
              message={message}
              isOwn={isOwn}
              isStarred={isStarred}
              isPinned={isPinned}
            />
          </div>
        </div>

        {/* Only show context menu on non-mobile devices */}
        {contextMenu && contextMenu.message._id === message._id && (
          <ContextMenu
            contextMenu={contextMenu}
            contextMenuRef={contextMenuRef}
            message={message}
            isStarred={isStarred} 
            onReply={startReply}
            onEdit={handleEdit}
            onStarToggle={handleStarToggle}
            onDelete={handleContextMenuDelete}
            onForward={handleForward}
            onClose={closeContextMenu}
            isSendingMessage={isSendingMessage}
            isOwn={isOwn}
            type={type}
            selectedUser={selectedUser}
            onSelectMode={handleSelectMode}
          />
        )}

        {deleteModal && ( 
          <DeleteModal
            message={deleteModal.message}
            deleteType={deleteModal.deleteType}
            onDelete={handleDelete}
            onClose={() => setDeleteModal(null)}
            isSendingMessage={isSendingMessage}
            isOwn={isOwn}
          />
        )}

        {fullImage && <ImageModal src={fullImage} onClose={() => setFullImage(null)} />}

        <ForwardModal 
          isOpen={forwardModal.isOpen}
          message={forwardModal.message}
          onForward={handleForwardMessages}
          onClose={() => setForwardModal({ isOpen: false, message: null })}
        />
      </>
    );
  }
);

MessageItem.displayName = "MessageItem";

export default MessageItem;