"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { usePrivateChatStore, useGroupStore } from "@/stores";
import { useAuthStore } from "@/stores";
import MessageItem from "./MessageItem";
import MessageSkeleton from "./MessageSkeleton"; 

interface MessageListProps {
  isLoading: boolean;
  type: "user" | "contact" | "group";
  selectedUser?: any;
  onSelectionModeChange?: (isSelectionMode: boolean) => void;
  onSelectedMessagesChange?: (selectedIds: string[]) => void;
}

export interface MessageListHandle {
  scrollToMessage: (messageId: string) => void; 
  highlightMessage: (messageId: string) => void;
  clearSelection: () => void;
}

const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  ({ isLoading, type, selectedUser, onSelectionModeChange, onSelectedMessagesChange }, ref) => {
    const { privateMessages, isSendingMessage: isPrivateSending } = usePrivateChatStore();
    const { groupMessages, isSendingMessage: isGroupSending } = useGroupStore();
    const { authUser } = useAuthStore() as { authUser: { _id: string } | null };
    const messages = type === "group" ? groupMessages : privateMessages;
    const isSendingMessage = type === "group" ? isGroupSending : isPrivateSending;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const highlightedMessageRef = useRef<string | null>(null); 
    
    // Selection state
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    useEffect(() => {
  // This will automatically handle incoming real-time messages
  // via the socket listeners in the parent ChatWindow
  console.log('MessageList updated with:', messages.length, 'messages');
}, [messages]);

    // Use useCallback to prevent unnecessary re-renders
    const toggleMessageSelection = useCallback((messageId: string) => {
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(messageId)) {
          newSet.delete(messageId);
        } else {
          newSet.add(messageId);
        }
        return newSet;
      });
    }, []);

    // Handle select mode activation
    const handleSelectMode = useCallback((message: any) => {
      setIsSelectionMode(true);
      // Auto-select the message that was right-clicked
      setSelectedMessages(new Set([message._id]));
    }, []);

    // Clear all selections
    const clearSelection = useCallback(() => {
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
    }, []);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      scrollToMessage: (messageId: string) => {
        const messageElement = messageRefs.current.get(messageId);
        if (messageElement) {
          messageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          highlightMessage(messageId);
        } else {
          console.warn('Message element not found:', messageId);
        }
      },
      highlightMessage: (messageId: string) => {
        highlightMessage(messageId);
      },
      clearSelection: clearSelection
    }));

    const highlightMessage = (messageId: string) => {
      if (highlightedMessageRef.current) {
        const prevElement = messageRefs.current.get(highlightedMessageRef.current);
        if (prevElement) {
          prevElement.classList.remove('message-highlight');
        }
      }

      const element = messageRefs.current.get(messageId);
      if (element) {
        element.classList.add('message-highlight');
        highlightedMessageRef.current = messageId;

        setTimeout(() => {
          if (highlightedMessageRef.current === messageId) {
            element.classList.remove('message-highlight');
            highlightedMessageRef.current = null;
          }
        }, 3000);
      }
    };

    const setMessageRef = (messageId: string, element: HTMLDivElement | null) => {
      if (element) {
        messageRefs.current.set(messageId, element);
      } else {
        messageRefs.current.delete(messageId);
      }
    };

    useEffect(() => {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      return () => clearTimeout(timer);
    }, [messages]);

    // Enable selection mode when messages are selected
    useEffect(() => {
      if (selectedMessages.size > 0 && !isSelectionMode) {
        setIsSelectionMode(true);
      } else if (selectedMessages.size === 0 && isSelectionMode) {
        setIsSelectionMode(false);
      }
    }, [selectedMessages.size, isSelectionMode]);

    // Notify parent about selection mode 
    useEffect(() => {
      onSelectionModeChange?.(isSelectionMode);
    }, [isSelectionMode, onSelectionModeChange]);

    // Notify parent about selected messages
    useEffect(() => {
      onSelectedMessagesChange?.(Array.from(selectedMessages));
    }, [selectedMessages, onSelectedMessagesChange]);

    const styles = `
  .message-highlight {
    animation: highlight-pulse 3s ease-in-out;
    border-left: 3px solid #00d9ff;
    background: linear-gradient(90deg, rgba(0, 217, 255, 0.1) 0%, transparent 100%);
  }
  
  @keyframes highlight-pulse {
    0% { background: rgba(0, 217, 255, 0.2); }
    50% { background: rgba(0, 217, 255, 0.1); }
    100% { background: rgba(0, 217, 255, 0.05); }
  }
`;

// Add the styles to the document head
useEffect(() => {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
  
  return () => {
    document.head.removeChild(styleSheet);
  };
}, []);

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
      <div className={`flex-1 overflow-y-auto p-3 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-transparent ${isSelectionMode ? 'selection-mode' : ''}`}>
        {messages.map((message: any, index: number) => (
          <MessageItem
            key={message._id}
            message={message}
            index={index}
            type={type}
            authUser={authUser}
            messages={messages}
            isSendingMessage={isSendingMessage}
            selectedUser={selectedUser}
            isSelectionMode={isSelectionMode}
            isSelected={selectedMessages.has(message._id)}
            onToggleSelect={toggleMessageSelection}
            onSelectMode={handleSelectMode} // Pass the handler
            ref={(el) => setMessageRef(message._id, el)}
          />
        ))}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;