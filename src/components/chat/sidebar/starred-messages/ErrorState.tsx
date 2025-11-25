import React from "react";
import { AlertCircle } from "lucide-react";
import { useStarringStore } from "@/stores";

interface ErrorStateProps {
    modalError: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({modalError}) => {
  // ✅ Move the hook call INSIDE the component
  const { loadStarredMessagesForModal } = useStarringStore();
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
      <h4 className="text-white font-medium mb-2">Failed to load starred messages</h4>
      <p className="text-[#999] text-sm mb-4">{modalError}</p>
      <button
        onClick={loadStarredMessagesForModal}
        className="px-4 py-2 bg-[#00d9ff] text-black rounded-lg hover:bg-[#00c4e6] transition-colors"
      >
        Try Again
      </button>
    </div>
  );
};