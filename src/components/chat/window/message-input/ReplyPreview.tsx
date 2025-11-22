import React from 'react'
import { X, Reply } from 'lucide-react'

interface ReplyPreviewProps {
    replyName: string
    replyingTo: string | { text?: string }
    clearReply: () => void
    text: string
}

const ReplyPreview = ({replyName, replyingTo, clearReply, text}: ReplyPreviewProps) => {
  return (
    <div className="bg-[#2a2a2a]/60 rounded-lg p-3 border-l-4 border-[#00d9ff] flex items-center gap-3 animate-in slide-in-from-top">
        <Reply className="w-4 h-4 text-[#00d9ff] flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="text-xs text-[#00d9ff] font-semibold truncate">
                Replying to {replyName}
            </p>
            <p className="text-xs text-[#999] truncate">
                {typeof replyingTo === 'string' ? (replyingTo || "Photo") : (replyingTo.text || "Photo")}
            </p>
        </div>
        <button
            onClick={clearReply}
            className="p-1 hover:bg-[#333] rounded flex-shrink-0"
        >
            <X className="w-4 h-4 text-[#999]" />
        </button>
    </div>
  )
}

export default ReplyPreview
