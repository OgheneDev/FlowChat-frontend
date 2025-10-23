"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Reply,
  Image as ImageIcon,
  CheckCheck,
  Edit2,
  Trash2,
  Copy,
  Forward,
  Download,
  X,
  Pin,
  Star,
} from "lucide-react";

import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTime } from "@/utils/utils";
import { ImageModal } from "./ImageModal";

interface MessageListProps {
  isLoading: boolean;
  type: "user" | "contact" | "group";
}

/* ------------------------------------------------------------------ */
/*  Helper – union type for the events we handle (mouse + touch)      */
/* ------------------------------------------------------------------ */
type ContextEvent =
  | React.MouseEvent<HTMLDivElement>
  | React.TouchEvent<HTMLDivElement>;

const MessageList = ({ isLoading, type }: MessageListProps) => {
  /* -------------------------- Store hooks -------------------------- */
  const {
    privateMessages,
    groupMessages,
    chats,
    groups,
    setReplyingTo,
    deleteMessage,
    editMessage,
    pinMessage,
    unpinMessage,
    toggleStarMessage,
    starredMessages,
    isDeletingMessage,
    isEditingMessage,
  } = useChatStore();

  const { authUser } = useAuthStore() as { authUser: { _id: string } | null };

  const messages = type === "group" ? groupMessages : privateMessages;

  /* -------------------------- Local UI state -------------------------- */
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: any;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ message: any } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  /* -------------------------- Scroll to bottom -------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------------- Close context menu on click outside -------------------------- */
  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  /* -------------------------- Helper: is message starred? -------------------------- */
  const isStarred = (msgId: string) => starredMessages.includes(msgId);

  /* -------------------------- Reply -------------------------- */
  const startReply = (msg: any) => {
    setReplyingTo({
      _id: msg._id,
      text: msg.text,
      image: msg.image,
      senderId: msg.senderId,
    });
    setContextMenu(null);
  };

  /* -------------------------- Edit -------------------------- */
  const handleEdit = (msg: any) => {
    setEditingMessageId(msg._id);
    setEditText(msg.text ?? "");
    setContextMenu(null);
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editText.trim()) return;
    try {
      await editMessage(editingMessageId, { text: editText.trim() }, type === "group");
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

  /* -------------------------- Delete -------------------------- */
  const handleDelete = async (deleteType: "me" | "everyone") => {
    if (!deleteModal) return;
    try {
      await deleteMessage(
        { messageId: deleteModal.message._id, deleteType },
        type === "group"
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleteModal(null);
  };

  const openDeleteModal = (msg: any) => {
    setDeleteModal({ message: msg });
    setContextMenu(null);
  };

  /* -------------------------- Pin / Unpin -------------------------- */
const getChatOrGroupId = (msg: any): { chatId?: string; groupId?: string } => {
  if (type === "group") {
    return { groupId: msg.groupId };
  }

  const chat = chats.find((c: any) =>
    Array.isArray(c.participants) &&
    c.participants.some((p: string | undefined) => p === authUser?._id)
  );
  return { chatId: chat?._id };
};

const handlePin = async (msg: any) => {
  const ids = getChatOrGroupId(msg);
  if (!ids.chatId && !ids.groupId) return;

  try {
    await pinMessage({
      messageId: msg._id,
      ...(ids.chatId ? { chatId: ids.chatId } : {}),
      ...(ids.groupId ? { groupId: ids.groupId } : {}),
    });
  } catch (e) {
    console.error(e);
  }
  setContextMenu(null);
};

const handleUnpin = async (msg: any) => {
  const ids = getChatOrGroupId(msg);
  if (!ids.chatId && !ids.groupId) return;

  try {
    await unpinMessage({
      messageId: msg._id,
      ...(ids.chatId ? { chatId: ids.chatId } : {}),
      ...(ids.groupId ? { groupId: ids.groupId } : {}),
    });
  } catch (e) {
    console.error(e);
  }
  setContextMenu(null);
};

  /* -------------------------- Star / Un‑star -------------------------- */
  const handleStarToggle = async (msgId: string) => {
    try {
      await toggleStarMessage(msgId);
    } catch (e) {
      console.error(e);
    }
  };

  /* -------------------------- Show context menu (mouse + long‑press) -------------------------- */
  const showContextMenu = (e: ContextEvent, msg: any) => {
    e.preventDefault();

    let clientX: number;
    let clientY: number;

    if ("touches" in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const menuWidth = 200;
    const menuHeight = 300;
    const padding = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = clientX;
    if (clientX + menuWidth > viewportWidth - padding) {
      adjustedX = clientX - menuWidth;
    }

    let adjustedY = clientY;
    if (clientY + menuHeight > viewportHeight - padding) {
      adjustedY = viewportHeight - menuHeight - padding;
    }

    adjustedX = Math.max(padding, adjustedX);
    adjustedY = Math.max(padding, adjustedY);

    setContextMenu({ x: adjustedX, y: adjustedY, message: msg });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, msg: any) => {
    const timeout = setTimeout(() => showContextMenu(e, msg), 600);
    const cancel = () => clearTimeout(timeout);
    document.addEventListener("touchend", cancel, { once: true });
  };

  /* -------------------------- Skeleton -------------------------- */
  const MessageSkeleton = () => (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-[#2a2a2a]/50" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-[#2a2a2a]/50 rounded" />
        <div className="h-16 w-56 bg-[#2a2a2a]/50 rounded-2xl" />
      </div>
    </div>
  );

  /* -------------------------- Empty state -------------------------- */
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto py-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#2a2a2a] flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-[#666]" />
          </div>
          <div>
            <p className="text-sm text-[#999999] font-medium">No messages yet</p>
            <p className="text-xs text-[#666] mt-1">
              {type === "group" ? "Start the conversation!" : "Say hello!"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------- Render messages -------------------------- */
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {messages.map((message: any, index: number) => {
          const senderIdValue =
            typeof message.senderId === "string"
              ? message.senderId
              : message.senderId?._id;

          const isOwn = senderIdValue === authUser?._id;

          /* ---- Resolve sender name / avatar for non‑own messages ---- */
          let senderFullName: string | null = null;
          let senderProfileImage: string | null = null;

          if (!isOwn) {
            if (typeof message.senderId === "object") {
              senderFullName = message.senderId.fullName;
              senderProfileImage = message.senderId.profilePic;
            } else {
              const partner = chats.find((c: any) => c._id === senderIdValue);
              if (partner) {
                senderFullName = partner.fullName ?? null;
                senderProfileImage = partner.profilePic ?? null;
              }
            }
          }

          const senderName =
            type === "group" && !isOwn ? senderFullName || "Unknown" : null;

          const showDateSeparator =
            index === 0 ||
            new Date(messages[index - 1].createdAt).toDateString() !==
              new Date(message.createdAt).toDateString();

          const isEditing = editingMessageId === message._id;

          /* ---- Is the message pinned? ---- */
          const target = type === "group"
  ? groups.find((g) => g._id === message.groupId)
  : chats.find((c: any) =>
      Array.isArray(c.participants) && 
      c.participants.some((p: string | undefined) => p === authUser?._id)
    );

          const isPinned = target?.pinnedMessages?.includes(message._id) ?? false;

          return (
            <React.Fragment key={message._id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="px-4 py-1.5 bg-[#2a2a2a]/80 rounded-full text-xs text-[#999] font-medium">
                    {new Date(message.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}

              {/* ---------- Message bubble ---------- */}
              <div
                className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}
                onContextMenu={(e) => isOwn && showContextMenu(e, message)}
                onTouchStart={(e) => isOwn && handleTouchStart(e, message)}
              >
                {/* Avatar (only for others) */}
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#00d9ff]/20 to-[#0099cc]/20 flex-shrink-0 border border-[#2a2a2a]">
                    {senderProfileImage ? (
                      <img
                        src={senderProfileImage}
                        alt={senderFullName || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#00d9ff] font-semibold bg-[#2a2a2a]">
                        {senderFullName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col gap-1 max-w-[75%] md:max-w-[65%]">
                  {senderName && (
                    <span className="text-xs text-[#00d9ff] font-medium ml-1">
                      {senderName}
                    </span>
                  )}

                  <div
                    className={`rounded-2xl overflow-hidden transition-all duration-200 relative ${
                      isOwn
                        ? "bg-gradient-to-br from-[#00d9ff] to-[#00b8d4] shadow-lg shadow-[#00d9ff]/20"
                        : "bg-[#2a2a2a] shadow-md"
                    }`}
                  >
                    {/* Pinned indicator */}
                    {isPinned && (
                      <div className="absolute -top-2 -right-2 bg-[#00d9ff] text-black text-xs rounded-full p-1">
                        <Pin className="w-3 h-3" />
                      </div>
                    )}

                    {/* Star button (hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStarToggle(message._id);
                      }}
                      className={`absolute top-2 right-2 p-1 rounded-full transition-all ${
                        isStarred(message._id)
                          ? "bg-yellow-500 text-black"
                          : "bg-[#2a2a2a]/70 text-[#999] hover:bg-[#3a3a3a]"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${isStarred(message._id) ? "fill-current" : ""}`}
                      />
                    </button>

                    {/* Reply preview */}
                    {message.replyTo && (
                      <div
                        className={`px-3 py-2 border-l-4 m-2 mb-1 rounded-md ${
                          isOwn
                            ? "bg-black/20 border-white/50"
                            : "bg-[#1a1a1a] border-[#00d9ff]"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-[#00d9ff]">
                            {isOwn ? "You" : senderName || "User"}
                          </span>
                          <span className="truncate">
                            {message.replyTo.text || "Image"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Editing mode */}
                    {isEditing ? (
                      <div className="p-2 flex items-center gap-1">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          className="flex-1 bg-[#1a1a1a] text-white px-3 py-1.5 rounded-lg text-sm outline-none"
                          autoFocus
                        />
                        <button onClick={saveEdit} className="p-1 text-green-400">
                          <CheckCheck className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Image */}
                        {message.image && (
                          <img
                            src={message.image}
                            alt="sent"
                            className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setFullImage(message.image)}
                          />
                        )}

                        {/* Text */}
                        {message.text && (
                          <p
                            className={`text-sm leading-relaxed whitespace-pre-wrap px-4 py-2.5 ${
                              isOwn ? "text-[#0a0a0a]" : "text-white"
                            }`}
                          >
                            {message.text}
                            {message.editedAt && (
                              <span className="text-xs opacity-60 ml-1">
                                {" "}
                                (edited)
                              </span>
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Timestamp + status */}
                  <div
                    className={`flex items-center gap-1 px-1 ${
                      isOwn ? "self-end" : "self-start"
                    }`}
                  >
                    <span className="text-xs text-[#666]">
                      {formatTime(message.createdAt)}
                    </span>
                    {isOwn && (
                      <CheckCheck className="w-3.5 h-3.5 text-[#00d9ff]" />
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>

      {/* -------------------------- Context menu -------------------------- */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#2a2a2a] rounded-lg shadow-xl border border-[#3a3a3a] py-1 z-50 text-sm min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => startReply(contextMenu.message)}
            className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-white transition-colors"
          >
            <Reply className="w-4 h-4" /> Reply
          </button>

          {contextMenu.message.text && (
            <button
              onClick={() => handleEdit(contextMenu.message)}
              className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}

          <button
            onClick={() => openDeleteModal(contextMenu.message)}
            className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-red-400 transition-colors"
            disabled={isDeletingMessage}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>

          {/* Pin / Unpin */}
          {(() => {
            const msg = contextMenu.message;
            const { chatId, groupId } = getChatOrGroupId(msg);
            const target = type === "group"
              ? groups.find((g) => g._id === groupId)
              : chats.find((c) => c._id === chatId);
            const pinned = target?.pinnedMessages?.includes(msg._id) ?? false;

            return pinned ? (
              <button
                onClick={() => handleUnpin(msg)}
                className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-white transition-colors"
              >
                <Pin className="w-4 h-4 rotate-45" /> Unpin
              </button>
            ) : (
              <button
                onClick={() => handlePin(msg)}
                className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-white transition-colors"
              >
                <Pin className="w-4 h-4" /> Pin
              </button>
            );
          })()}

          <div className="border-t border-[#3a3a3a] my-1" />

          <button className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-white transition-colors">
            <Copy className="w-4 h-4" /> Copy
          </button>

          <button className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-white transition-colors">
            <Forward className="w-4 h-4" /> Forward
          </button>

          {contextMenu.message.image && (
            <button className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center gap-2 text-white transition-colors">
              <Download className="w-4 h-4" /> Download
            </button>
          )}
        </div>
      )}

      {/* -------------------------- Delete Modal -------------------------- */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#2a2a2a] rounded-2xl shadow-2xl border border-[#3a3a3a] p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Message</h3>
            <p className="text-sm text-[#999] mb-6">
              Choose who this message should be deleted for:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleDelete("me")}
                disabled={isDeletingMessage}
                className="w-full px-4 py-3 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
              >
                <span className="font-medium">Delete for me</span>
                <Trash2 className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => handleDelete("everyone")}
                disabled={isDeletingMessage}
                className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group border border-red-500/20"
              >
                <span className="font-medium">Delete for everyone</span>
                <Trash2 className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <button
              onClick={() => setDeleteModal(null)}
              disabled={isDeletingMessage}
              className="w-full mt-4 px-4 py-3 bg-transparent hover:bg-[#3a3a3a] text-[#999] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {fullImage && (
        <ImageModal src={fullImage} onClose={() => setFullImage(null)} />
      )}
    </>
  );
};

export default MessageList;