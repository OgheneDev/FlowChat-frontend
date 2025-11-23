"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, ImageIcon, Smile } from "lucide-react";
import { usePrivateChatStore, useGroupStore, useUIStore } from "@/stores";
import { useAuthStore } from "@/stores";
import Image from "next/image";
import ReplyPreview from "./ReplyPreview";
import { Message } from "@/types/types";
import { emojiCategories } from "./emojis";


type EmojiCategory = "recent" | "smileys" | "gestures" | "hearts" | "animals" | "food" | "activities" | "objects" | "symbols" | "flags";

interface MessageInputProps {
  receiverId: string;
  type: "user" | "contact" | "group";
}


const MessageInput = ({ receiverId, type }: MessageInputProps) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>("smileys");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(["😀", "❤️", "👍", "😂", "🎉", "🔥", "💯", "✨"]);
  const [showCameraOptions, setShowCameraOptions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const cameraOptionsRef = useRef<HTMLDivElement>(null);

  const { isSendingMessage: isPrivateSending } = usePrivateChatStore();
  const { isSendingMessage: isGroupSending } = useGroupStore();
  const { replyingTo, clearReply } = useUIStore();
  const { authUser, socket } = useAuthStore();

  const isSendingMessage = type === "group" ? isGroupSending : isPrivateSending;

  const replyName =
    replyingTo?.senderId?._id === authUser?._id
      ? "You"
      : replyingTo?.senderId?.fullName || "User";

  // Close emoji picker and camera options on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
      if (cameraOptionsRef.current && !cameraOptionsRef.current.contains(e.target as Node)) {
        setShowCameraOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Reset inputs
  if (fileInputRef.current) fileInputRef.current.value = "";
  if (cameraInputRef.current) cameraInputRef.current.value = "";
  setShowCameraOptions(false);

  // Basic validation
  if (file.size > 10 * 1024 * 1024) {
    alert("Image too large. Max 10MB");
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file");
    return;
  }

  // Use object URL for preview (more reliable on mobile)
  try {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setImage(file);
  } catch (error) {
    console.error("Error loading image:", error);
    alert("Cannot load this image. Try a different format (JPEG/PNG).");
  }
};

  // Direct camera access using MediaDevices API
  const openCamera = async () => {
    setShowCameraOptions(false);
    
    try {
      // Check if browser supports mediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to file input with capture
        cameraInputRef.current?.click();
        return;
      }

      // Create a video element for camera preview
      const video = document.createElement('video');
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.zIndex = '1000';
      video.style.backgroundColor = '#000';

      // Create a container for the camera interface
      const cameraContainer = document.createElement('div');
      cameraContainer.style.position = 'fixed';
      cameraContainer.style.top = '0';
      cameraContainer.style.left = '0';
      cameraContainer.style.width = '100%';
      cameraContainer.style.height = '100%';
      cameraContainer.style.zIndex = '999';
      cameraContainer.style.backgroundColor = '#000';

      // Create capture button
      const captureBtn = document.createElement('button');
captureBtn.textContent = 'CAPTURE';
captureBtn.style.position = 'fixed';
captureBtn.style.bottom = '50px';
captureBtn.style.left = '50%';
captureBtn.style.transform = 'translateX(-50%)';
captureBtn.style.width = '120px';
captureBtn.style.height = '40px';
captureBtn.style.borderRadius = '20px';
captureBtn.style.backgroundColor = '#2c3e50';
captureBtn.style.border = '2px solid #34495e';
captureBtn.style.color = '#ecf0f1';
captureBtn.style.fontSize = '14px';
captureBtn.style.fontWeight = '600';
captureBtn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
captureBtn.style.letterSpacing = '0.5px';
captureBtn.style.textTransform = 'uppercase';
captureBtn.style.zIndex = '1001';
captureBtn.style.cursor = 'pointer';
captureBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
captureBtn.style.transition = 'all 0.2s ease';

// Add hover effect
captureBtn.addEventListener('mouseenter', () => {
  captureBtn.style.backgroundColor = '#34495e';
  captureBtn.style.transform = 'translateX(-50%) scale(1.05)';
});

captureBtn.addEventListener('mouseleave', () => {
  captureBtn.style.backgroundColor = '#2c3e50';
  captureBtn.style.transform = 'translateX(-50%) scale(1)';
});

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.position = 'fixed';
      closeBtn.style.top = '20px';
      closeBtn.style.right = '20px';
      closeBtn.style.width = '50px';
      closeBtn.style.height = '50px';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
      closeBtn.style.border = 'none';
      closeBtn.style.color = 'white';
      closeBtn.style.fontSize = '20px';
      closeBtn.style.zIndex = '1001';
      closeBtn.style.cursor = 'pointer';

      // Create canvas for capturing image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let stream: MediaStream;

      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Prefer rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        
        video.srcObject = stream;
        await video.play();

        // Add elements to container
        cameraContainer.appendChild(video);
        cameraContainer.appendChild(captureBtn);
        cameraContainer.appendChild(closeBtn);
        document.body.appendChild(cameraContainer);

        // Set canvas dimensions to match video
        const updateCanvasSize = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        };

        video.addEventListener('loadedmetadata', updateCanvasSize);

        // Capture photo
        captureBtn.onclick = () => {
          if (ctx && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                // Create file from blob
                const file = new File([blob], `camera-${Date.now()}.jpg`, { 
                  type: 'image/jpeg' 
                });
                
                // Create preview
                const url = URL.createObjectURL(blob);
                setPreview(url);
                setImage(file);
                
                // Cleanup
                cleanup();
              }
            }, 'image/jpeg', 0.9);
          }
        };

        // Close camera
        const cleanup = () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          document.body.removeChild(cameraContainer);
          video.removeEventListener('loadedmetadata', updateCanvasSize);
        };

        closeBtn.onclick = cleanup;

      } catch (cameraError) {
        console.error('Camera error:', cameraError);
        // Fallback to file input with capture
        cameraInputRef.current?.click();
        if (cameraContainer.parentNode) {
          document.body.removeChild(cameraContainer);
        }
      }

    } catch (error) {
      console.error('Error accessing camera:', error);
      // Final fallback to regular file input
      cameraInputRef.current?.click();
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setRecentEmojis((prev) => {
      const filtered = prev.filter((e) => e !== emoji);
      return [emoji, ...filtered].slice(0, 8);
    });
    textareaRef.current?.focus();
  };

  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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

    const payload: { text?: string; image?: string; replyTo?: string } = {};
    if (text.trim()) payload.text = text.trim();
    if (image) payload.image = await imageToBase64(image);
    if (replyingTo) payload.replyTo = replyingTo._id;

    try {
      const optimisticMessage = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        text: payload.text || "",
        image: preview || null,
        senderId: authUser,
        receiverId: type === "group" ? undefined : receiverId,
        groupId: type === "group" ? receiverId : undefined,
        status: "sent" as const,
        replyTo: replyingTo ? {
          _id: replyingTo._id,
          text: replyingTo.text || "",
          image: replyingTo.image,
          senderId: replyingTo.senderId,
          status: "sent" as const,
          createdAt: new Date().toISOString(),
        } as Message : undefined,
        createdAt: new Date().toISOString(),
      };

      if (type === "group") {
        useGroupStore.getState().addIncomingGroupMessage(optimisticMessage as Message);
        socket.emit("sendGroupMessage", { groupId: receiverId, ...payload });
      } else {
        usePrivateChatStore.getState().addIncomingMessage(optimisticMessage as Message);
        socket.emit("sendMessage", { receiverId, ...payload });
      }

      setText("");
      setImage(null);
      setPreview("");
      clearReply();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const getCategoryEmojis = (category: EmojiCategory): string[] => {
    if (category === "recent") return recentEmojis;
    return emojiCategories[category].emojis;
  };

  return (
    <div className="border-t border-[#2a2a2a] bg-[#1e1e1e] p-3 space-y-2 sticky bottom-0 z-10">
      {/* Reply Preview */}
      {replyingTo && (
        <ReplyPreview
          replyName={replyName}
          replyingTo={replyingTo}
          clearReply={clearReply}
          text={text}
        />
      )}

      {/* Image Preview */}
      {preview && (
        <div className="relative inline-block max-w-full">
          <div className="relative bg-[#2a2a2a] rounded-xl p-2 inline-block max-w-[90%]">
            <Image
              width={160}
              height={160}
              src={preview}
              alt="preview"
              className="max-h-40 rounded-lg object-contain max-w-full" 
            />
            <button
              onClick={() => {
                setImage(null);
                setPreview("");
              }}
              className="absolute -top-2 -right-2 p-1.5 cursor-pointer bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2">
        {/* Input Box */}
        <div className="flex-1 bg-[#2a2a2a] rounded-3xl flex items-end px-2 py-1 gap-1 relative min-w-0">
          {/* Emoji Button */}
          <div ref={emojiRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2 rounded-full transition-all cursor-pointer duration-200 ${
                showEmoji
                  ? "bg-[#00d9ff]/20 text-[#00d9ff]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Emoji Picker */}
            {showEmoji && (
              <div className="absolute bottom-14 left-0 w-[90vw] max-w-80 bg-[#1e1e1e] rounded-2xl shadow-2xl border border-[#3a3a3a] overflow-hidden z-500">
                {/* Category Tabs */}
                <div className="flex items-center gap-1 px-2 py-2 bg-[#161616] border-b border-[#3a3a3a] overflow-x-auto">
                  {(Object.keys(emojiCategories) as EmojiCategory[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`p-2 rounded-lg text-lg transition-all cursor-pointer flex-shrink-0 ${
                        activeCategory === key
                          ? "bg-[#00d9ff]/20 scale-110"
                          : "hover:bg-white/5"
                      }`}
                    >
                      {emojiCategories[key].icon}
                    </button>
                  ))}
                </div>

                {/* Emoji Grid */}
                <div className="h-48 sm:h-64 overflow-y-auto p-2">
                  <p className="text-xs text-gray-500 px-2 py-1 font-medium uppercase tracking-wide">
                    {emojiCategories[activeCategory].name}
                  </p>
                  <div className="grid grid-cols-7 sm:grid-cols-8 gap-0.5">
                    {getCategoryEmojis(activeCategory).map((emoji, i) => (
                      <button
                        key={`${emoji}-${i}`}
                        onClick={() => insertEmoji(emoji)}
                        className="p-1.5 text-xl hover:bg-white/10 cursor-pointer rounded-lg transition-all hover:scale-125 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Button with Options */}
          <div ref={cameraOptionsRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowCameraOptions(!showCameraOptions)}
              className="p-2 rounded-full text-gray-400 cursor-pointer hover:text-gray-300 transition-colors"
            >
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Camera Options Dropdown */}
            {showCameraOptions && (
              <div className="absolute bottom-12 left-0 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-2xl overflow-hidden z-500 min-w-40 sm:min-w-48">
                <button
                  onClick={openCamera}
                  className="w-full px-4 py-3 text-white text-sm cursor-pointer hover:bg-[#00d9ff]/10 transition-colors flex items-center gap-3"
                >
                  Take Photo
                </button>
                <label className="w-full px-4 py-3 text-white text-sm hover:bg-[#00d9ff]/10 transition-colors flex items-center gap-3 cursor-pointer">
                  Choose from Gallery
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImage}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Text Input */}
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
            className="flex-1 bg-transparent text-white placeholder-gray-500 px-2 py-2.5 outline-none text-sm resize-none overflow-y-auto min-h-[44px] max-h-32 leading-5 w-full"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={send}
          disabled={isSendingMessage || (!text.trim() && !image)}
          className={`p-3 rounded-full cursor-pointer transition-all duration-300 shadow-lg flex-shrink-0 ${
            text.trim() || image
              ? "bg-[#00d9ff] hover:bg-[#00b8d4] active:scale-95"
              : "bg-[#00d9ff]/50 cursor-not-allowed"
          } ${isSendingMessage ? "opacity-70 scale-95" : ""}`}
        >
          <Send
            className={`w-4 h-4 sm:w-5 sm:h-5 text-black ${isSendingMessage ? "animate-pulse" : ""}`}
          />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;