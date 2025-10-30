import React from "react";
import { Reply, Edit2, Star, Trash2, Copy, Forward, Download, Pin, PinOff, CheckSquare } from "lucide-react";
import { usePinningStore } from "@/stores";
import { useToastStore } from "@/stores";

interface ContextMenuProps {
  contextMenu: { x: number; y: number; message: any };
  contextMenuRef: React.RefObject<HTMLDivElement | null>;
  message: any; 
  isStarred: boolean;
  onReply: (msg: any) => void;
  onEdit: (msg: any) => void;
  onStarToggle: (msgId: string) => void;
  onDelete: (msg: any, deleteType?: "me" | "everyone") => void;
  onForward: (msg: any) => void;
  onClose: () => void;
  isSendingMessage: boolean;
  isOwn: boolean;
  type: "user" | "contact" | "group";
  selectedUser?: any;
  onSelectMode?: (message: any) => void;
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
  onForward,
  onClose,
  isSendingMessage,
  isOwn,
  type,
  selectedUser,
  onSelectMode,
}: ContextMenuProps) => {
  const { togglePinMessage, isMessagePinned, isPinning } = usePinningStore();
  const { showToast } = useToastStore();
  
  const isPinned = isMessagePinned(message._id);
  const isPinningThis = isPinning === message._id;
  
  const hasCopyableText = message.text && message.text.trim().length > 0;

  // Handler functions
  const handleReply = () => {
    onReply(contextMenu.message);
    onClose();
  };

  const handleEdit = () => {
    onEdit(contextMenu.message);
    onClose();
  };

  const handleStarToggle = () => {
    onStarToggle(contextMenu.message._id);
    onClose();
  };

  const handleDelete = (deleteType?: "me" | "everyone") => {
    onDelete(contextMenu.message, deleteType);
    onClose();
  };

  const handleForward = () => {
    onForward(contextMenu.message);
    onClose();
  };

  const handleCopy = async () => {
    if (!hasCopyableText) return;
    
    try {
      await navigator.clipboard.writeText(message.text);
      showToast('Message copied to clipboard!', 'success');
      onClose();
    } catch (err) {
      showToast("Failed to copy to clipboard!", 'error');
      console.error("Failed to copy text: ", err);
      
      // Fallback copy method
      const textArea = document.createElement("textarea");
      textArea.value = message.text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showToast('Message copied to clipboard!', 'success');
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr);
      }
      document.body.removeChild(textArea);
      onClose();
    }
  };

  const handleDownload = () => {
    if (message.image) {
      const link = document.createElement("a");
      link.href = message.image;
      link.download = `image-${message._id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Image downloaded!', 'success');
    }
    onClose();
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
      onClose();
    } catch (error) {
      console.error("Failed to pin/unpin message:", error);
      onClose();
    }
  };

  const handleSelectMode = () => {
    if (onSelectMode) {
      onSelectMode(contextMenu.message);
    }
    onClose();
  };

  return (
    <div
      ref={contextMenuRef}
      className="fixed bg-[#2a2f32] rounded-lg shadow-[0_2px_5px_0_rgba(11,20,26,0.26),0_2px_10px_0_rgba(11,20,26,0.16)] py-2 z-50 text-[14.2px] min-w-[200px] animate-in fade-in zoom-in-95 duration-100 origin-top-left"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Select Option */}
      <button
        onClick={handleSelectMode}
        className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
      >
        <span className="font-normal">Select</span>
        <CheckSquare className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
      </button>

      <button
        onClick={handleReply}
        className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
      >
        <span className="font-normal">Reply</span>
        <Reply className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
      </button>

      <button
        onClick={handlePinToggle}
        disabled={isPinningThis}
        className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229] disabled:opacity-50"
      >
        <span className="font-normal">{isPinned ? "Unpin" : "Pin"}</span>
        {isPinningThis ? (
          <div className="w-[18px] h-[18px] border-2 border-[#8696a0] border-t-transparent rounded-full animate-spin ml-auto" />
        ) : isPinned ? (
          <PinOff className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
        ) : (
          <Pin className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
        )}
      </button>

      {isOwn && hasCopyableText && (
        <button
          onClick={handleEdit}
          className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
        >
          <span className="font-normal">Edit</span>
          <Edit2 className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
        </button>
      )}

      <button
        onClick={handleStarToggle}
        className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
      >
        <span className="font-normal">{isStarred ? "Unstar" : "Star"}</span>
        <Star
          className={`w-[18px] h-[18px] ml-auto transition-all ${
            isStarred ? "fill-[#ffba3d] text-[#ffba3d]" : "text-[#8696a0]"
          }`}
        />
      </button>

      {isOwn ? (
        <button
          onClick={() => handleDelete()}
          className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
          disabled={isSendingMessage}
        >
          <span className="font-normal">Delete</span>
          <Trash2 className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
        </button>
      ) : (
        <button
          onClick={() => handleDelete("me")}
          className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
          disabled={isSendingMessage}
        >
          <span className="font-normal">Delete for me</span>
          <Trash2 className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
        </button>
      )}

      <div className="border-t border-[#3b4a54] my-1" />

      {hasCopyableText && (
        <button
          onClick={handleCopy}
          className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
        >
          <span className="font-normal">Copy</span>
          <Copy className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
        </button>
      )}

      <button
        onClick={handleForward}
        className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
      >
        <span className="font-normal">Forward</span>
        <Forward className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
      </button>

      {contextMenu.message.image && (
        <button
          onClick={handleDownload}
          className="w-full px-6 py-[10px] text-left hover:bg-[#182229] flex items-center gap-[60px] text-[#e9edef] transition-colors active:bg-[#182229]"
        >
          <span className="font-normal">Download</span>
          <Download className="w-[18px] h-[18px] text-[#8696a0] ml-auto" />
        </button>
      )}
    </div>
  );
};

export default ContextMenu;