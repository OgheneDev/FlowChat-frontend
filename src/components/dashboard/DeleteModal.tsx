import React from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  message: any;
  deleteType: "me" | "everyone";
  onDelete: (deleteType: "me" | "everyone") => void;
  onClose: () => void;
  isSendingMessage: boolean;
}

// In your DeleteModal component, update the text and logic
const DeleteModal = ({ message, deleteType, onDelete, onClose, isSendingMessage }: DeleteModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c1e] rounded-3xl shadow-2xl border border-white/10 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-semibold text-white mb-1">
                Delete Message
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {deleteType === "me"
                  ? "This message will be deleted only for you. Others will still be able to see it."
                  : "This message will be deleted for everyone in this chat."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={() => onDelete("me")}
            disabled={isSendingMessage}
            className="w-full px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all"
          >
            Delete for Me
          </button>

          {deleteType === "everyone" && (
            <button
              onClick={() => onDelete("everyone")}
              disabled={isSendingMessage}
              className="w-full px-5 py-3.5 bg-red-500/10 hover:bg-red-500/15 text-red-400 rounded-2xl transition-all border border-red-500/30"
            >
              Delete for Everyone
            </button>
          )}
        </div>

        <div className="border-t border-white/5 p-4">
          <button
            onClick={onClose}
            disabled={isSendingMessage}
            className="w-full px-5 py-3 text-gray-400 hover:text-white rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;