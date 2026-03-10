import React, { useEffect, useState } from 'react';

export function ApiKeySelector({ onKeySelected }: { onKeySelected: () => void }) {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      try {
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
    return <div className="flex items-center justify-center p-8">Checking API Key...</div>;
  }

  if (hasKey) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-md w-full bg-neutral-800 rounded-2xl p-8 shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
        <p className="text-neutral-300 mb-6">
          To generate high-quality images for your KWGT widgets, you need to provide a paid Gemini API key.
          <br /><br />
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
            Learn more about billing
          </a>
        </p>
        <button
          onClick={handleSelectKey}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors w-full"
        >
          Select API Key
        </button>
      </div>
    </div>
  );
}
