import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getWidget, WidgetData } from '../services/firestore';
import { Layers, ArrowLeft, Search, Download, ImageIcon, FileText, Code, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { exportToKwgt } from '../utils/kwgtExport';

export function WidgetView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [widget, setWidget] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'instructions' | 'code'>('preview');

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

  const handleRemix = () => {
    if (widget) {
      navigate('/featuator', { state: { remixWidget: widget } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7e9c7e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !widget) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] flex flex-col items-center justify-center text-[#1a201a] p-6">
        <div className="neo-card p-10 flex flex-col items-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-bold mb-4 text-center">{error || 'Widget not found'}</h2>
          <Link to="/" className="neo-button px-6 py-2 flex items-center gap-2 font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#1a201a] font-sans selection:bg-[#7e9c7e]/20">
      <header className="border-b border-white/50 bg-white/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-[#7e9c7e] rounded-xl flex items-center justify-center shadow-lg shadow-[#7e9c7e]/20">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a201a] tracking-tight">kustomgen</h1>
          </Link>
          <Link to="/" className="neo-button px-4 py-2 text-sm font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[#7e9c7e] font-bold text-xs uppercase tracking-widest mb-2">
              <Sparkles className="w-4 h-4" /> Shared Widget
            </div>
            <h2 className="text-4xl font-bold text-[#1a201a] leading-tight italic">"{widget.prompt}"</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <button
              onClick={handleRemix}
              className="px-8 py-4 neo-button flex items-center justify-center gap-3 whitespace-nowrap h-[60px]"
            >
              <RefreshCw className="w-6 h-6" />
              <span className="font-bold text-lg">Remix</span>
            </button>
            <button
              onClick={handleExport}
              className="px-10 py-4 neo-button-primary flex items-center justify-center gap-3 whitespace-nowrap h-[60px]"
            >
              <Download className="w-6 h-6" />
              <span className="font-bold text-lg">Export .kwgt</span>
            </button>
          </div>
        </div>

        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex border-b border-[#7e9c7e]/10 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-8 py-4 text-sm font-bold border-b-4 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'preview' ? 'border-[#7e9c7e] text-[#1a201a]' : 'border-transparent text-[#7e9c7e] hover:text-[#1a201a]'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`px-8 py-4 text-sm font-bold border-b-4 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'instructions' ? 'border-[#7e9c7e] text-[#1a201a]' : 'border-transparent text-[#7e9c7e] hover:text-[#1a201a]'
              }`}
            >
              <FileText className="w-4 h-4" /> Instructions
            </button>
            {widget.presetJson && (
              <button
                onClick={() => setActiveTab('code')}
                className={`px-8 py-4 text-sm font-bold border-b-4 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'code' ? 'border-[#7e9c7e] text-[#1a201a]' : 'border-transparent text-[#7e9c7e] hover:text-[#1a201a]'
                }`}
              >
                <Code className="w-4 h-4" /> Preset JSON
              </button>
            )}
          </div>

          <div className="pt-4">
            {activeTab === 'preview' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="neo-card overflow-hidden flex flex-col items-center justify-center p-8 bg-white/30 backdrop-blur-sm">
                  <img
                    src={widget.mockupUrl}
                    alt="Widget Mockup"
                    className="max-w-full max-h-[700px] object-contain rounded-2xl shadow-2xl border-4 border-white/80"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="neo-card p-10 bg-white/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="prose prose-emerald max-w-none prose-headings:text-[#1a201a] prose-p:text-[#1a201a]/80 prose-strong:text-[#1a201a] markdown-body">
                  <Markdown>{widget.instructions}</Markdown>
                </div>
              </div>
            )}

            {activeTab === 'code' && widget.presetJson && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="neo-card p-8 bg-white/30 backdrop-blur-sm overflow-x-auto shadow-inner">
                  <pre className="text-sm text-emerald-800 font-mono whitespace-pre-wrap leading-relaxed">
                    <code>{JSON.stringify(widget.presetJson, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
