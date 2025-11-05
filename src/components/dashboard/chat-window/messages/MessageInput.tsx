"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Reply, ImageIcon } from "lucide-react";
import {
  usePrivateChatStore,
  useGroupStore,
  useUIStore,
} from "@/stores";
import { useAuthStore } from "@/stores";

interface MessageInputProps {
  receiverId: string;
  type: "user" | "contact" | "group";
}

const MessageInput = ({ receiverId, type }: MessageInputProps) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All from @/stores
  const { sendPrivateMessage, isSendingMessage: isPrivateSending } = usePrivateChatStore();
  const { sendGroupMessage, isSendingMessage: isGroupSending } = useGroupStore();
  const { replyingTo, clearReply } = useUIStore();
  const { authUser } = useAuthStore() as any;

  const isSendingMessage = type === "group" ? isGroupSending : isPrivateSending;

  const replyName =
    replyingTo?.senderId?._id === authUser?._id
      ? "You"
      : replyingTo?.senderId?.fullName || "User";

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  // Handle image
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setImage(file);
  };

  // Send message
  const send = async () => {
    if (isSendingMessage || (!text.trim() && !image)) return;

    const payload: any = {};
    if (text.trim()) payload.text = text.trim();
    if (image) {
      payload.image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(image);
      });
    }
    if (replyingTo) payload.replyTo = replyingTo._id;

    try {
      if (type === "group") {
        await sendGroupMessage(receiverId, payload);
      } else {
        await sendPrivateMessage(receiverId, payload);
      }

      setText("");
      setImage(null);
      setPreview("");
      clearReply();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="border-t border-[#2a2a2a] bg-[#1e1e1e] p-4 space-y-3">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="bg-[#2a2a2a]/60 rounded-lg p-3 border-l-4 border-[#00d9ff] flex items-center gap-3 animate-in slide-in-from-top">
          <Reply className="w-4 h-4 text-[#00d9ff]" />
          <div className="flex-1">
            <p className="text-xs text-[#00d9ff] font-semibold">
              Replying to {replyName}
            </p>
            <p className="text-xs text-[#999] truncate">
              {replyingTo.text || "Photo"}
            </p>
          </div>
          <button
            onClick={clearReply}
            className="p-1 hover:bg-[#333] rounded"
          >
            <X className="w-4 h-4 text-[#999]" />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="relative inline-block">
          <img src={preview} alt="preview" className="max-h-32 rounded-lg" />
          <button
            onClick={() => {
              setImage(null);
              setPreview("");
            }}
            className="absolute top-1 right-1 p-1 bg-black/70 rounded-full"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <label className="p-2 hover:bg-[#2a2a2a] rounded-lg cursor-pointer transition-colors">
          <ImageIcon className="w-5 h-5 text-[#999]" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
        </label>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-2.5 outline-none text-sm resize-none max-h-32 overflow-y-auto"
          rows={1}
        />

        <button
          onClick={send}
          disabled={isSendingMessage || (!text.trim() && !image)}
          className="p-2.5 bg-[#00d9ff] hover:bg-[#00b8d4] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5 text-black" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;