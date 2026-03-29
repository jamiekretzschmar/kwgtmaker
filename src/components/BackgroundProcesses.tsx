import React from 'react';
import { useWidget } from '../context/WidgetContext';
import { Loader2 } from 'lucide-react';

export const BackgroundProcesses = () => {
  const { state } = useWidget();
  const { loading, isAuditing, isGeneratingVideo, videoLoadingMessage } = state;

  if (!loading && !isAuditing && !isGeneratingVideo) return null;

  return (
    <div className="fixed top-24 right-8 neo-card bg-white/90 backdrop-blur-xl p-6 shadow-2xl z-[100] border-white/50 animate-in slide-in-from-top-4 duration-500">
      <h3 className="text-sm font-bold text-[#1a201a] mb-4 uppercase tracking-widest flex items-center gap-2">
        <div className="w-2 h-2 bg-[#7e9c7e] rounded-full animate-pulse" />
        Background Processes
      </h3>
      <div className="space-y-3">
        {loading && <div className="text-xs font-bold text-[#7e9c7e] flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" /> Generating widget...</div>}
        {isAuditing && <div className="text-xs font-bold text-[#7e9c7e] flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" /> Auditing contrast...</div>}
        {isGeneratingVideo && <div className="text-xs font-bold text-[#7e9c7e] flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" /> {videoLoadingMessage}</div>}
      </div>
    </div>
  );
};
