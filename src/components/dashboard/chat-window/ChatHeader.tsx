import { ArrowLeft, Users, Pin } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import GroupInfoModal from './GroupInfoModal';
import UserInfoModal from './UserInfoModal';
import { useAuthStore, useGroupStore, usePrivateChatStore, useContactStore } from '@/stores';

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
  const [showUserInfo, setShowUserInfo] = useState(false);
  const { isUserOnline } = useAuthStore();
  const { groups } = useGroupStore();
  const { contacts } = useContactStore();
  
  // Get the latest group data from the store for real-time updates
  const currentGroupData = type === 'group' 
    ? groups.find(g => g._id === selectedUser?._id) || selectedUser
    : selectedUser;
  
  const profilePic = currentGroupData?.profilePic || currentGroupData?.groupImage;
  const displayName = type === 'group' ? currentGroupData?.name : currentGroupData?.fullName;
  const memberCount = currentGroupData?.members?.length || 0;
  const online = type !== 'group' && isUserOnline(currentGroupData?._id);
  const initials = displayName?.charAt(0).toUpperCase() || '?';

  const handleGroupInfoClick = () => {
    if (type === 'group') {
      setShowGroupInfo(true);
    }
  };

  const handleUserInfoClick = () => {
    if (type === "user" || type === "contact") {
      setShowUserInfo(true);
    }
  };

  // Determine if the info area should be clickable
  const isInfoClickable = type === 'group' || type === 'user' || type === 'contact';
  const getInfoClickHandler = () => {
    if (type === 'group') return handleGroupInfoClick;
    if (type === 'user' || type === 'contact') return handleUserInfoClick;
    return undefined;
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

            {/* Info Area - Clickable for both group and user/contact */}
            <div 
              onClick={getInfoClickHandler()}
              className={`flex items-center gap-3 flex-1 min-w-0 ${
                isInfoClickable ? 'cursor-pointer hover:bg-[#2a2a2a] rounded-lg transition-colors p-1' : ''
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
                {type !== 'group' && online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00ff88] border-2 border-[#1e1e1e] rounded-full animate-pulse"></span>
                )}
              </div> 

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-base">{displayName || 'Unknown'}</h3>
                <p className="text-xs text-[#00d9ff] font-medium">
                  {type === 'group' ? `${memberCount} members` : online ? 'Online' : 'Offline'}
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
          group={currentGroupData}
        />
      )}

      {(type === 'user' || type === 'contact') && (
        <UserInfoModal
          isOpen={showUserInfo}
          onClose={() => setShowUserInfo(false)}
          user={currentGroupData}
        />
      )}
    </>
  );
};

export default ChatHeader;