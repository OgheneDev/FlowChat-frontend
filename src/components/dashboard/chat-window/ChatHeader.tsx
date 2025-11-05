// components/chat-window/ChatHeader.tsx
import { ArrowLeft, Users, Pin } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import GroupInfoModal from './GroupInfoModal';

interface ChatHeaderProps {
  selectedUser: any;
  type: 'user' | 'contact' | 'group';
  pinnedCount: number;
  showPinned: boolean;
  onTogglePinned: () => void;
  onBack: () => void;
} 

const ChatHeader = ({
  selectedUser,
  type,
  pinnedCount,
  showPinned,
  onTogglePinned,
  onBack,
}: ChatHeaderProps) => {
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  
  const profilePic = selectedUser?.profilePic || selectedUser?.groupImage;
  const displayName = type === 'group' ? selectedUser?.name : selectedUser?.fullName;
  const memberCount = selectedUser?.members?.length || 0;
  const isOnline = Boolean(selectedUser?.isOnline);
  const initials = displayName?.charAt(0).toUpperCase() || '?';

  const handleGroupInfoClick = () => {
    if (type === 'group') {
      setShowGroupInfo(true);
    }
  };

  return (
    <>
      <header className="relative bg-[#1e1e1e]/70 backdrop-blur-2xl border-b border-[#2a2a2a]/50 z-40">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-[#2a2a2a] transition-all group"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#999] group-hover:text-white" />
            </button>

            {/* Group Info Area - Better structure for image quality */}
            <div 
              onClick={handleGroupInfoClick}
              className={`flex items-center gap-3 flex-1 min-w-0 ${
                type === 'group' ? 'cursor-pointer hover:bg-[#2a2a2a] rounded-lg transition-colors p-1' : ''
              }`}
            >
              {/* Image without button wrapper */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#2a2a2a] ring-offset-2 ring-offset-[#1e1e1e]">
                  {profilePic ? (
                    <Image 
                      src={profilePic} 
                      alt={displayName} 
                      width={44}
                      height={44}
                      quality={90}
                      priority
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                      {type === 'group' ? (
                        <Users className="w-6 h-6 text-[#666]" />
                      ) : (
                        <div className="text-lg font-bold text-[#00d9ff]">{initials}</div>
                      )}
                    </div>
                  )}
                </div>
                {type !== 'group' && isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00ff88] border-2 border-[#1e1e1e] rounded-full animate-pulse"></span>
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-base">{displayName || 'Unknown'}</h3>
                <p className="text-xs text-[#00d9ff] font-medium">
                  {type === 'group' ? `${memberCount} members` : isOnline ? 'Active now' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {pinnedCount > 0 && (
          <div className="px-4 py-2 bg-gradient-to-r from-[#00d9ff]/10 to-transparent border-t border-[#00d9ff]/20">
            <button
              onClick={onTogglePinned}
              className="flex items-center gap-2 text-xs text-[#00d9ff] hover:text-white transition-colors group w-full"
            >
              <Pin className="w-3 h-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{pinnedCount} pinned</span>
              <span className="ml-auto text-[#999] group-hover:text-white">
                {showPinned ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>
        )}
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a]/30 to-transparent" />
      </header>

      {type === 'group' && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          group={selectedUser}
        />
      )}
    </>
  );
};

export default ChatHeader;