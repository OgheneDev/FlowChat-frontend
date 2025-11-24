import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Star, ArrowLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useStarringStore, useAuthStore } from "@/stores";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (msg: any) => void;
}

const StarredMessagesModal: React.FC<Props> = ({ isOpen, onClose, onSelectMessage }) => {
  const { 
    starredMessageItems, 
    modalLoading, 
    modalError,
    loadStarredMessagesForModal 
  } = useStarringStore();
  
  const { authUser } = useAuthStore();

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-[#2a2a2a] rounded w-1/3"></div>
              <div className="h-3 bg-[#2a2a2a] rounded w-1/4"></div>
            </div>
            <div className="h-3 bg-[#2a2a2a] rounded w-2/3"></div>
            <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
      <h4 className="text-white font-medium mb-2">Failed to load starred messages</h4>
      <p className="text-[#999] text-sm mb-4">{modalError}</p>
      <button
        onClick={loadStarredMessagesForModal}
        className="px-4 py-2 bg-[#00d9ff] text-black rounded-lg hover:bg-[#00c4e6] transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Star className="w-16 h-16 text-[#f5d04c] mb-4 opacity-50" />
      <h4 className="text-white font-medium mb-2">No Starred Messages</h4>
      <p className="text-[#999] text-sm">
        Messages you star will appear here for easy access.
      </p>
    </div>
  );

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  const getSenderName = (message: any) => {
    if (message.senderId?._id === authUser?._id) {
      return "You";
    }
    return message.senderId?.fullName || "Unknown User";
  };

  const getReceiverName = (message: any) => {
    if (message.groupId) {
      return message.groupId?.name || "Group Chat";
    }
    
    // For private messages
    if (message.senderId?._id === authUser?._id) {
      // You sent it, so receiver is the other person
      return message.receiverId?.fullName || message.chatPartnerId?.fullName || "Unknown";
    } else {
      // They sent it to you
      return "You";
    }
  };

  const isOwnMessage = (message: any) => {
    return message.senderId?._id === authUser?._id;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-50 bg-[#0a0a0a] md:flex md:items-center md:justify-center md:bg-black/70 md:backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }} 
            className="w-full h-full md:max-w-2xl md:max-h-[85vh] md:h-auto bg-[#0a0a0a] md:rounded-2xl md:border md:border-[#2a2a2a] md:shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] border-b border-[#2a2a2a]">
              <button 
                onClick={onClose}
                className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Starred</h3>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
              {modalLoading ? (
                <LoadingSkeleton />
              ) : modalError ? (
                <ErrorState />
              ) : starredMessageItems.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  {starredMessageItems.map((message: any) => {
                    const isOwn = isOwnMessage(message);
                    const senderName = getSenderName(message);
                    const receiverName = getReceiverName(message);
                    
                    return (
                      <motion.button
                        key={message._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onSelectMessage(message)}
                        className="w-full text-left p-4 hover:bg-[#1a1a1a] transition-colors cursor-pointer flex items-start gap-3"
                      >
                        {/* Profile Picture */}
                        <div className="flex-shrink-0 pt-1">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2a]">
                            {message.senderId?.profilePic ? (
                              <Image 
                                src={message.senderId.profilePic} 
                                alt={senderName}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                                {senderName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header with names */}
                          <div className="flex items-center text-sm mb-1">
                            <span className={`font-medium ${isOwn ? 'text-white' : 'text-[#00d9ff]'}`}>
                              {senderName}
                            </span>
                            <ChevronRight className="w-4 h-4 mx-1 text-[#666]" />
                            <span className="text-[#999]">{receiverName}</span>
                          </div>

                          {/* Message Bubble */}
                          <div className={`relative rounded-2xl overflow-hidden max-w-[85%] ${
                            isOwn 
                              ? "bg-gradient-to-r from-[#00d9ff] to-[#0099cc] shadow-lg shadow-[#00d9ff]/25 rounded-br-md" 
                              : "bg-[#1f1f1f] shadow-md border border-[#2a2a2a]/50 rounded-bl-md"
                          }`}>
                            <div className="p-3">
                              {/* Image if exists */}
                              {message.image && (
                                <div className="mb-2 rounded-lg overflow-hidden">
                                  <Image 
                                    src={message.image} 
                                    alt="Message image"
                                    width={300}
                                    height={200}
                                    className="object-cover max-w-full"
                                  />
                                </div>
                              )}
                              
                              {/* Text */}
                              {message.text && (
                                <p className={`text-sm leading-relaxed break-words ${
                                  isOwn ? 'text-white' : 'text-[#e0e0e0]'
                                }`}>
                                  {message.text}
                                </p>
                              )}
                              
                              {/* File attachment */}
                              {message.file && !message.image && (
                                <div className={`flex items-center gap-2 text-sm ${
                                  isOwn ? 'text-white/90' : 'text-[#00d9ff]'
                                }`}>
                                  <span>📎</span>
                                  <span>File attachment</span>
                                </div>
                              )}
                              
                              {/* Time with star */}
                              <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                                isOwn ? 'text-white/70' : 'text-[#999]'
                              }`}>
                                <Star className="w-3 h-3 text-[#f5d04c] fill-current" />
                                <span>{formatMessageTime(message.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Date and time on the right */}
                        <div className="flex-shrink-0 text-right pt-1">
                          <div className="text-xs text-[#999]">
                            {formatMessageDate(message.createdAt)}
                          </div>
                        </div>

                        {/* Chevron arrow */}
                        <div className="flex-shrink-0 pt-1">
                          <ChevronRight className="w-4 h-4 text-[#666]" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StarredMessagesModal;