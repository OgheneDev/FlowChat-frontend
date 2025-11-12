import React from "react";

const MessageSkeleton = () => (
  <div className="space-y-4 p-4 animate-pulse">
    {/* Incoming message skeleton */}
    <div className="flex gap-3 items-start">
      {/* Avatar skeleton */}
      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex-shrink-0" />
      
      {/* Message content skeleton */}
      <div className="flex-1 space-y-2 max-w-xs">
        {/* Sender name */}
        <div className="h-3 w-20 bg-[#2a2a2a] rounded-full mb-2" />
        
        {/* Message bubbles */}
        <div className="space-y-2">
          <div className="h-4 w-48 bg-[#2a2a2a] rounded-lg" />
          <div className="h-4 w-32 bg-[#2a2a2a] rounded-lg" />
        </div>
      </div>
    </div>

    {/* Outgoing message skeleton */}
    <div className="flex gap-3 items-start justify-end">
      {/* Message content skeleton */}
      <div className="flex-1 space-y-2 max-w-xs">
        {/* Sender name */}
        <div className="h-3 w-20 bg-[#2a2a2a] rounded-full mb-2 ml-auto" />
        
        {/* Message bubbles */}
        <div className="space-y-2">
          <div className="h-4 w-40 bg-[#2a2a2a] rounded-lg ml-auto" />
          <div className="h-4 w-28 bg-[#2a2a2a] rounded-lg ml-auto" />
        </div>
      </div>
      
      {/* Avatar skeleton */}
      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex-shrink-0" />
    </div>

    {/* Single incoming message skeleton */}
    <div className="flex gap-3 items-start">
      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex-shrink-0" />
      <div className="flex-1 space-y-2 max-w-xs">
        <div className="h-3 w-20 bg-[#2a2a2a] rounded-full mb-2" />
        <div className="h-4 w-36 bg-[#2a2a2a] rounded-lg" />
      </div>
    </div>
  </div>
);

export default MessageSkeleton;