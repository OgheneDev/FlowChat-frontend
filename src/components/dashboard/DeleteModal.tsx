import React from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  message: any;
  deleteType: "me" | "everyone";
  onDelete: (deleteType: "me" | "everyone") => void;
  onClose: () => void;
  isSendingMessage: boolean;
}

const DeleteModal = ({ message, deleteType, onDelete, onClose, isSendingMessage }: DeleteModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#1c1c1e] rounded-3xl shadow-2xl border border-white/10 max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
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
                  ? "This message will be removed from your view only."
                  : "Choose who you want to delete this message for."}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSendingMessage}
              className="flex-shrink-0 w-8 h-8 cursor-pointer rounded-full hover:bg-white/10 flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="px-6 pb-4">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
            <div className="flex-shrink-0 w-1 h-1 rounded-full bg-amber-400 mt-2"></div>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={() => onDelete("me")}
            disabled={isSendingMessage}
            className="w-full group relative cursor-pointer overflow-hidden px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <span className="font-medium">Delete for Me</span>
            <Trash2 className="w-4.5 h-4.5 opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          {deleteType === "everyone" && (
            <button
              onClick={() => onDelete("everyone")}
              disabled={isSendingMessage}
              className="w-full group relative cursor-pointer overflow-hidden px-5 py-3.5 bg-red-500/10 hover:bg-red-500/15 text-red-400 hover:text-red-300 rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between border border-red-500/30 hover:border-red-500/40"
            >
              <span className="font-medium">Delete for Everyone</span>
              <Trash2 className="w-4.5 h-4.5 opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 p-4">
          <button
            onClick={onClose}
            disabled={isSendingMessage}
            className="w-full px-5 py-3 cursor-pointer text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;