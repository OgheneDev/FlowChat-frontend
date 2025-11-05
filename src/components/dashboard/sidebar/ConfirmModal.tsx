"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "danger" | "warning" | "info";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  variant = "danger",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Color variants
  const variantStyles = {
    danger: "bg-red-500 hover:bg-red-600 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-black",
    info: "bg-[#00d9ff] hover:bg-[#00b8d4] text-black",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal Container - Responsive */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 400 }}
              className="
                w-full max-w-md
                md:max-w-lg
                bg-[#111111] 
                rounded-2xl md:rounded-3xl 
                shadow-2xl 
                border border-[#2a2a2a]
                overflow-hidden
                flex flex-col
                md:max-h-[90vh]
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 md:p-6 bg-[#1a1a1a] border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full cursor-pointer hover:bg-[#2a2a2a] transition-all duration-200 group"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-[#999] group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 md:p-6 space-y-4 overflow-y-auto">
                <p className="text-sm text-[#ccc] leading-relaxed">
                  {message}
                </p>
                {variant === "danger" && (
                  <p className="text-sm text-red-400 mt-3">
                    This action is irreversible.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-5 md:p-6 bg-[#1a1a1a] border-t border-[#2a2a2a]">
                <button
                  onClick={onClose}
                  className="
                    flex-1 py-3 md:py-3.5 
                    text-sm cursor-pointer 
                    text-[#ccc] hover:text-white 
                    bg-[#1e1e1e] hover:bg-[#2a2a2a] 
                    rounded-xl 
                    transition-all duration-200
                  "
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`
                    flex-1 py-3 md:py-3.5 
                    text-sm cursor-pointer
                    rounded-xl 
                    transition-all duration-200 
                    transform active:scale-95
                    ${variantStyles[variant] || variantStyles.danger}
                  `}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;