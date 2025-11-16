import React, { useState, forwardRef, useEffect } from "react";
import { Reply, CheckCheck, Star, X, CheckCheck as CheckIcon, Forward, Check, Pin } from "lucide-react";
import { usePrivateChatStore, useGroupStore, useUIStore, useStarringStore, usePinningStore } from "@/stores";
import { formatTime } from "@/utils/utils";
import useContextMenu from "../useContextMenu";
import { ImageModal } from "../../../modals/ImageModal";
import ContextMenu from "../ContextMenu";
import DeleteModal from "../../../modals/DeleteModal"; 
import ForwardModal from "../../../modals/ForwardModal";

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
    let senderFullName: string | null = null;
    let senderProfilePic: string | null = null;

    if (!isOwn && typeof message.senderId === "object") {
      senderFullName = message.senderId.fullName || null;
      senderProfilePic = message.senderId.profilePic || null;
    }

    const showDateSeparator =
      index === 0 ||
      new Date(messages[index - 1].createdAt).toDateString() !==
        new Date(message.createdAt).toDateString();

    const isEditing = editingMessageId === message._id;
    const initials = senderFullName
      ? senderFullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
      : "?";

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

    const handleForwardMessages = async (selectedIds: string[], messageToForward: any) => {
      try {
        for (const id of selectedIds) {
          await sendForwardedMessage(id, messageToForward);
        }
        console.log(`Message forwarded to ${selectedIds.length} chats`);
      } catch (error) {
        console.error("Error forwarding message:", error);
      }
    };

    const sendForwardedMessage = async (recipientId: string, message: any) => {
      const messageData = {
        text: message.text || "",
        image: message.image || "",
        replyTo: "",
        isForwarded: true
      };

      await usePrivateChatStore.getState().sendPrivateMessage(recipientId, messageData);
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
      }
    };

    const handleMessageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isSelectionMode) {
        handleTouchMove(e);
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
          {isSelectionMode && (
            <div className={`flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              isOwn ? 'ml-2 order-3' : 'mr-2'
            }`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                isSelected 
                  ? 'bg-[#00d9ff] border-[#00d9ff] scale-110' 
                  : 'border-[#666] hover:border-[#00d9ff] hover:scale-105'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          )}

          {/* Message Content Container - Constrained width */}
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
            {type === "group" && !isOwn && senderFullName && (
              <span className="text-xs font-semibold text-[#00d9ff] ml-1 tracking-tight">
                {senderFullName}
              </span>
            )}

            {/* Main Message Bubble */}
            <div
              onContextMenu={(e) => showContextMenu(e, message)}
              className={`relative rounded-2xl overflow-hidden transition-all duration-400 max-w-[70%] sm:max-w-[60%] ${
                isOwn
                  ? "bg-gradient-to-r from-[#00d9ff] to-[#0099cc] shadow-lg shadow-[#00d9ff]/25 rounded-br-md"
                  : "bg-[#1f1f1f] shadow-md border border-[#2a2a2a]/50 rounded-bl-md"
              }`}
            >
              {message.replyTo && (
                <div
                  className={`px-3 py-2 m-2 mb-1 rounded-lg border-l-4 backdrop-blur-sm transition-all duration-200 ${
                    isOwn 
                      ? "bg-white/15 border-r-white/30" 
                      : "bg-[#2a2a2a]/60 border-l-[#00d9ff]/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                    <Reply className="w-3 h-3 flex-shrink-0" />
                    <span className="font-semibold">
                      {message.replyTo.senderId._id === authUser?._id ? "You" : message.replyTo.senderId.fullName || "User"}
                    </span>
                    <span className="truncate max-w-[160px] ml-1">
                      {message.replyTo.text || "📷 Image"}
                    </span>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="p-3 flex items-end gap-2 bg-[#0a0a0a]/60">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && saveEdit()}
                    className="flex-1 bg-[#2a2a2a]/80 text-white px-3.5 py-2.5 rounded-xl text-sm outline-none ring-1 ring-transparent focus:ring-[#00d9ff]/40 transition-all placeholder-gray-500"
                    autoFocus
                    placeholder="Edit message..."
                  />
                  <button
                    onClick={saveEdit}
                    className="p-2 rounded-lg bg-[#00d9ff]/20 text-[#00d9ff] hover:bg-[#00d9ff]/40 transition-all duration-200 flex-shrink-0"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all duration-200 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {message.image && (
                    <div className="relative overflow-hidden rounded-b-xl">
                      <img
                        src={message.image}
                        alt="sent"
                        className="w-full max-h-80 object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                        onClick={handleImageClick}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  )}

                  {message.text && (
                    <p
                      className={`px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isOwn ? "text-white font-medium" : "text-gray-100"
                      }`}
                    >
                      {message.text}
                      {message.editedAt && (
                        <span className="text-xs opacity-70 ml-2 inline-block italic">
                          edited
                        </span>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Timestamp & Status */}
            <div
              className={`flex items-center gap-1.5 px-1 text-xs font-medium ${
                isOwn ? "justify-end" : "justify-start"
              }`}
            >
              {isStarred && (
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              )}
              {isPinned && (
                <Pin className="w-3 h-3 text-[#00d9ff] fill-[#00d9ff]" />
              )}
              <span className="text-[#888]">{formatTime(message.createdAt)}</span>
              {isOwn && (
    <>
      {message.status === 'sent' && (
        <Check className="w-3.5 h-3.5 text-gray-400 opacity-90 flex-shrink-0" />
      )}
      {message.status === 'delivered' && (
        <CheckCheck className="w-3.5 h-3.5 text-gray-400 opacity-90 flex-shrink-0" />
      )}
      {message.status === 'seen' && (
        <CheckCheck className="w-3.5 h-3.5 text-[#00d9ff] opacity-90 flex-shrink-0" />
      )}
    </>
  )}
            </div>
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