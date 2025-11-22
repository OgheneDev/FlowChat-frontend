import { useEffect, useCallback, useState, useRef } from "react";
import { X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from "lucide-react";
import Image from "next/image";

interface ImageModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageModal = ({ src, alt = "Image preview", onClose }: ImageModalProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFitted, setIsFitted] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(z + 0.5, 5));
          setIsFitted(false);
          break;
        case "-":
          setZoom((z) => {
            const newZoom = Math.max(z - 0.5, 0.5);
            if (newZoom <= 1) setPosition({ x: 0, y: 0 });
            return newZoom;
          });
          break;
        case "0":
          setZoom(1);
          setPosition({ x: 0, y: 0 });
          setIsFitted(true);
          break;
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((z) => {
      const newZoom = Math.min(Math.max(z + delta, 0.5), 5);
      if (newZoom <= 1) setPosition({ x: 0, y: 0 });
      setIsFitted(false);
      return newZoom;
    });
  }, []);

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsFitted(true);
    } else {
      setZoom(2);
      setIsFitted(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
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
      window.open(src, "_blank");
    }
  };

  const toggleFit = () => {
    if (isFitted) {
      setZoom(2);
      setIsFitted(false);
    } else {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsFitted(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[200] h-full flex flex-col bg-black/98 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white/80 text-sm font-medium truncate max-w-[200px] sm:max-w-md">
            {alt}
          </span>
          {zoom !== 1 && (
            <span className="text-white/50 text-xs bg-white/10 px-2 py-0.5 rounded-full">
              {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleFit}
            className="p-2.5 rounded-full bg-white/5 cursor-pointer hover:bg-white/15 text-white/80 hover:text-white transition-all"
            aria-label={isFitted ? "Zoom to fill" : "Fit to screen"}
            title={isFitted ? "Zoom to fill" : "Fit to screen"}
          >
            {isFitted ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-full bg-white/5 cursor-pointer hover:bg-white/15 text-white/80 hover:text-white transition-all"
            aria-label="Download image"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 cursor-pointer hover:bg-white/15 text-white/80 hover:text-white transition-all ml-2 hover:rotate-90 duration-200"
            aria-label="Close"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => e.target === containerRef.current && onClose()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
            </div>
          </div>
        )}

        {/* Image */}
        <div
          className={`transition-all duration-200 ease-out select-none ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${isDragging ? "transition-none" : ""}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }}
          onDoubleClick={handleDoubleClick}
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1200}
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            onLoad={() => setIsLoaded(true)}
            draggable={false}
            priority
          />
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="p-4 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1.5">
          <button
            onClick={() => {
              setZoom((z) => Math.max(z - 0.5, 0.5));
              if (zoom <= 1.5) setPosition({ x: 0, y: 0 });
            }}
            disabled={zoom <= 0.5}
            className="p-2 rounded-full cursor-pointer hover:bg-white/10 text-white/80 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Zoom out"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
              setIsFitted(true);
            }}
            className="px-3 py-1 text-sm cursor-pointer text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all min-w-[60px]"
            title="Reset zoom (0)"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => {
              setZoom((z) => Math.min(z + 0.5, 5));
              setIsFitted(false);
            }}
            disabled={zoom >= 5}
            className="p-2 rounded-full cursor-pointer hover:bg-white/10 text-white/80 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ImageModal;