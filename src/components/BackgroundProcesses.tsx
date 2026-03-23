import React from 'react';
import { useWidget } from '../context/WidgetContext';
import { Loader2 } from 'lucide-react';

export const BackgroundProcesses = () => {
  const { state } = useWidget();
  const { loading, isAuditing, isGeneratingVideo, videoLoadingMessage } = state;

  if (!loading && !isAuditing && !isGeneratingVideo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-neutral-900 border border-neutral-700 p-4 rounded-xl shadow-lg z-50">
      <h3 className="text-sm font-semibold text-white mb-2">Background Processes</h3>
      <div className="space-y-2">
        {loading && <div className="text-xs text-indigo-400 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Generating widget...</div>}
        {isAuditing && <div className="text-xs text-indigo-400 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Auditing contrast...</div>}
        {isGeneratingVideo && <div className="text-xs text-indigo-400 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> {videoLoadingMessage}</div>}
      </div>
    </div>
  );
};
