import React, { useEffect, useState } from "react";

interface DeleteModalProps {
  message: any;
  deleteType?: "me" | "everyone";
  onDelete: (deleteType: "me" | "everyone") => void;
  onClose: () => void;
  isSendingMessage: boolean;
  isOwn: boolean;
}

const DeleteModal = ({ message, deleteType, onDelete, onClose, isSendingMessage, isOwn }: DeleteModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDeleteType, setSelectedDeleteType] = useState<"me" | "everyone" | null>(deleteType || null);

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleDelete = () => {
    if (selectedDeleteType) {
      setIsVisible(false);
      setTimeout(() => onDelete(selectedDeleteType), 150);
    }
  };

  const handleCheckboxChange = (type: "me" | "everyone") => {
    setSelectedDeleteType(type);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-gradient-to-br from-[#1a1a1a] to-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-0 sm:mx-4 transform transition-transform duration-200 ${
          isVisible ? "translate-y-0 sm:scale-100" : "translate-y-full sm:translate-y-0 sm:scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-lg font-medium text-white">Delete message?</h3>
          <p className="text-sm text-[#8696a0] leading-relaxed mt-1">
            {isOwn
              ? "Choose to delete this message for yourself or for everyone in the chat."
              : "This will delete the message for you. Other people in the chat will still be able to see it."}
          </p>
        </div>

        {/* Checklist for delete options (WhatsApp-like for isOwn) */}
        <div className="px-5 py-3">
          {isOwn ? (
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteType"
                  value="me"
                  checked={selectedDeleteType === "me"}
                  onChange={() => handleCheckboxChange("me")}
                  disabled={isSendingMessage}
                  className="w-5 h-5 text-[red] border-[#8696a0] focus:ring-[red] rounded-full"
                />
                <span className="text-white text-sm">Delete for me</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteType"
                  value="everyone"
                  checked={selectedDeleteType === "everyone"}
                  onChange={() => handleCheckboxChange("everyone")}
                  disabled={isSendingMessage}
                  className="w-5 h-5 text-[red] border-[#8696a0] focus:ring-[red] rounded-full"
                />
                <span className="text-white text-sm">Delete for everyone</span>
              </label>
            </div>
          ) : (
            <div className="py-3">
              <span className="text-white text-sm">Delete for me</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center px-5 py-4 space-x-3 border-t border-[#2a3942]">
          <button
            onClick={handleClose}
            disabled={isSendingMessage}
            className="px-4 py-2 bg-[#2a2f32] text-[#8696a0] w-full hover:text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isSendingMessage || (!isOwn && !selectedDeleteType) || (isOwn && !selectedDeleteType)}
            className="px-4 py-2 bg-[red] w-full text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;