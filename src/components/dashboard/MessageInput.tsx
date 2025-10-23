"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Image, X, Reply } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";

interface MessageInputProps {
  receiverId: string;
  type: "user" | "contact" | "group";
}

/** Helper – turn File → base64 string */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const MessageInput = ({ receiverId, type }: MessageInputProps) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [replyTo, setReplyTo] = useState<string>("");
  const [replySenderName, setReplySenderName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sendPrivateMessage,
    sendGroupMessage,
    isSendingMessage,
    replyingTo,
    clearReply,
    contacts,
    groups,
    authUser,
  } = useChatStore() as any;

  /* -----------------------------------------------------------------
   * Resolve sender name for the reply preview
   * ----------------------------------------------------------------- */
  useEffect(() => {
    if (!replyingTo) {
      setReplySenderName("");
      return;
    }

    // If it's the current user's message
    const senderId = replyingTo.senderId?._id ?? replyingTo.senderId;
    if (senderId === authUser?._id) {
      setReplySenderName("You");
      return;
    }

    // If senderId is an object → use its fullName
    if (replyingTo.senderId?.fullName) {
      setReplySenderName(replyingTo.senderId.fullName);
      return;
    }

    // If senderId is just a string → look it up
    if (!senderId) {
      setReplySenderName("Unknown");
      return;
    }

    // Search contacts (private chats)
    const contact = contacts?.find((c: any) => c._id === senderId);
    if (contact?.fullName) {
      setReplySenderName(contact.fullName);
      return;
    }

    // Search groups
    const group = groups?.find((g: any) => g._id === receiverId);
    const member = group?.members?.find((m: any) => m._id === senderId);
    if (member?.fullName) {
      setReplySenderName(member.fullName);
      return;
    }

    // Fallback
    setReplySenderName("Unknown");
  }, [replyingTo, contacts, groups, receiverId, authUser]);

  /* -----------------------------------------------------------------
   * Sync store → local reply state
   * ----------------------------------------------------------------- */
  React.useEffect(() => {
    if (replyingTo) {
      setReplyTo(replyingTo._id);
    } else {
      setReplyTo("");
    }
  }, [replyingTo]);

  /* -----------------------------------------------------------------
   * Image handling
   * ----------------------------------------------------------------- */
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be < 5 MB");
      return;
    }

    const b64 = await fileToBase64(file);
    setImageFile(file);
    setImagePreview(b64);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelReply = () => {
    setReplyTo("");
    setReplySenderName("");
    clearReply();
  };

  /* -----------------------------------------------------------------
   * Send
   * ----------------------------------------------------------------- */
  const handleSend = async () => {
    if (isSendingMessage) return;
    if (!text.trim() && !imageFile) return;

    const payload = {
      text: text.trim(),
      image: imageFile ? await fileToBase64(imageFile) : "",
      replyTo: replyTo || "",
    };

    try {
      if (type === "group") {
        await sendGroupMessage(receiverId, payload);
      } else {
        await sendPrivateMessage(receiverId, payload);
      }

      // reset UI
      setText("");
      removeImage();
      cancelReply();
    } catch (err) {
      console.error("send error:", err);
    }
  };

  return (
    <div className="p-4 border-t border-[#2a2a2a] bg-[#1e1e1e]">
      {/* ---------- REPLY PREVIEW (WhatsApp Style) ---------- */}
      {replyTo && replyingTo && (
        <div className="mb-3 pl-4 pr-2 py-2.5 bg-[#2a2a2a]/60 rounded-lg border-l-4 border-[#00d9ff]">
          <div className="flex items-start gap-3">
            <Reply className="w-4 h-4 text-[#00d9ff] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#00d9ff] font-semibold mb-0.5">
                Replying to {replySenderName}
              </p>
              <p className="text-xs text-[#999] truncate">
                {replyingTo.text || "(Image)"}
              </p>
            </div>
            <button 
              onClick={cancelReply} 
              className="p-1 cursor-pointer hover:bg-[#333] rounded transition-colors"
            >
              <X className="w-4 h-4 text-[#999]" />
            </button>
          </div>
        </div>
      )}

      {/* ---------- IMAGE PREVIEW ---------- */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img src={imagePreview} alt="preview" className="max-h-32 rounded-lg" />
          <button
            onClick={removeImage}
            className="absolute cursor-pointer top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-black transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* ---------- INPUT ROW ---------- */}
      <div className="flex items-center gap-2">
        {/* Image button */}
        <label className="p-2 hover:bg-[#2a2a2a] cursor-pointer rounded-lg transition-colors">
          <Image className="w-5 h-5 text-[#999999]" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </label>

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-2.5 outline-none text-sm"
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isSendingMessage || (!text.trim() && !imageFile)}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5 text-[#00d9ff]" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;