import React from "react";
import { Reply } from "lucide-react";

interface Props {
  replyTo: any;
  isOwn: boolean;
  authUser?: { _id?: string };
}

const MessageReplyPreview: React.FC<Props> = ({ replyTo, isOwn, authUser }) => {
  if (!replyTo) return null;

  const senderName = replyTo.senderId?._id === authUser?._id ? "You" : replyTo.senderId?.fullName || "User";
  const previewText = replyTo.text || "📷 Image";

  return (
    <div className={`px-3 py-2 m-2 mb-1 rounded-lg border-l-4 backdrop-blur-sm transition-all duration-200 ${isOwn ? "bg-white/15 border-r-white/30" : "bg-[#2a2a2a]/60 border-l-[#00d9ff]/40"}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
        <Reply className="w-3 h-3 flex-shrink-0" />
        <span className="font-semibold">{senderName}</span>
        <span className="truncate max-w-[160px] ml-1">{previewText}</span>
      </div>
    </div>
  );
};

export default MessageReplyPreview;
