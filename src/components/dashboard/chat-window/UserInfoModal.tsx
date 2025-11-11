import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Info } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/stores';

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const UserInfoModal = ({ isOpen, onClose, user }: UserInfoModalProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { isUserOnline } = useAuthStore();
  
  // Get the latest user data and online status
  const currentUserData = user;
  const profilePic = currentUserData?.profilePic;
  const displayName = currentUserData?.fullName || 'Unknown';
  const about = currentUserData?.about || 'No bio available';
  const email = currentUserData?.email || 'No email available';
  const online = isUserOnline(currentUserData?._id);
  const initials = displayName?.charAt(0).toUpperCase() || '?';

  useEffect(() => {
    if (isOpen) {
      setIsImageLoaded(false);
    }
  }, [isOpen]);

  if (!isOpen || !currentUserData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 top-0 max-w-md mx-auto md:mt-5 h-screen md:h-[500px] bg-[#111111] z-50 flex flex-col"
            style={{ maxHeight: '100vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-[#1e1e1e] border-b border-[#2a2a2a]">
              <button
                onClick={onClose}
                className="p-2 rounded-full cursor-pointer hover:bg-[#2a2a2a] transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-lg font-medium text-white">User Info</h2>
              <div className="w-9" /> {/* Spacer for balance */}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* User Header */}
              <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111111] px-5 pt-6 pb-8">
                <div className="flex flex-col items-center">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="relative group">
                      <div className="size-28 rounded-full overflow-hidden ring-4 ring-[#2a2a2a] relative">
                        {profilePic ? (
                          <>
                            <Image
                              src={profilePic}
                              alt={displayName}
                              width={112}
                              height={112}
                              className="size-full object-cover"
                              onLoad={() => setIsImageLoaded(true)}
                            />
                            {!isImageLoaded && (
                              <div className="absolute inset-0 bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00d9ff] border-t-transparent"></div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="size-full bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
                            <div className="text-2xl font-bold text-[#00d9ff]">
                              {initials}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Online Status Indicator */}
                    <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-[#111111] ${
                      online ? 'bg-[#00ff88]' : 'bg-[#666]'
                    }`} />
                  </div>

                  {/* User Name and Status */}
                  <div className="mt-4 w-full text-center">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {displayName}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        online ? 'bg-[#00ff88] animate-pulse' : 'bg-[#666]'
                      }`} />
                      <span className="text-[#00d9ff] font-medium">
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="px-5 py-4 space-y-4">
                {/* About Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#999]">
                    <Info className="w-4 h-4" />
                    <span>About</span>
                  </div>
                  <div className="p-3 bg-[#1e1e1e] rounded-lg">
                    <p className="text-[#ccc] text-sm leading-relaxed">
                      {about}
                    </p>
                  </div>
                </div>

                {/* Email Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#999]">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                  <div className="p-3 bg-[#1e1e1e] rounded-lg">
                    <p className="text-[#ccc] text-sm leading-relaxed break-all">
                      {email}
                    </p>
                  </div>
                </div>

                {/* Additional Info Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#999]">
                    <User className="w-4 h-4" />
                    <span>Profile Info</span>
                  </div>
                  <div className="p-3 bg-[#1e1e1e] rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#999]">Status</span>
                      <span className={`font-medium ${
                        online ? 'text-[#00ff88]' : 'text-[#666]'
                      }`}>
                        {online ? 'Active now' : 'Last seen recently'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#999]">Account</span>
                      <span className="text-[#00d9ff] font-medium">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="px-5 py-4 border-t border-[#2a2a2a]">
                <p className="text-xs text-[#666] text-center">
                  This is all the information available for this user
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserInfoModal;