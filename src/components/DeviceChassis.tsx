import React from 'react';

export function DeviceChassis({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[850px] p-6">
      {/* Smartphone Frame */}
      <div className="relative w-[380px] h-[820px] bg-[#f5f7f5] rounded-[4rem] border-[12px] border-white shadow-[20px_20px_60px_#d1d9d1,-20px_-20px_60px_#ffffff] overflow-hidden">
        {/* Notch/Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-white/80 backdrop-blur-md rounded-b-3xl z-50 flex items-center justify-center gap-3 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7e9c7e]/20" />
          <div className="w-10 h-1.5 rounded-full bg-[#7e9c7e]/20" />
        </div>

        {/* Screen Content */}
        <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#f5f7f5] relative">
          {/* Subtle screen reflection */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-white/20 z-40" />
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-36 h-2 bg-[#7e9c7e]/10 rounded-full z-50" />
      </div>
    </div>
  );
}
