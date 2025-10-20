export const SkeletonLoader = () => (
  <div className="flex items-center gap-3 p-4 border-b border-[#2a2a2a] animate-pulse">
    <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex-shrink-0" />
    <div className="flex flex-col flex-1 gap-2">
      <div className="h-4 bg-[#2a2a2a] rounded w-32" />
      <div className="h-3 bg-[#2a2a2a] rounded w-48" />
    </div>
  </div>
)