import React from 'react';

export function DeviceChassis({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[850px] p-4">
      {/* Smartphone Frame */}
      <div className="relative w-[360px] h-[800px] bg-neutral-900 rounded-[3rem] border-8 border-neutral-800 shadow-[0_0_0_2px_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Notch/Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-neutral-800 rounded-b-2xl z-50 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neutral-700" />
          <div className="w-8 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Screen Content */}
        <div className="w-full h-full overflow-y-auto scrollbar-hide bg-neutral-950">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-neutral-800 rounded-full z-50" />
      </div>
    </div>
  );
}
