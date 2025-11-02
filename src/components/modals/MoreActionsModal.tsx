"use client"
import React, { useEffect, useRef } from "react";

export const MoreActionsModal = ({
  isOpen,
  onClose,
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={modalRef}
        className="absolute right-4 top-20 w-48 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] shadow-lg py-1"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              if (!action.disabled) {
                action.onClick();
                onClose();
              }
            }}
            disabled={action.disabled}
            className={`
              w-full text-left px-4 py-2 text-sm
              ${action.disabled 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-white hover:bg-[#3a3a3a]'
              }
              ${i !== actions.length - 1 ? 'border-b border-[#3a3a3a]' : ''}
            `}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};