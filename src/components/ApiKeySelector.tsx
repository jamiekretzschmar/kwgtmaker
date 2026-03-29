import React, { useEffect, useState } from 'react';

export function ApiKeySelector({ onKeySelected }: { onKeySelected: () => void }) {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      try {
        // If the key is provided via environment variables, use it
        if (process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY) {
          setHasKey(true);
          onKeySelected();
          return;
        }

        if (!(window as any).aistudio) {
          // If we are not in the AI Studio environment, assume the key is provided via .env
          setHasKey(true);
          onKeySelected();
          return;
        }
        const hasSelected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(hasSelected);
        if (hasSelected) {
          onKeySelected();
        }
      } catch (error) {
        console.error('Failed to check API key:', error);
      } finally {
        setLoading(false);
      }
    };
    checkKey();
  }, [onKeySelected]);

  const handleSelectKey = async () => {
    try {
      if (process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY) {
        setHasKey(true);
        onKeySelected();
        return;
      }

      if (!(window as any).aistudio) {
        setHasKey(true);
        onKeySelected();
        return;
      }
      await (window as any).aistudio.openSelectKey();
      // Assume success after triggering to mitigate race condition
      setHasKey(true);
      onKeySelected();
    } catch (error) {
      console.error('Failed to select API key:', error);
      if (error instanceof Error && error.message.includes('Requested entity was not found.')) {
        setHasKey(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f7f5] p-8">
        <div className="w-12 h-12 border-4 border-[#7e9c7e]/20 border-t-[#7e9c7e] rounded-full animate-spin mb-4" />
        <p className="text-[#7e9c7e] font-bold uppercase tracking-widest animate-pulse">Checking API Key...</p>
      </div>
    );
  }

  if (hasKey) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f7f5] text-[#1a201a] p-6">
      <div className="max-w-md w-full neo-card bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl text-center border-white/50">
        <div className="w-20 h-20 bg-[#7e9c7e]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <span className="text-4xl">🔑</span>
        </div>
        <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter">API Key Required</h2>
        <p className="text-[#7e9c7e] mb-10 leading-relaxed font-medium">
          To generate high-quality images for your <span className="text-[#1a201a] font-bold">kustomgen</span> widgets, you need to provide a paid Gemini API key.
          <br /><br />
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[#1a201a] font-bold underline decoration-[#7e9c7e] decoration-2 underline-offset-4 hover:text-[#7e9c7e] transition-colors">
            Learn more about billing
          </a>
        </p>
        <button
          onClick={handleSelectKey}
          className="neo-button-primary w-full py-5 text-lg"
        >
          Select API Key
        </button>
      </div>
    </div>
  );
}
