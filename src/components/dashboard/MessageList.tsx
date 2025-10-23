"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Reply,
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

type ContextEvent =
  | React.MouseEvent<HTMLDivElement>
  | React.TouchEvent<HTMLDivElement>;

const MessageList = ({ isLoading, type }: MessageListProps) => {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const isStarred = (msgId: string) => starredMessages.includes(msgId);

  const startReply = (msg: any) => {
    setReplyingTo({
      _id: msg._id,
      text: msg.text,
      image: msg.image,
      senderId: msg.senderId,
    });
    setContextMenu(null);
  };

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

  const handleStarToggle = async (msgId: string) => {
    try {
      await toggleStarMessage(msgId);
      setContextMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

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

    const menuWidth = 210;
    const menuHeight = 380;
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = clientX;
    let y = clientY;

    if (x + menuWidth > viewportWidth - padding) {
      x = viewportWidth - menuWidth - padding;
    }
    if (y + menuHeight > viewportHeight - padding) {
      y = viewportHeight - menuHeight - padding;
    }

    x = Math.max(padding, x);
    y = Math.max(padding, y);

    setContextMenu({ x, y, message: msg });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, msg: any) => {
    const timeout = setTimeout(() => showContextMenu(e, msg), 600);
    const cancel = () => clearTimeout(timeout);
    document.addEventListener("touchend", cancel, { once: true });
  };

  const MessageSkeleton = () => (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] shadow-sm" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-24 bg-[#2a2a2a]/60 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 w-48 bg-[#2a2a2a]/50 rounded-xl" />
          <div className="h-4 w-32 bg-[#2a2a2a]/40 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto py-4 px-2 bg-gradient-to-b from-transparent via-[#0a0a0a]/20 to-transparent">
        {Array.from({ length: 5 }).map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto py-4 flex items-center justify-center px-6">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00d9ff]/10 to-[#0099cc]/10 blur-xl animate-pulse"></div>
            <div className="relative w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-[#00d9ff]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-[#e0e0e0]">No messages yet</p>
            <p className="text-sm text-[#999] mt-1.5">
              {type === "group" ? "Be the first to say something!" : "Start the conversation!"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div key={type} className="flex-1 overflow-y-auto p-3 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-transparent">
        {messages.map((message: any, index: number) => {
          const senderIdValue =
            typeof message.senderId === "string"
              ? message.senderId
              : message.senderId?._id;

          const isOwn = senderIdValue === authUser?._id;

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

          const target = type === "group"
            ? groups.find((g) => g._id === message.groupId)
            : chats.find((c: any) =>
                Array.isArray(c.participants) && 
                c.participants.some((p: string | undefined) => p === authUser?._id)
              );

          const isPinned = target?.pinnedMessages?.includes(message._id) ?? false;
          const starred = isStarred(message._id);

          const initials = senderFullName
            ? senderFullName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "?";

          return (
            <React.Fragment key={message._id}>
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
                className={`flex gap-3 group transition-all duration-200 ${
                  isOwn ? "flex-row-reverse" : ""
                }`}
                onContextMenu={(e) => isOwn && showContextMenu(e, message)}
                onTouchStart={(e) => isOwn && handleTouchStart(e, message)}
              >
                {!isOwn && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#2a2a2a] ring-offset-2 ring-offset-transparent transition-all group-hover:ring-[#00d9ff]/30">
                    {senderProfileImage ? (
                      <img
                        src={senderProfileImage}
                        alt={senderFullName || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00d9ff] bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
                        {initials}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1 max-w-[78%] md:max-w-[65%]">
                  {senderName && (
                    <span className="text-xs font-semibold text-[#00d9ff] ml-1 tracking-tight">
                      {senderName}
                    </span>
                  )}

                  <div
                    className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOwn
                        ? "bg-gradient-to-br from-[#00d9ff] to-[#00a3cc] shadow-xl shadow-[#00d9ff]/30"
                        : "bg-[#1f1f1f] shadow-lg border border-[#2a2a2a]"
                    }`}
                  >
                    {isPinned && (
                      <div className="absolute -top-3 -right-3 z-20 group">
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#00d9ff] blur-md scale-150 opacity-60"></div>
                          <div className="relative bg-black text-[#00d9ff] rounded-full p-1.5 shadow-lg">
                            <Pin className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="absolute -bottom-6 right-0 text-[10px] font-medium text-[#00d9ff] bg-black/80 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          Pinned
                        </div>
                      </div>
                    )}

                    {message.replyTo && (
                      <div
                        className={`px-3 py-2.5 m-2 mb-1 rounded-lg border-l-4 ${
                          isOwn
                            ? "bg-white/10 border-white/40"
                            : "bg-[#2a2a2a]/50 border-[#00d9ff]/50"
                        } backdrop-blur-sm`}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <Reply className="w-3 h-3 text-[#00d9ff]" />
                          <span className="text-[#00d9ff]">
                            {isOwn ? "You" : senderName || "User"}
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
                          <CheckCheck className="w-4 h-4" />
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
                    {starred && (
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                    )}
                    <span>{formatTime(message.createdAt)}</span>
                    {isOwn && (
                      <CheckCheck className="w-4 h-4 text-[#00d9ff] opacity-80" />
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Enhanced Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#1a1a1a]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#3a3a3a] py-2 z-50 text-sm min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => startReply(contextMenu.message)}
            className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
          >
            <Reply className="w-4 h-4 text-[#00d9ff] group-hover:scale-110 transition-transform" />
            <span>Reply</span>
          </button>

          {contextMenu.message.text && (
            <button
              onClick={() => handleEdit(contextMenu.message)}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
            >
              <Edit2 className="w-4 h-4 text-[#00d9ff] group-hover:scale-110 transition-transform" />
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={() => handleStarToggle(contextMenu.message._id)}
            className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
          >
            <Star
              className={`w-4 h-4 transition-all group-hover:scale-110 ${
                isStarred(contextMenu.message._id)
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-[#999]"
              }`}
            />
            <span>{isStarred(contextMenu.message._id) ? "Unstar" : "Star"}</span>
          </button>

          <button
            onClick={() => openDeleteModal(contextMenu.message)}
            className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 flex items-center gap-3 text-red-400 transition-all group"
            disabled={isDeletingMessage}
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Delete</span>
          </button>

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
                className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
              >
                <Pin className="w-4 h-4 rotate-45 text-[#00d9ff] group-hover:scale-110 transition-transform" />
                <span>Unpin</span>
              </button>
            ) : (
              <button
                onClick={() => handlePin(msg)}
                className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
              >
                <Pin className="w-4 h-4 text-[#00d9ff] group-hover:scale-110 transition-transform" />
                <span>Pin</span>
              </button>
            );
          })()}

          <div className="border-t border-[#3a3a3a] my-1 mx-2" />

          <button className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group">
            <Copy className="w-4 h-4 text-[#999] group-hover:scale-110 transition-transform" />
            <span>Copy</span>
          </button>

          <button className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group">
            <Forward className="w-4 h-4 text-[#999] group-hover:scale-110 transition-transform" />
            <span>Forward</span>
          </button>

          {contextMenu.message.image && (
            <button className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group">
              <Download className="w-4 h-4 text-[#999] group-hover:scale-110 transition-transform" />
              <span>Download</span>
            </button>
          )}
        </div>
      )}

      {/* Enhanced Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl shadow-2xl border border-[#3a3a3a] p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-white mb-2">Delete Message?</h3>
            <p className="text-sm text-[#aaa] mb-6">
              This action cannot be undone.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleDelete("me")}
                disabled={isDeletingMessage}
                className="w-full px-5 py-3.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group shadow-md"
              >
                <span className="font-medium">Delete for me</span>
                <Trash2 className="w-4.5 h-4.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => handleDelete("everyone")}
                disabled={isDeletingMessage}
                className="w-full px-5 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group border border-red-500/30 shadow-md"
              >
                <span className="font-medium">Delete for everyone</span>
                <Trash2 className="w-4.5 h-4.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <button
              onClick={() => setDeleteModal(null)}
              disabled={isDeletingMessage}
              className="w-full mt-5 px-5 py-3 bg-transparent hover:bg-[#2a2a2a] text-[#999] rounded-xl transition-all disabled:opacity-50"
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