import { PinnedMessagePreview } from './PinnedMessagePreview';

interface PinnedMessagesPanelProps {
  isVisible: boolean;
  messageIds: string[];
  type: 'user' | 'contact' | 'group';
  selectedUser: any;
  onClose: () => void;
}

const PinnedMessagesPanel = ({
  isVisible,
  messageIds,
  type,
  selectedUser,
  onClose,
}: PinnedMessagesPanelProps) => {
  if (!isVisible || messageIds.length === 0) return null;

  return (
    <div className="bg-[#1a1a1a]/50 border-b border-[#00d9ff]">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-white">
            Pinned Messages
          </h4>
          <button onClick={onClose} className="text-xs cursor-pointer text-[#999] hover:text-white">
            Close
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {messageIds.map((id) => (
            <PinnedMessagePreview key={id} messageId={id} type={type} selectedUser={selectedUser} />
          ))}
          {messageIds.length > 3 && (
            <div className="text-xs text-[#999] text-center pt-2">+{messageIds.length - 3} more</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinnedMessagesPanel;