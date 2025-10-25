import React, { useState, forwardRef } from "react";
import { Reply, CheckCheck, Star, X, CheckCheck as CheckIcon } from "lucide-react";
import { usePrivateChatStore, useGroupStore, useUIStore, useStarringStore } from "@/stores";
import { formatTime } from "@/utils/utils";
import useContextMenu from "./useContextMenu";
import { ImageModal } from "./ImageModal";
import ContextMenu from "./ContextMenu"; 
import DeleteModal from "./DeleteModal"; 

interface MessageItemProps {
  message: any;
  index: number;
  type: "user" | "contact" | "group";
  authUser: { _id: string } | null;
  messages: any[];
  isSendingMessage: boolean;
}

const MessageItem = forwardRef<HTMLDivElement, MessageItemProps>(
  ({ message, index, type, authUser, messages, isSendingMessage }, ref) => {
    const { setReplyingTo } = useUIStore();
    const { toggleStarMessage, starredMessages } = useStarringStore();
    const { deleteMessage: deletePrivate, editMessage: editPrivate } = usePrivateChatStore();
    const { deleteMessage: deleteGroup, editMessage: editGroup } = useGroupStore();

    const [fullImage, setFullImage] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [deleteModal, setDeleteModal] = useState<{ message: any; deleteType: "me" | "everyone" } | null>(null);

    const deleteMessage = type === "group" ? deleteGroup : deletePrivate;
    const editMessage = type === "group" ? editGroup : editPrivate;
    const isStarred = starredMessages.includes(message._id);

    const { contextMenu, contextMenuRef, showContextMenu, handleTouchStart } = useContextMenu();

    const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId?._id;
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

    const startReply = (msg: any) => {
      setReplyingTo({
        _id: msg._id,
        text: msg.text,
        image: msg.image,
        senderId: msg.senderId,
      });
    };

    const handleEdit = (msg: any) => {
      setEditingMessageId(msg._id);
      setEditText(msg.text ?? "");
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
    };

    const openDeleteModal = (msg: any, deleteType: "me" | "everyone") => {
      setDeleteModal({ message: msg, deleteType });
    };

    const handleStarToggle = async (msgId: string) => {
      try {
        await toggleStarMessage(msgId);
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <>
        {showDateSeparator && (
          <div className="flex items-center justify-center my-5">
            <div className="px-3 py-1 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-full text-xs font-medium text-[#888] border border-[#2a2a2a] shadow-sm">
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
          className={`flex gap-3 group transition-all duration-200 message-item ${
            isOwn ? "flex-row-reverse" : ""
          }`}
          onContextMenu={(e) => showContextMenu(e, message)}
          onTouchStart={(e) => handleTouchStart(e, message)}
        >
          {!isOwn && (
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#2a2a2a] ring-offset-2 ring-offset-transparent transition-all group-hover:ring-[#00d9ff]/30">
              {senderProfilePic ? (
                <img src={senderProfilePic} alt={senderFullName || "User"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00d9ff] bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
                  {initials}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1 max-w-[78%] md:max-w-[65%]">
            {type === "group" && !isOwn && senderFullName && (
              <span className="text-xs font-semibold text-[#00d9ff] ml-1 tracking-tight">
                {senderFullName}
              </span>
            )}

            <div
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                isOwn
                  ? "bg-gradient-to-br from-[#00d9ff] to-[#00a3cc] shadow-xl shadow-[#00d9ff]/30"
                  : "bg-[#1f1f1f] shadow-lg border border-[#2a2a2a]"
              }`}
            >
              {message.replyTo && (
                <div
                  className={`px-3 py-2.5 m-2 mb-1 rounded-lg border-l-4 ${
                    isOwn ? "bg-white/10 border-white/40" : "bg-[#2a2a2a]/50 border-[#00d9ff]/50"
                  } backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Reply className="w-3 h-3 text-[#00d9ff]" />
                    <span className="text-[#00d9ff]">
                      {isOwn ? "You" : senderFullName || "User"}
                    </span>
                    <span className="truncate text-[#aaa] max-w-[180px]">
                      {message.replyTo.text || "Image"}
                    </span>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="p-3 flex items-center gap-2 bg-[#0a0a0a]/50">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && saveEdit()}
                    className="flex-1 bg-[#2a2a2a] text-white px-4 py-2 rounded-xl text-sm outline-none ring-2 ring-transparent focus:ring-[#00d9ff]/50 transition-all"
                    autoFocus
                    placeholder="Edit message..."
                  />
                  <button
                    onClick={saveEdit}
                    className="p-2 rounded-lg bg-[#00d9ff]/20 text-[#00d9ff] hover:bg-[#00d9ff]/30 transition-all"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {message.image && (
                    <div className="relative overflow-hidden">
                      <img
                        src={message.image}
                        alt="sent"
                        className="w-full max-h-96 object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                        onClick={() => setFullImage(message.image)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  )}

                  {message.text && (
                    <p
                      className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isOwn ? "text-black font-medium" : "text-white"
                      }`}
                    >
                      {message.text}
                      {message.editedAt && (
                        <span className="text-xs opacity-70 ml-1.5 italic">
                          (edited)
                        </span>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>

            <div
              className={`flex items-center gap-2 px-1 text-xs text-[#666] ${
                isOwn ? "justify-end" : "justify-start"
              }`}
            >
              {isStarred && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
              )}
              <span>{formatTime(message.createdAt)}</span>
              {isOwn && (
                <CheckCheck className="w-4 h-4 text-[#00d9ff] opacity-80" />
              )}
            </div>
          </div>
        </div>

        {contextMenu && (
          <ContextMenu
            contextMenu={contextMenu}
            contextMenuRef={contextMenuRef}
            message={message}
            isStarred={isStarred}
            onReply={startReply}
            onEdit={handleEdit}
            onStarToggle={handleStarToggle}
            onDelete={openDeleteModal}
            isSendingMessage={isSendingMessage}
            isOwn={isOwn}
            type={type}
          />
        )}

        {deleteModal && (
          <DeleteModal
            message={deleteModal.message}
            onDelete={handleDelete}
            onClose={() => setDeleteModal(null)}
            deleteType={deleteModal.deleteType}
            isSendingMessage={isSendingMessage}
          />
        )}

        {fullImage && <ImageModal src={fullImage} onClose={() => setFullImage(null)} />}
      </>
    );
  }
);

MessageItem.displayName = "MessageItem";

export default MessageItem;