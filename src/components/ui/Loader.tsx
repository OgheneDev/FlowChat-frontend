import React from 'react'

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black via-[#0a0a0a] to-black overflow-hidden">
        <div className="relative flex flex-col items-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
          {/* Logo with Neon Glow + Pulse + Spin */}
          <div className="relative">
            {/* Outer Glow Ring */}
            <div className="absolute -inset-4 bg-[#00d9ff] rounded-full blur-3xl opacity-40 animate-pulse"></div>
            
            {/* Inner Glow */}
            <div className="absolute -inset-2 bg-[#00d9ff] rounded-full blur-xl opacity-60 animate-ping"></div>

            {/* Logo Container */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-[#00d9ff]/10 to-[#0099cc]/10 p-3 backdrop-blur-xl border border-[#00d9ff]/20 shadow-2xl animate-spin-slow">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#00d9ff] to-[#00b8d4] flex items-center justify-center shadow-inner">
                {/* FlowChat Speech Bubble Icon */}
                <svg
                  className="w-12 h-12 md:w-14 md:h-14 text-black drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Brand Name with Flowing Glow */}
          <div className="flex items-center gap-1 overflow-hidden">
            {["F", "l", "o", "w", "C", "h", "a", "t"].map((letter, i) => (
              <span
                key={i}
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#00d9ff] via-[#00b8d4] to-[#0099cc] bg-clip-text text-transparent animate-wave"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Subtle Loading Dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#00d9ff]"
                style={{
                  animation: `bounce 1.4s infinite ease-in-out both`,
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Add CSS Animations */}
        <style jsx>{`
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes wave {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.7;
            }
            50% {
              transform: translateY(-8px);
              opacity: 1;
            }
          }

          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }

          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }

          .animate-wave > span {
            display: inline-block;
            animation: wave 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
  )
}

export default Loader
