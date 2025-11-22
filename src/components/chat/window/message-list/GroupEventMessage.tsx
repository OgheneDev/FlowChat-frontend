import React from 'react';
import { formatTime } from '@/utils/utils';

interface GroupEventMessageProps {
  event: {
    _id: string;
    type: 'member_joined' | 'member_left' | 'member_removed' | 'admin_promoted' | 'group_created' | 'group_updated';
    userId?: string;
    userName?: string;
    targetUserId?: string;
    targetUserName?: string;
    createdAt: string;
    groupId: string;
    additionalData?: any;
  };
}

const GroupEventMessage: React.FC<GroupEventMessageProps> = ({ event }) => {
  const getEventContent = () => {
    switch (event.type) {
      case 'member_joined':
        return {
          text: `${event.userName} joined the group`,
        };
      case 'member_left':
        return {
          text: `${event.userName} left the group`,
        };
      case 'member_removed':
        return {
          text: `${event.targetUserName} was removed from the group`,
        };
      case 'admin_promoted':
        return {
          text: `${event.targetUserName} was promoted to admin`,
        };
      case 'group_created':
        return {
          text: `${event.userName} created the group`,
        };
      case 'group_updated':
        return {
          text: 'Group info was updated',
        };
      default:
        return {          
          text: 'Group activity',
        };
    }
  };

  const { text } = getEventContent();

  return (
    <div className="flex justify-center my-4 px-4">
      <div className={`flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] backdrop-blur-sm rounded-full border border-[#2a2a2a]/50 max-w-xs shadow-sm`}>
        <span className="text-[10px] text-[#e0e0e0] font-medium flex-1 text-center">{text}</span>
        <span className="text-[10px] text-[#666] ml-2 flex-shrink-0">
          {formatTime(event.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default GroupEventMessage;