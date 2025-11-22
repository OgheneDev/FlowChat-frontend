import React from "react";
import { Check, CheckCheck, Pin, Star } from "lucide-react";
import { formatTime } from "@/utils/utils";

interface Props {
  message: any;
  isOwn: boolean;
  isStarred?: boolean;
  isPinned?: boolean;
}

const MessageMeta: React.FC<Props> = ({ message, isOwn, isStarred, isPinned }) => {
  return (
    <div className={`flex items-center gap-1.5 px-1 text-xs font-medium ${isOwn ? "justify-end" : "justify-start"}`}>
      {isStarred && <Star className="w-3 h-3 text-[#00d9ff] fill-[#00d9ff]" />}
      {isPinned && <Pin className="w-3 h-3 text-[#00d9ff] fill-[#00d9ff]" />}
      <span className="text-[#888]">{formatTime(message.createdAt)}</span>

      {isOwn && (
        <>
          {message.status === "sent" && <Check className="w-3.5 h-3.5 text-gray-400 opacity-90 flex-shrink-0" />}
          {message.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-gray-400 opacity-90 flex-shrink-0" />}
          {message.status === "seen" && <CheckCheck className="w-3.5 h-3.5 text-[#00d9ff] opacity-90 flex-shrink-0" />}
        </>
      )}
    </div>
  );
};

export default MessageMeta;
