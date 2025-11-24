import React, { useState } from 'react'
import { User, Camera, Settings, LogOut, SquarePen, Star } from 'lucide-react'
import Image from 'next/image'
import FullScreenImageModal from '@/components/general/FullScreenImageModal'
import { useAuthStore } from '@/stores'

interface Props {
  authUser?: any
  isUpdating?: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  getprofilePic: () => string | null | undefined
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenStarred?: () => void
  onOpenSettings: () => void
  onLogout: () => void
  onCreateGroup: () => void
}

const SidebarHeader: React.FC<Props> = ({
  isUpdating, 
  fileInputRef,
  getprofilePic,
  onImageChange,
  onOpenStarred,
  onOpenSettings,
  onLogout,
  onCreateGroup,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [isFullscreenImageOpen, setIsFullscreenImageOpen] = useState(false)
  const { authUser } = useAuthStore()

  const picture = getprofilePic()
  const displayImage = picture

  const handleAvatarClick = () => {
    if (isUpdating) return
    // If there's an image, show action menu; otherwise trigger file input directly
    if (displayImage) {
      setShowActionMenu(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleViewImage = () => {
    if (displayImage) {
      setIsFullscreenImageOpen(true)
      setShowActionMenu(false)
    }
  }

  const handleChangeImage = () => {
    fileInputRef.current?.click()
    setShowActionMenu(false)
  }

  const closeActionMenu = () => {
    setShowActionMenu(false)
  }

  return (
    <header className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
      <div className="relative group">
        <button
          onClick={handleAvatarClick}
          disabled={isUpdating}
          className="size-14 rounded-full cursor-pointer overflow-hidden ring-2 ring-transparent focus:ring-[#00d9ff] transition-all duration-200"
          aria-label="Change profile picture"
        >
          {isUpdating ? (
            <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00d9ff] border-t-transparent"></div>
            </div>
          ) : displayImage ? (
            <Image src={displayImage} width={50} height={50} alt="Profile" className="size-full object-cover" />
          ) : (
            <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
              <User className="w-8 h-8 text-[#999999]" />
            </div>
          )}
        </button>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center pointer-events-none">
          <Camera className="w-5 h-5 text-white" />
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onImageChange}
          className="hidden"
          disabled={isUpdating}
        />

        {/* Action Menu Dropdown - positioned below avatar */}
        {showActionMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={closeActionMenu}
            />
            
            {/* Dropdown menu */}
            <div className="absolute top-full left-0 mt-2 bg-[#1e1e1e] rounded-lg p-2 border border-[#2a2a2a] shadow-2xl z-50 w-48">
              <button
                onClick={handleViewImage}
                className="w-full px-4 py-2.5 text-white text-[12px] cursor-pointer hover:bg-[#2a2a2a] rounded-lg transition-colors duration-200 text-left"
              >
                View profile picture
              </button>
              
              <button
                onClick={handleChangeImage}
                className="w-full px-4 py-2.5 text-white text-[12px] cursor-pointer hover:bg-[#2a2a2a] rounded-lg transition-colors duration-200 text-left mt-1"
              >
                Change profile photo
              </button>
            </div>
          </>
        )}
      </div>

      {/* FullScreen Image Modal */}
      {isFullscreenImageOpen && displayImage && (
        <FullScreenImageModal
          closeFullscreenImage={() => setIsFullscreenImageOpen(false)}
          image={displayImage}
          type="profile"
          displayName={authUser?.fullName || 'Profile'}
        />
      )}

      <div className="flex gap-1.5">
         {[ 
          { Icon: Settings, label: "Settings", onClick: onOpenSettings },
          { Icon: LogOut, label: "Logout", onClick: onLogout },
          { Icon: SquarePen, label: "Create Group", onClick: onCreateGroup },
          { Icon: Star, label: "Starred Messages", onClick: onOpenStarred }
        ].map(({ Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            aria-label={label}
            title={label}
            className="p-2 rounded-lg cursor-pointer hover:bg-[#1e1e1e] transition-all duration-200 group"
          >
            <Icon className="w-5 h-5 text-[#999999] group-hover:text-white transition-colors" />
          </button>
        ))}
       </div>
     </header>
   )
 }

 export default SidebarHeader
