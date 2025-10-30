export const SkeletonLoader = () => (
  <div className="flex items-center gap-3 p-4 animate-pulse">
    <div className="w-12 h-12 bg-[#2a2a2a] rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-[#2a2a2a] rounded w-3/4"></div>
      <div className="h-3 bg-[#1e1e1e] rounded w-1/2"></div>
    </div>
    <div className="w-10 h-6 bg-[#1e1e1e] rounded"></div>
  </div>
);