"use client";

import React, { useState, useRef } from "react";
import { Send, Image, X } from "lucide-react";
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
  const [replyTo, setReplyTo] = useState<string>(""); // messageId we are replying to

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sendPrivateMessage,
    sendGroupMessage,
    isSendingMessage,
    replyingTo, // <-- comes from store (set when user swipes a message)
    clearReply,
  } = useChatStore() as any;

  // -----------------------------------------------------------------
  // 1. Image picker
  // -----------------------------------------------------------------
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // optional: size limit (e.g. 5 MB)
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

  // -----------------------------------------------------------------
  // 2. Reply handling (store gives us the message we are replying to)
  // -----------------------------------------------------------------
  React.useEffect(() => {
    if (replyingTo) {
      setReplyTo(replyingTo._id);
    }
  }, [replyingTo]);

  const cancelReply = () => {
    setReplyTo("");
    clearReply();
  };

  // -----------------------------------------------------------------
  // 3. Send
  // -----------------------------------------------------------------
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
      {/* ---------- REPLY PREVIEW ---------- */}
      {replyTo && replyingTo && (
        <div className="mb-2 p-2 bg-[#2a2a2a] rounded-lg flex items-center gap-2 text-sm text-gray-300">
          <div className="flex-1 truncate">
            <span className="font-medium text-[#00d9ff]">
              {replyingTo.senderId?.fullName ?? "Unknown"}
            </span>
            : {replyingTo.text || "(image)"}
          </div>
          <button onClick={cancelReply} className="p-1 hover:bg-[#333] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------- IMAGE PREVIEW ---------- */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="preview"
            className="max-h-32 rounded-lg"
          />
          <button
            onClick={removeImage}
            className="absolute cursor-pointer top-1 right-1 p-1 bg-black/70 rounded-full"
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
          className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-2 outline-none"
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isSendingMessage || (!text.trim() && !imageFile)}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <Send className="w-5 h-5 text-[#00d9ff]" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;