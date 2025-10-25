import React from "react";
import { Reply, Edit2, Star, Trash2, Copy, Forward, Download, Pin, PinOff } from "lucide-react";
import { usePinningStore } from "@/stores";

interface ContextMenuProps {
  contextMenu: { x: number; y: number; message: any };
  contextMenuRef: React.RefObject<HTMLDivElement | null>;
  message: any;
  isStarred: boolean;
  onReply: (msg: any) => void;
  onEdit: (msg: any) => void;
  onStarToggle: (msgId: string) => void;
  onDelete: (msg: any, deleteType: "me" | "everyone") => void;
  isSendingMessage: boolean;
  isOwn: boolean;
  type: "user" | "contact" | "group";
  selectedUser?: any;
}

const ContextMenu = ({
  contextMenu,
  contextMenuRef,
  message,
  isStarred,
  onReply,
  onEdit,
  onStarToggle,
  onDelete,
  isSendingMessage,
  isOwn,
  type,
  selectedUser,
}: ContextMenuProps) => {
  const { togglePinMessage, isMessagePinned, isPinning } = usePinningStore();
  
  const isPinned = isMessagePinned(message._id);
  const isPinningThis = isPinning === message._id;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text); 
    }
  };

  const handleForward = () => {
    console.log("Forward message:", message);
  };

  const handleDownload = () => {
    if (message.image) {
      const link = document.createElement("a");
      link.href = message.image;
      link.download = `image-${message._id}.jpg`;
      link.click();
    }
  };

  const handlePinToggle = async () => {
    try {
      const payload = {
        messageId: message._id,
        ...(type === 'group' 
          ? { groupId: selectedUser?._id } 
          : { chatPartnerId: selectedUser?._id }
        )
      };
      await togglePinMessage(payload);
    } catch (error) {
      console.error("Failed to pin/unpin message:", error);
    }
  };

  return (
    <div
      ref={contextMenuRef}
      className="fixed bg-[#1a1a1a]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#3a3a3a] py-2 z-50 text-sm min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onReply(contextMenu.message)}
        className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
      >
        <Reply className="w-4 h-4 text-[#00d9ff] group-hover:scale-110 transition-transform" />
        <span>Reply</span>
      </button>

      {/* Pin/Unpin Option */}
      <button
        onClick={handlePinToggle}
        disabled={isPinningThis}
        className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group disabled:opacity-50"
      >
        {isPinningThis ? (
          <div className="w-4 h-4 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin" />
        ) : isPinned ? (
          <PinOff className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
        ) : (
          <Pin className="w-4 h-4 text-[#999] group-hover:scale-110 transition-transform" />
        )}
        <span>{isPinned ? "Unpin" : "Pin"}</span>
      </button>

      {isOwn && contextMenu.message.text && (
        <button
          onClick={() => onEdit(contextMenu.message)}
          className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
        >
          <Edit2 className="w-4 h-4 text-[#00d9ff] group-hover:scale-110 transition-transform" />
          <span>Edit</span>
        </button>
      )}

      <button
        onClick={() => onStarToggle(contextMenu.message._id)}
        className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
      >
        <Star
          className={`w-4 h-4 transition-all group-hover:scale-110 ${
            isStarred ? "fill-yellow-500 text-yellow-500" : "text-[#999]"
          }`}
        />
        <span>{isStarred ? "Unstar" : "Star"}</span>
      </button>

      <button
        onClick={() => onDelete(contextMenu.message, isOwn ? "everyone" : "me")}
        className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 flex items-center gap-3 text-red-400 transition-all group"
        disabled={isSendingMessage}
      >
        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>{isOwn ? "Delete" : "Delete for Me"}</span>
      </button>

      <div className="border-t border-[#3a3a3a] my-1 mx-2" />

      <button
        onClick={handleCopy}
        className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
        disabled={!message.text}
      >
        <Copy className="w-4 h-4 text-[#999] group-hover:scale-110 transition-transform" />
        <span>Copy</span>
      </button>

      <button
        onClick={handleForward}
        className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
      >
        <Forward className="w-4 h-4 text-[#999] group-hover:scale-110 transition-transform" />
        <span>Forward</span>
      </button>

      {contextMenu.message.image && (
        <button
          onClick={handleDownload}
          className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center gap-3 text-white transition-all group"
        >
          <Download className="w-4 h-4 text-[#999] group-hover:scale-110 transition-transform" />
          <span>Download</span>
        </button>
      )}
    </div>
  );
};

export default ContextMenu;