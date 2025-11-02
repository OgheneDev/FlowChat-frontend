import React from 'react';
import { X, Reply, Forward, Trash2, Copy, Star, MoreVertical } from 'lucide-react';

interface SelectionHeaderProps {
  selectedCount: number;
  isSingle: boolean;
  onCancel: () => void;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onStar: () => void;
  onMore: () => void;
}

const SelectionHeader = ({
  selectedCount,
  isSingle,
  onCancel,
  onReply,
  onForward,
  onDelete,
  onCopy,
  onStar,
  onMore,
}: SelectionHeaderProps) => {
  return (
    <header className="relative bg-[#1e1e1e]/70 backdrop-blur-2xl border-b border-[#2a2a2a]/50 z-20">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-[#2a2a2a]/20 transition-all"
            aria-label="Cancel"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h3 className="font-semibold text-white text-lg">{selectedCount} selected</h3>
        </div>

        <div className="flex items-center gap-2">
          {isSingle ? (
            <>
              <ActionButton onClick={onReply} icon={<Reply />} hover="blue" />
              <ActionButton onClick={onForward} icon={<Forward />} hover="green" />
              <ActionButton onClick={onDelete} icon={<Trash2 />} hover="red" />
              <ActionButton onClick={onCopy} icon={<Copy />} hover="blue" />
              <ActionButton onClick={onMore} icon={<MoreVertical />} hover="gray" />
            </>
          ) : (
            <>
              <ActionButton onClick={onForward} icon={<Forward />} hover="green" disabled={selectedCount === 0} />
              <ActionButton onClick={onStar} icon={<Star />} hover="yellow" disabled={selectedCount === 0} />
              <ActionButton onClick={onDelete} icon={<Trash2 />} hover="red" disabled={selectedCount === 0} />
              <ActionButton onClick={onCopy} icon={<Copy />} hover="blue" disabled={selectedCount === 0} />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const ActionButton = ({ onClick, icon, hover, disabled }: any) => {
  const colors: any = {
    blue: 'group-hover:text-blue-400',
    green: 'group-hover:text-green-400',
    red: 'group-hover:text-red-400',
    yellow: 'group-hover:text-yellow-400',
    gray: 'group-hover:text-[#999]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-3 rounded-xl hover:bg-[#2a2a2a]/20 transition-all group"
      aria-label="Action"
    >
      {React.cloneElement(icon, {
        className: `w-5 h-5 ${disabled ? 'text-gray-400' : 'text-white ' + colors[hover]}`,
      })}
    </button>
  );
};

export default SelectionHeader;