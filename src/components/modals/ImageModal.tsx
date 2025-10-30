import { X } from "lucide-react";

export const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div
    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <img
      src={src}
      alt="full size"
      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
    <button
      onClick={onClose}
      className="absolute top-6 right-6 p-3  cursor-pointer bg-white/10 rounded-full hover:bg-white/20 text-white transition-all duration-200 hover:rotate-90"
    >
      <X className="w-5 h-5 text-white" />
    </button>
  </div>
);