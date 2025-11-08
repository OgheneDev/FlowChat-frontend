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
  const { isSendingMessage: isPrivateSending } = usePrivateChatStore();
  const { isSendingMessage: isGroupSending } = useGroupStore();
  const { replyingTo, clearReply } = useUIStore();
  const { authUser, socket } = useAuthStore();

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

  // Convert image to base64 for socket transmission
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Send message via Socket.IO
  const send = async () => {
    if (isSendingMessage || (!text.trim() && !image)) return;
    
    if (!socket || !socket.connected) {
      console.error("Socket not connected");
      alert("Connection lost. Please refresh the page.");
      return;
    }

    if (!authUser) {
      console.error("User not authenticated");
      return;
    }

    const payload: any = {};
    if (text.trim()) payload.text = text.trim();
    if (image) {
      payload.image = await imageToBase64(image);
    }
    if (replyingTo) payload.replyTo = replyingTo._id;

    try {
      // Create optimistic message for UI
      // Using 'as any' to bypass strict type checking for optimistic updates
      const optimisticMessage = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        text: payload.text || "",
        image: preview || null,
        senderId: authUser, // Full user object for display
        receiverId: type === "group" ? undefined : receiverId,
        groupId: type === "group" ? receiverId : undefined,
        status: "sent" as const,
        replyTo: replyingTo || null,
        createdAt: new Date().toISOString(),
      } as any; // Temporary type bypass for optimistic update

      // Add optimistically to UI
      if (type === "group") {
        console.log("➕ Adding optimistic group message:", optimisticMessage._id);
        useGroupStore.getState().addIncomingGroupMessage(optimisticMessage);
        
        // Emit via socket
        console.log("📤 Emitting sendGroupMessage to server");
        socket.emit("sendGroupMessage", {
          groupId: receiverId,
          ...payload,
        });
      } else {
        console.log("➕ Adding optimistic private message:", optimisticMessage._id);
        usePrivateChatStore.getState().addIncomingMessage(optimisticMessage);
        
        // Emit via socket
        console.log("📤 Emitting sendMessage to server");
        socket.emit("sendMessage", {
          receiverId,
          ...payload,
        });
      }
      
      console.log("✅ Message sent successfully (optimistic)");

      // Clear form immediately for better UX
      setText("");
      setImage(null);
      setPreview("");
      clearReply();
      
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
      // TODO: Implement proper error handling and rollback
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