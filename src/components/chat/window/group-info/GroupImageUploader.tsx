import React, { useState } from 'react'
import { Users, Image as ImageIcon, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import FullScreenImageModal from '@/components/general/FullScreenImageModal'

interface Props {
  imagePreview: string | null
  isAdmin: boolean
  isUploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  groupName?: string
}

const GroupImageUploader: React.FC<Props> = ({ 
  imagePreview, 
  isAdmin, 
  isUploading, 
  fileInputRef, 
  onUpload, 
  groupName 
}) => {
  const [isFullscreenImageOpen, setIsFullscreenImageOpen] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)

  const closeFullscreenImage = () => {
    setIsFullscreenImageOpen(false)
  }

  const handleImageClick = () => {
    if (isUploading) return

    if (!isAdmin) {
      // Regular members - directly open fullscreen view
      if (imagePreview) {
        setIsFullscreenImageOpen(true)
      }
      return
    }

    // Admins - show action menu
    if (imagePreview) {
      setShowActionMenu(true)
    } else {
      // No image - directly trigger upload
      fileInputRef.current?.click()
    }
  }

  const handleViewImage = () => {
    if (imagePreview) {
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
    <>
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111111] px-5 pt-6 pb-8">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="relative group">
              <button
                onClick={handleImageClick}
                disabled={isUploading}
                className={`size-28 rounded-full overflow-hidden ring-4 ring-[#2a2a2a] transition-all duration-300 focus:outline-none focus:ring-[#00d9ff] relative disabled:cursor-not-allowed disabled:opacity-50 ${
                  imagePreview && !isUploading ? 'cursor-pointer hover:ring-[#00d9ff]/50' : ''
                }`}
                aria-label={isAdmin ? "Change or view group image" : "View group image"}
              >
                {isUploading ? (
                  <div className="size-full bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00d9ff] border-t-transparent"></div>
                  </div>
                ) : imagePreview ? (
                  <>
                    <Image 
                      src={imagePreview} 
                      alt={groupName || 'Group'} 
                      width={112} 
                      height={112} 
                      className="size-full object-cover" 
                    />
                    
                    {/* Hover overlay for both admin and members */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                      {isAdmin ? (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-white" />
                          <span className="text-xs text-white font-medium">Options</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ZoomIn className="w-6 h-6 text-white" />
                          <span className="text-xs text-white font-medium">View</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="size-full bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
                    <Users className="w-14 h-14 text-[#666666]" />
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-white" />
                          <span className="text-xs text-white font-medium">Upload</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>

              {isAdmin && (
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              )}
            </div>
          </div>

          <div className="mt-4 w-full text-center">
            <h3 className="text-xl font-semibold text-white text-center">{groupName}</h3>
          </div>
        </div>
      </div>

      {/* Simplified Action Menu Modal for Admins */}
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
                className="w-full p-3 text-white cursor-pointer text-sm hover:bg-[#2a2a2a] rounded-lg transition-colors duration-200 text-center"
              >
                View group image
              </button>
              
              <button
                onClick={handleChangeImage}
                className="w-full p-3 text-white text-sm cursor-pointer hover:bg-[#2a2a2a] rounded-lg transition-colors duration-200 text-center"
              >
                Change group photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FullScreen Image Modal */}
      {isFullscreenImageOpen && imagePreview && (
        <FullScreenImageModal
          closeFullscreenImage={closeFullscreenImage}
          image={imagePreview}
          type="group"
          displayName={groupName || 'Group'}
        />
      )}
    </>
  )
}

export default GroupImageUploader