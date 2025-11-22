import { User, MessageCircle } from "lucide-react";

export const EmptyChatState = ({ type }: { type: 'group' | 'user' | 'contact' }) => (
  <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#1e1e1e]">
    <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mx-auto w-28 h-28">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a]/20 to-[#00b8d4]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative size-full rounded-full bg-[#2a2a2a] flex items-center justify-center">
          {type === 'group' ? (
            <User className="w-14 h-14 text-[#666]" />
          ) : (
            <MessageCircle className="w-14 h-14 text-[#666]" />
          )}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">No conversation selected</h3>
        <p className="text-sm text-[#999] mt-1">Pick a chat from the sidebar to start messaging</p>
      </div>
    </div>
  </div>
);