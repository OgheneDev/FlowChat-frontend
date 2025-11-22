import React from "react";
import { CheckCheck, X as XIcon } from "lucide-react";

interface Props {
  message: any;
  isOwn: boolean;
  isEditing?: boolean;
  editText?: string;
  setEditText?: (v: string) => void;
  saveEdit?: () => void;
  cancelEdit?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  children?: React.ReactNode; 
}

const MessageBubble: React.FC<Props> = ({ message, isOwn, isEditing, editText, setEditText, saveEdit, cancelEdit, onContextMenu, children }) => {
  return (
    <div onContextMenu={onContextMenu} className={`relative rounded-2xl overflow-hidden transition-all duration-400 max-w-[70%] sm:max-w-[60%] ${isOwn ? "bg-gradient-to-r from-[#00d9ff] to-[#0099cc] shadow-lg shadow-[#00d9ff]/25 rounded-br-md" : "bg-[#1f1f1f] shadow-md border border-[#2a2a2a]/50 rounded-bl-md"}`}>
      {isEditing ? (
        <div className="p-3 flex items-end gap-2 bg-[#0a0a0a]/60">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText?.(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && saveEdit?.()}
            className="flex-1 bg-[#2a2a2a]/80 text-white px-3.5 py-2.5 rounded-xl text-sm outline-none ring-1 ring-transparent focus:ring-[#00d9ff]/40 transition-all placeholder-gray-500"
            autoFocus
            placeholder="Edit message..."
          />
          <button onClick={saveEdit} className="p-2 rounded-lg bg-[#00d9ff]/20 text-[#00d9ff] hover:bg-[#00d9ff]/40 transition-all duration-200 flex-shrink-0">
            <CheckCheck className="w-4 h-4" />
          </button>
          <button onClick={cancelEdit} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all duration-200 flex-shrink-0">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {children}
        </>
      )}
    </div>
  );
};

export default MessageBubble;
