import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWidget, WidgetData } from '../services/firestore';
import { Layers, ArrowLeft, Search, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import { exportToKwgt } from '../utils/kwgtExport';

export function WidgetView() {
  const { id } = useParams<{ id: string }>();
  const [widget, setWidget] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWidget = async () => {
      if (!id) return;
      try {
        const data = await getWidget(id);
        if (data) {
          setWidget(data);
        } else {
          setError('Widget not found.');
        }
      } catch (err) {
        setError('Failed to load widget.');
      } finally {
        setLoading(false);
      }
    };
    fetchWidget();
  }, [id]);

  const handleExport = () => {
    if (widget) {
      exportToKwgt(widget);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !widget) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6">
        <h2 className="text-2xl font-bold mb-4">{error || 'Widget not found'}</h2>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">KustomGen</h1>
          </Link>
          <Link to="/" className="text-sm font-medium text-neutral-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Shared Widget</h2>
            <p className="text-neutral-400 text-lg italic">"{widget.prompt}"</p>
          </div>
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            Export .kwgt
          </button>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mockup */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                Mockup Preview
              </h3>
              <div className="bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-700 flex items-center justify-center p-4">
                <img
                  src={widget.mockupUrl}
                  alt="Widget Mockup"
                  className="max-w-full max-h-[600px] object-contain rounded-xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                Build Instructions
              </h3>
              <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="prose prose-invert prose-indigo max-w-none">
                  <Markdown>{widget.instructions}</Markdown>
                </div>
              </div>
            </div>
          </div>

          {/* Kodes */}
          {widget.kodes && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                Relevant Kodes & Formulas
              </h3>
              <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
                <div className="prose prose-invert prose-indigo max-w-none">
                  <Markdown>{widget.kodes}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
