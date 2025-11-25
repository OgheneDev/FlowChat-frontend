export const LoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1a1a] animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-[#2a2a2a] rounded w-1/3"></div>
              <div className="h-3 bg-[#2a2a2a] rounded w-1/4"></div>
            </div>
            <div className="h-3 bg-[#2a2a2a] rounded w-2/3"></div>
            <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );