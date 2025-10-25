import React from "react";

const MessageSkeleton = () => (
  <div className="flex gap-3 p-4 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] shadow-sm" />
    <div className="flex-1 space-y-3">
      <div className="h-3 w-24 bg-[#2a2a2a]/60 rounded-full" />
      <div className="space-y-2">
        <div className="h-4 w-48 bg-[#2a2a2a]/50 rounded-xl" />
        <div className="h-4 w-32 bg-[#2a2a2a]/40 rounded-xl" />
      </div>
    </div>
  </div>
);

export default MessageSkeleton;