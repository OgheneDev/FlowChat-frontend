import React, { useEffect, useCallback, useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import Image from 'next/image'

interface FullScreenImageModalProps {
  closeFullscreenImage: () => void
  image: string
  type: string
  displayName: string 
}

const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({
  closeFullscreenImage,
  image,
  type,
  displayName,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showControls, setShowControls] = useState(true)

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFullscreenImage()
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 3))
      if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.5))
      if (e.key === 'r') setRotation((r) => (r + 90) % 360)
    },
    [closeFullscreenImage]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [handleKeyDown])

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const resetTimeout = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }
    resetTimeout()
    window.addEventListener('mousemove', resetTimeout)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', resetTimeout)
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeFullscreenImage()
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Use your filename formatting logic
      const timestamp = Date.now();
      const date = new Date();

      // Format pieces
      const YYYY = date.getFullYear();
      const MM = String(date.getMonth() + 1).padStart(2, "0");
      const DD = String(date.getDate()).padStart(2, "0");
      const HH = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");

      // Generate random 8-character string
      const randomId = Math.random().toString(36).slice(2, 10);
      
      const filename = `FlowChat Image ${YYYY}-${MM}-${DD} at ${HH}.${mm}.${ss}_${randomId}.jpg`;

      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Optional: Show toast notification
      // showToast('Image downloaded!', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(image, "_blank");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fullscreen image of ${displayName}`}
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Top controls */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Display name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{displayName}</p>
            <p className="text-white/60 text-sm capitalize">{type} photo</p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={closeFullscreenImage}
          className="p-2 rounded-full bg-white/10 cursor-pointer hover:bg-white/20 text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-16">
        <div
          className={`transition-all duration-300 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <Image
            src={image}
            alt={`Fullscreen ${type === 'group' ? 'group' : 'profile'} image of ${displayName}`}
            width={800}
            height={800}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
            onClick={() => (zoom > 1 ? setZoom(1) : setZoom(1.5))}
            onLoad={() => setIsLoaded(true)}
            priority
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 flex justify-center z-20 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-2">
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-2 rounded-full cursor-pointer hover:bg-white/20 text-white transition-all disabled:opacity-50"
            disabled={zoom <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <span className="text-white text-sm w-16 text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-2 rounded-full cursor-pointer hover:bg-white/20 text-white transition-all disabled:opacity-50"
            disabled={zoom >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 rounded-full cursor-pointer hover:bg-white/20 text-white transition-all"
            aria-label="Rotate image"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-full cursor-pointer hover:bg-white/20 text-white transition-all"
            aria-label="Download image"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div
        className={`absolute hidden md:block bottom-20 left-1/2 -translate-x-1/2 text-white/40 text-xs transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> to close •{' '}
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded">+/-</kbd> zoom •{' '}
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded">R</kbd> rotate
      </div>
    </div>
  )
}

export default FullScreenImageModal