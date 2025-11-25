import { Star } from "lucide-react";

export const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Star className="w-16 h-16 text-[#00d9ff] fill-[#00d9ff] mb-4 opacity-50" />
      <h4 className="text-white font-medium mb-2">No Starred Messages</h4>
      <p className="text-[#999] text-sm">
        Messages you star will appear here for easy access.
      </p>
    </div>
);