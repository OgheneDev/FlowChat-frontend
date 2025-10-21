"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTime } from "@/utils/utils";
import { Reply, Image as ImageIcon, CheckCheck } from "lucide-react";

interface MessageListProps {
  isLoading: boolean;
  type: "user" | "contact" | "group";
}

const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div
    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <img
      src={src}
      alt="full size"
      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
    <button
      onClick={onClose}
      className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all duration-200 hover:rotate-90"
    >
      ✕
    </button>
  </div>
);

const MessageList = ({ isLoading, type }: MessageListProps) => {
  const { privateMessages, groupMessages, setReplyingTo } = useChatStore() as any;
  const { authUser } = useAuthStore() as any;
  const messages = type === "group" ? groupMessages : privateMessages;

  const [fullImage, setFullImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const MessageSkeleton = () => (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-[#2a2a2a]/50" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-[#2a2a2a]/50 rounded" />
        <div className="h-16 w-56 bg-[#2a2a2a]/50 rounded-2xl" />
      </div>
    </div>
  );

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

  const startReply = (msg: any) => {
    setReplyingTo(msg);
  };

  return (
    <>
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#2a2a2a #1e1e1e'
        }}
      >
        {messages.map((message: any, index: number) => {
          const senderIdValue =
            typeof message.senderId === "string"
              ? message.senderId
              : message.senderId?._id;

          const isOwn = senderIdValue === authUser?._id;
          const senderName =
            type === "group" && !isOwn
              ? message.senderId?.fullName || "Unknown"
              : null;

          const showDateSeparator = index === 0 || 
            new Date(messages[index - 1].createdAt).toDateString() !== 
            new Date(message.createdAt).toDateString();

          return (
            <React.Fragment key={message._id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="px-4 py-1.5 bg-[#2a2a2a]/80 rounded-full text-xs text-[#999] font-medium">
                    {new Date(message.createdAt).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              )}

              <div
                className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  startReply(message);
                }}
                onTouchStart={(e) => {
                  const timeout = setTimeout(() => {
                    startReply(message);
                  }, 600);

                  const cancel = () => {
                    clearTimeout(timeout);
                    document.removeEventListener("touchend", cancel);
                  };
                  document.addEventListener("touchend", cancel);
                }}
              >
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#00d9ff]/20 to-[#0099cc]/20 flex-shrink-0 border border-[#2a2a2a]">
                    {message.senderId?.profileImage ? (
                      <img
                        src={message.senderId.profileImage}
                        alt={senderName || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#00d9ff] font-semibold bg-[#2a2a2a]">
                        {senderName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1 max-w-[75%] md:max-w-[65%]">
                  {senderName && (
                    <span className="text-xs text-[#00d9ff] font-medium ml-1">{senderName}</span>
                  )}

                  {message.replyTo && (
                    <div
                      className={`p-2.5 rounded-xl mb-1 text-xs border-l-2 ${
                        isOwn
                          ? "bg-[#00d9ff]/10 text-[#e0f7ff] border-[#00d9ff]"
                          : "bg-[#2a2a2a]/50 text-[#ccc] border-[#555]"
                      }`}
                    >
                      <Reply className="w-3 h-3 inline mr-1.5 opacity-70" />
                      {message.replyTo.text ? (
                        <span className="opacity-80">{message.replyTo.text}</span>
                      ) : (
                        <span className="italic opacity-60">Image</span>
                      )}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl overflow-hidden transition-all duration-200 ${
                      isOwn
                        ? "bg-gradient-to-br from-[#00d9ff] to-[#00b8d4] shadow-lg shadow-[#00d9ff]/20"
                        : "bg-[#2a2a2a] shadow-md"
                    }`}
                  >
                    {message.image && (
                      <div className="relative">
                        <img
                          src={message.image}
                          alt="sent"
                          className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setFullImage(message.image)}
                        />
                      </div>
                    )}

                    {message.text && (
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap px-4 py-2.5 ${
                        isOwn ? "text-[#0a0a0a]" : "text-white"
                      }`}>
                        {message.text}
                      </p>
                    )}

                    {!message.text && !message.image && (
                      <p className="italic text-xs opacity-60 px-4 py-2.5">
                        <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                        Image
                      </p>
                    )}
                  </div>

                  <div className={`flex items-center gap-1 px-1 ${isOwn ? "self-end" : "self-start"}`}>
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
        <div ref={messagesEndRef} />
      </div>

      {fullImage && <ImageModal src={fullImage} onClose={() => setFullImage(null)} />}
    </>
  );
};

export default MessageList;