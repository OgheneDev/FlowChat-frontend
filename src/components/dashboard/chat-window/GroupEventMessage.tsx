import React from 'react';
import { Users, UserPlus, UserMinus, Crown, LogOut, Settings } from 'lucide-react';
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
          icon: UserPlus,
          text: `${event.userName} joined the group`,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10'
        };
      case 'member_left':
        return {
          icon: LogOut,
          text: `${event.userName} left the group`,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10'
        };
      case 'member_removed':
        return {
          icon: UserMinus,
          text: `${event.targetUserName} was removed from the group`,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10'
        };
      case 'admin_promoted':
        return {
          icon: Crown,
          text: `${event.targetUserName} was promoted to admin`,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10'
        };
      case 'group_created':
        return {
          icon: Users,
          text: `${event.userName} created the group`,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10'
        };
      case 'group_updated':
        return {
          icon: Settings,
          text: 'Group info was updated',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10'
        };
      default:
        return {
          icon: Users,
          text: 'Group activity',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10'
        };
    }
  };

  const { icon: Icon, text, color, bgColor } = getEventContent();

  return (
    <div className="flex justify-center my-4 px-4">
      <div className={`flex items-center gap-2 px-4 py-2 ${bgColor} backdrop-blur-sm rounded-full border border-[#2a2a2a]/50 max-w-xs shadow-sm`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-[#e0e0e0] font-medium flex-1 text-center">{text}</span>
        <span className="text-xs text-[#666] ml-2 flex-shrink-0">
          {formatTime(event.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default GroupEventMessage;