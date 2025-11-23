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

  // Handle image with better mobile support
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear previous file input
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    setShowCameraOptions(false);
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB");
      return;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.onerror = () => {
      console.error("Error reading image file");
      alert("Error loading image. Please try another image.");
    };
    reader.readAsDataURL(file);
    setImage(file);
  };

  // Direct camera access using MediaDevices API with modern WhatsApp-style UI
  const openCamera = async () => {
    setShowCameraOptions(false);
    
    try {
      // Check if browser supports mediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraInputRef.current?.click();
        return;
      }

      // Create a video element for camera preview
      const video = document.createElement('video');
      video.setAttribute('playsinline', 'true');
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

      // Create controls container at bottom
      const controlsContainer = document.createElement('div');
      controlsContainer.style.position = 'fixed';
      controlsContainer.style.bottom = '0';
      controlsContainer.style.left = '0';
      controlsContainer.style.right = '0';
      controlsContainer.style.height = '140px';
      controlsContainer.style.background = 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)';
      controlsContainer.style.display = 'flex';
      controlsContainer.style.alignItems = 'center';
      controlsContainer.style.justifyContent = 'center';
      controlsContainer.style.gap = '40px';
      controlsContainer.style.zIndex = '1001';

      // Create gallery button (left) - images only
      const galleryBtn = document.createElement('button');
      galleryBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>`;
      galleryBtn.title = 'Select image from gallery';
      galleryBtn.style.width = '56px';
      galleryBtn.style.height = '56px';
      galleryBtn.style.borderRadius = '50%';
      galleryBtn.style.backgroundColor = 'rgba(255,255,255,0.15)';
      galleryBtn.style.border = 'none';
      galleryBtn.style.display = 'flex';
      galleryBtn.style.alignItems = 'center';
      galleryBtn.style.justifyContent = 'center';
      galleryBtn.style.cursor = 'pointer';
      galleryBtn.style.transition = 'all 0.2s ease';
      galleryBtn.style.backdropFilter = 'blur(10px)';

      // Create capture button (center) - WhatsApp style
      const captureBtn = document.createElement('button');
      captureBtn.innerHTML = `<div style="width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <div style="width: 52px; height: 52px; border-radius: 50%; border: 3px solid #000;"></div>
      </div>`;
      captureBtn.style.width = '72px';
      captureBtn.style.height = '72px';
      captureBtn.style.borderRadius = '50%';
      captureBtn.style.backgroundColor = 'transparent';
      captureBtn.style.border = '4px solid rgba(255,255,255,0.3)';
      captureBtn.style.display = 'flex';
      captureBtn.style.alignItems = 'center';
      captureBtn.style.justifyContent = 'center';
      captureBtn.style.cursor = 'pointer';
      captureBtn.style.transition = 'all 0.15s ease';
      captureBtn.style.transform = 'scale(1)';

      // Create flip camera button (right)
      const flipBtn = document.createElement('button');
      flipBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M8 16H3v5"/>
      </svg>`;
      flipBtn.style.width = '56px';
      flipBtn.style.height = '56px';
      flipBtn.style.borderRadius = '50%';
      flipBtn.style.backgroundColor = 'rgba(255,255,255,0.15)';
      flipBtn.style.border = 'none';
      flipBtn.style.display = 'flex';
      flipBtn.style.alignItems = 'center';
      flipBtn.style.justifyContent = 'center';
      flipBtn.style.cursor = 'pointer';
      flipBtn.style.transition = 'all 0.2s ease';
      flipBtn.style.backdropFilter = 'blur(10px)';

      // Create close button (top-left)
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>`;
      closeBtn.style.position = 'fixed';
      closeBtn.style.top = '20px';
      closeBtn.style.left = '20px';
      closeBtn.style.width = '48px';
      closeBtn.style.height = '48px';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
      closeBtn.style.border = 'none';
      closeBtn.style.display = 'flex';
      closeBtn.style.alignItems = 'center';
      closeBtn.style.justifyContent = 'center';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.zIndex = '1001';
      closeBtn.style.backdropFilter = 'blur(10px)';
      closeBtn.style.transition = 'all 0.2s ease';

      // Add hover effects
      [galleryBtn, flipBtn, closeBtn].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = 'rgba(255,255,255,0.25)';
          btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = btn === closeBtn ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.15)';
          btn.style.transform = 'scale(1)';
        });
      });

      captureBtn.addEventListener('mouseenter', () => {
        captureBtn.style.transform = 'scale(1.08)';
      });
      captureBtn.addEventListener('mouseleave', () => {
        captureBtn.style.transform = 'scale(1)';
      });

      // Create canvas for capturing image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let stream: MediaStream;
      let currentFacingMode: 'user' | 'environment' = 'environment';

      const startCamera = async (facingMode: 'user' | 'environment') => {
        try {
          // Stop existing stream if any
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }

          // Request camera access
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          });
          
          video.srcObject = stream;
          await video.play();
          currentFacingMode = facingMode;
        } catch (err) {
          console.error('Error starting camera:', err);
          throw err;
        }
      };

      try {
        await startCamera('environment');

        // Add elements to containers
        cameraContainer.appendChild(video);
        controlsContainer.appendChild(galleryBtn);
        controlsContainer.appendChild(captureBtn);
        controlsContainer.appendChild(flipBtn);
        cameraContainer.appendChild(controlsContainer);
        cameraContainer.appendChild(closeBtn);
        document.body.appendChild(cameraContainer);

        // Gallery button - open file picker
        galleryBtn.onclick = () => {
          cleanup();
          cameraInputRef.current?.click();
        };

        // Flip camera button
        flipBtn.onclick = async () => {
          const newMode = currentFacingMode === 'environment' ? 'user' : 'environment';
          
          // Add rotation animation
          flipBtn.style.transform = 'rotate(180deg) scale(1.05)';
          setTimeout(() => {
            flipBtn.style.transform = 'rotate(0deg) scale(1)';
          }, 300);

          try {
            await startCamera(newMode);
          } catch (err) {
            console.error('Failed to flip camera:', err);
          }
        };

        // Capture photo
        captureBtn.onclick = () => {
          if (ctx && video.videoWidth > 0) {
            // Flash effect
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'white';
            flash.style.zIndex = '1002';
            flash.style.opacity = '0.8';
            flash.style.pointerEvents = 'none';
            cameraContainer.appendChild(flash);
            
            setTimeout(() => {
              if (flash.parentNode) {
                cameraContainer.removeChild(flash);
              }
            }, 150);

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `camera-${Date.now()}.jpg`, { 
                  type: 'image/jpeg' 
                });
                
                const reader = new FileReader();
                reader.onload = () => {
                  setPreview(reader.result as string);
                };
                reader.readAsDataURL(blob);
                setImage(file);
                
                cleanup();
              }
            }, 'image/jpeg', 0.95);
          }
        };

        // Close camera
        const cleanup = () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (cameraContainer.parentNode) {
            document.body.removeChild(cameraContainer);
          }
        };

        closeBtn.onclick = cleanup;

      } catch (cameraError) {
        console.error('Camera error:', cameraError);
        cameraInputRef.current?.click();
        if (cameraContainer.parentNode) {
          document.body.removeChild(cameraContainer);
        }
      }

    } catch (error) {
      console.error('Error accessing camera:', error);
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

  // Convert image to base64 for socket transmission (from old version)
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Send message via Socket.IO (from old version - PROVEN WORKING)
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
      // Create optimistic message for UI (using old version structure)
      const optimisticMessage = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        text: payload.text || "",
        image: preview || null,
        senderId: authUser,
        receiverId: type === "group" ? undefined : receiverId,
        groupId: type === "group" ? receiverId : undefined,
        status: "sent" as const,
        replyTo: replyingTo || null,
        createdAt: new Date().toISOString(),
      } as any;

      console.log("➕ Adding optimistic message:", optimisticMessage._id);

      // Add optimistically to UI
      if (type === "group") {
        useGroupStore.getState().addIncomingGroupMessage(optimisticMessage);
        console.log("📤 Emitting sendGroupMessage to server");
        socket.emit("sendGroupMessage", {
          groupId: receiverId,
          ...payload,
        });
      } else {
        usePrivateChatStore.getState().addIncomingMessage(optimisticMessage);
        console.log("📤 Emitting sendMessage to server");
        socket.emit("sendMessage", {
          receiverId,
          ...payload,
        });
      }
      
      console.log("✅ Message sent successfully (optimistic)");

      // Clear form
      setText("");
      setImage(null);
      setPreview("");
      clearReply();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      
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
                  className="w-full px-4 py-3 text-white text-[10px] md:text-sm cursor-pointer hover:bg-[#00d9ff]/10 transition-colors flex items-center gap-3"
                >
                  Take Photo
                </button>
                <label className="w-full px-4 py-3 text-white text-[10px] md:text-sm hover:bg-[#00d9ff]/10 transition-colors flex items-center gap-3 cursor-pointer">
                  Choose from Gallery
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImage}
                  />
                </label>
              </div>
            )}

            {/* Hidden camera input for fallback */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImage}
            />
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