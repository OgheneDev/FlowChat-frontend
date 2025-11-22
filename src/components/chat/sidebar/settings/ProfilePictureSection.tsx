import React, { useState } from 'react'
import Image from 'next/image'
import { Camera, User } from 'lucide-react'
import FullScreenImageModal from '@/components/general/FullScreenImageModal'

interface Props {
  authUser?: any
  selectedImg: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isUpdating?: boolean
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  getProfilePic: () => string | null | undefined
}

const ProfilePictureSection: React.FC<Props> = ({ 
  authUser, 
  selectedImg, 
  fileInputRef, 
  isUpdating, 
  handleImageUpload, 
  getProfilePic 
}) => {
  const [isFullscreenImageOpen, setIsFullscreenImageOpen] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)

  const picture = getProfilePic()
  const displayImage = selectedImg || picture

  const closeFullscreenImage = () => {
    setIsFullscreenImageOpen(false)
  }

  const handleImageClick = () => {
    if (isUpdating) return

    if (displayImage) {
      // If there's an image, show action menu for options
      setShowActionMenu(true)
    } else {
      // No image - directly trigger upload
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

  const handleCloseActionMenu = () => {
    setShowActionMenu(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <button
          onClick={handleImageClick}
          disabled={isUpdating}
          className="size-28 rounded-full cursor-pointer overflow-hidden ring-4 ring-[#2a2a2a] hover:ring-[#00d9ff]/50 transition-all duration-300 focus:outline-none focus:ring-[#00d9ff] relative disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={displayImage ? "Change or view profile picture" : "Change profile picture"}
        >
          {isUpdating ? (
            <div className="size-full bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00d9ff] border-t-transparent"></div>
            </div>
          ) : displayImage ? (
            <>
              <Image 
                src={displayImage} 
                alt={authUser?.fullName || 'Profile'} 
                width={150} 
                height={150} 
                className="size-full object-cover" 
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium">Options</span>
                </div>
              </div>
            </>
          ) : (
            <div className="size-full bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
              <User className="w-14 h-14 text-[#666666]" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium">Upload</span>
                </div>
              </div>
            </div>
          )}
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
          disabled={isUpdating}
        />
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-1">{authUser?.fullName || 'Anonymous User'}</h3>
        <p className="text-sm text-[#999999]">Manage your account settings</p>
      </div>

      {/* Action Menu Modal */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={handleCloseActionMenu}
        >
          <div 
            className="bg-[#1e1e1e] rounded-lg p-4 mx-4 max-w-xs w-full border border-[#2a2a2a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <button
                onClick={handleViewImage}
                className="w-full p-3 text-white cursor-pointer text-sm hover:bg-[#2a2a2a] rounded-lg transition-colors duration-200 text-center flex items-center justify-center gap-2"
              >
                View profile picture
              </button>
              
              <button
                onClick={handleChangeImage}
                className="w-full p-3 text-white text-sm cursor-pointer hover:bg-[#2a2a2a] rounded-lg transition-colors duration-200 text-center flex items-center justify-center gap-2"
              >
                Change profile photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FullScreen Image Modal */}
      {isFullscreenImageOpen && displayImage && (
        <FullScreenImageModal
          closeFullscreenImage={closeFullscreenImage}
          image={displayImage}
          type="profile"
          displayName={authUser?.fullName || 'User'}
        />
      )}
    </div>
  )
}

export default ProfilePictureSection