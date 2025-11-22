import React, { useState, useEffect } from "react";
import { usePinningStore } from "@/stores";
import { Image as ImageIcon } from "lucide-react";
import { formatTime } from "@/utils/utils";

export const PinnedMessagePreview = ({ messageId, type, selectedUser }: { 
  messageId: string, 
  type: string,
  selectedUser: any 
}) => {
  const { messageDetails, fetchMessageDetails, isMessagePinned } = usePinningStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const message = messageDetails[messageId];

  useEffect(() => {
    const loadMessageDetails = async () => {
      if (!message && !isLoading) {
        setIsLoading(true);
        try {
          await fetchMessageDetails(messageId);
        } catch (error) {
          console.error('Failed to load pinned message details:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadMessageDetails();
  }, [messageId, message, fetchMessageDetails, isLoading]);

  const handleClick = () => {
    // Dispatch a custom event that MessageList can listen for
    window.dispatchEvent(new CustomEvent('scrollToMessage', { 
      detail: { messageId } 
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs border-l-2 border-[#00d9ff] animate-pulse">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="h-3 bg-[#3a3a3a] rounded w-3/4"></div>
            <div className="h-2 bg-[#3a3a3a] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs text-[#ccc] border-l-2 border-[#2a2a2a]">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="truncate text-white font-medium">Message not found</div>
            <div className="text-[#999] text-xs mt-1">Unable to load message</div>
          </div>
        </div>
      </div>
    );
  }

  const senderName = message.senderId?.fullName || 'Unknown';
  const messagePreview = message.text 
    ? (message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text)
    : message.image 
    ? '📷 Photo' 
    : 'Message';

  return (
    <div 
      onClick={handleClick}
      className="bg-[#2a2a2a]/50 rounded-lg p-2 text-xs text-[#ccc] border-l-2 border-[#00d9ff] hover:bg-[#2a2a2a]/70 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#00d9ff] font-medium truncate">{senderName}</span>
            <span className="text-[#999] text-xs">
              {formatTime(message.createdAt)}
            </span>
          </div>
          
          {message.replyTo && (
            <div className="mb-1 px-2 py-1 bg-[#1a1a1a]/50 rounded text-[#888] border-l border-[#2a2a2a]/30">
              <div className="flex items-center gap-1">
                <span className="text-[#2a2a2a] text-xs">↳</span>
                <span className="truncate text-xs">
                  {message.replyTo.text || '📷 Photo'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            {message.image && (
              <div className="flex-shrink-0 w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-[#2a2a2a]" />
              </div>
            )}
            <div className={`${message.image ? 'flex-1' : ''}`}>
              <div className="text-white font-medium truncate">
                {messagePreview}
              </div>
              {message.editedAt && (
                <span className="text-[#999] text-xs italic ml-1">(edited)</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};