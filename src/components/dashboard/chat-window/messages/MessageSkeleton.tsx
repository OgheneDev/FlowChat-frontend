import React from "react";

const MessageSkeleton = () => (
  <div className="space-y-6 p-4 animate-pulse">
    {/* Left-aligned (Incoming) Message */}
    <div className="flex gap-3 items-start">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] shadow-sm flex-shrink-0" />
      <div className="flex-1 space-y-3 max-w-xs md:max-w-md">
        <div className="h-3 w-20 bg-[#2a2a2a]/60 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 w-48 bg-[#2a2a2a]/50 rounded-xl" />
          <div className="h-4 w-32 bg-[#2a2a2a]/40 rounded-xl" />
        </div>
      </div>
    </div>

    {/* Right-aligned (Outgoing) Message */}
    <div className="flex gap-3 items-start justify-end">
      <div className="flex-1 space-y-3 max-w-xs md:max-w-md text-right">
        <div className="h-3 w-20 bg-[#2a2a2a]/60 rounded-full ml-auto" />
        <div className="space-y-2">
          <div className="h-4 w-40 bg-[#2a2a2a]/50 rounded-xl ml-auto" />
          <div className="h-4 w-28 bg-[#2a2a2a]/40 rounded-xl ml-auto" />
          <div className="h-4 w-36 bg-[#2a2a2a]/30 rounded-xl ml-auto" />
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] shadow-sm flex-shrink-0" />
    </div>
  </div>
);

export default MessageSkeleton;