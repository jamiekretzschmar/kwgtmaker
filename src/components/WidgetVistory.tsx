import React, { useEffect, useState } from 'react';
import { loadWidgets, deleteWidget, WidgetData } from '../services/firestore';
import { auth } from '../firebase';
import { Trash2, Clock, Calendar, Share2, Check, X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { exportToKwgt } from '../utils/kwgtExport';
import { ExportFile } from '../types';

const aspectRatioMap: Record<string, string> = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '2:3': 'aspect-[2/3]',
  '3:2': 'aspect-[3/2]',
  '21:9': 'aspect-[21/9]',
};

export function WidgetVistory({ refreshTrigger, user }: { refreshTrigger: number, user: any }) {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WidgetData | null>(null);
  const [exportFonts, setExportFonts] = useState<ExportFile[]>([]);
  const [exportIcons, setExportIcons] = useState<ExportFile[]>([]);
  const [exportBitmaps, setExportBitmaps] = useState<ExportFile[]>([]);
  const [fileErrors, setFileErrors] = useState<{fonts?: string, icons?: string, bitmaps?: string}>({});
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportTitle, setExportTitle] = useState('');
  const [exportVersion, setExportVersion] = useState<number | ''>(11);
  const [exportRelease, setExportRelease] = useState<number | ''>(351031415);
  const [exportPflags, setExportPflags] = useState<number | ''>(0);

  useEffect(() => {
    const fetchWidgets = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await loadWidgets(user.uid);
        // Sort by createdAt descending
        data.sort((a, b) => {
          const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any)?.toMillis?.() || 0;
          const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any)?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setWidgets(data);
      } catch (error) {
        console.error('Failed to load widgets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWidgets();
  }, [refreshTrigger, user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    try {
      await deleteWidget(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  };

  const handleShare = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/widget/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const openExportModal = (widget: WidgetData, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedWidget(widget);
    setExportFonts([]);
    setExportIcons([]);
    setExportBitmaps([]);
    setFileErrors({});
    
    // Reset advanced options
    setExportTitle(widget.prompt.split(' ').slice(0, 3).join(' ') || 'kwgtmaker Widget');
    setExportVersion(11);
    setExportRelease(351031415);
    setExportPflags(0);
    setShowAdvanced(false);
    
    setExportModalOpen(true);
  };

  const handleExportConfirm = () => {
    if (selectedWidget) {
      exportToKwgt(selectedWidget, {
        fonts: exportFonts,
        icons: exportIcons,
        bitmaps: exportBitmaps,
        title: exportTitle || undefined,
        version: exportVersion === '' ? undefined : Number(exportVersion),
        release: exportRelease === '' ? undefined : Number(exportRelease),
        pflags: exportPflags === '' ? undefined : Number(exportPflags),
      });
      setExportModalOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'fonts'|'icons'|'bitmaps', setter: React.Dispatch<React.SetStateAction<ExportFile[]>>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      let valid = true;
      let errorMsg = '';
      
      if (type === 'fonts') {
        valid = files.every(f => f.name.toLowerCase().endsWith('.ttf') || f.name.toLowerCase().endsWith('.otf'));
        if (!valid) errorMsg = 'Only .ttf and .otf files are allowed for fonts.';
      } else if (type === 'icons') {
        valid = files.every(f => f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.svg'));
        if (!valid) errorMsg = 'Only .png and .svg files are allowed for icons.';
      } else if (type === 'bitmaps') {
        valid = files.every(f => f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg'));
        if (!valid) errorMsg = 'Only .png, .jpg, and .jpeg files are allowed for bitmaps.';
      }

      if (valid) {
        setter(files.map(file => ({ file, name: file.name })));
        setFileErrors(prev => ({ ...prev, [type]: undefined }));
      } else {
        setFileErrors(prev => ({ ...prev, [type]: errorMsg }));
        e.target.value = ''; // Reset input
      }
    }
  };

  const handleFileNameChange = (index: number, newName: string, setter: React.Dispatch<React.SetStateAction<ExportFile[]>>) => {
    setter(prev => {
      const newFiles = [...prev];
      newFiles[index].name = newName;
      return newFiles;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-10 h-10 border-4 border-[#7e9c7e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="text-center p-12 text-[#7e9c7e] neo-card bg-white/30 backdrop-blur-sm">
        <p className="font-bold">No widgets generated yet. Start creating!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {widgets.map((widget) => (
          <Link
            to={`/widget/${widget.id}`}
            key={widget.id}
            className="neo-card overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 group relative flex flex-col bg-white/30 backdrop-blur-sm border-white/50"
          >
            <div className={`${aspectRatioMap[widget.aspectRatio] || 'aspect-square'} bg-[#7e9c7e]/5 flex items-center justify-center p-6 relative overflow-hidden`}>
              <img
                src={widget.mockupUrl}
                alt={widget.prompt}
                className="absolute inset-0 w-full h-full object-contain p-6 drop-shadow-2xl z-10 transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white/90 via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 z-20 translate-y-4 group-hover:translate-y-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/generator', { state: { editWidget: widget } });
                  }}
                  className="p-2.5 bg-white/90 text-[#7e9c7e] rounded-xl shadow-lg hover:bg-[#7e9c7e] hover:text-white transition-all backdrop-blur-md border border-white/50"
                  title="Edit Widget"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/generator', { state: { remixWidget: widget } });
                  }}
                  className="p-2.5 bg-white/90 text-[#7e9c7e] rounded-xl shadow-lg hover:bg-[#7e9c7e] hover:text-white transition-all backdrop-blur-md border border-white/50"
                  title="Remix Widget"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleShare(widget.id!, e)}
                  className="p-2.5 bg-white/90 text-[#7e9c7e] rounded-xl shadow-lg hover:bg-[#7e9c7e] hover:text-white transition-all backdrop-blur-md border border-white/50"
                  title="Share Widget"
                >
                  {copiedId === widget.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const content = `# Widget: ${widget.prompt}\n\n## Instructions\n${widget.instructions}\n\n## Preset JSON\n${JSON.stringify(widget.presetJson, null, 2)}`;
                    const blob = new Blob([content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `widget-docs-${widget.id}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2.5 bg-white/90 text-[#7e9c7e] rounded-xl shadow-lg hover:bg-[#7e9c7e] hover:text-white transition-all backdrop-blur-md border border-white/50"
                  title="Export Docs"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => openExportModal(widget, e)}
                  className="p-2.5 bg-white/90 text-[#7e9c7e] rounded-xl shadow-lg hover:bg-[#7e9c7e] hover:text-white transition-all backdrop-blur-md border border-white/50"
                  title="Export .kwgt"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDelete(widget.id!, e)}
                  className="p-2.5 bg-white/90 text-red-500 rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-all backdrop-blur-md border border-white/50"
                  title="Delete Widget"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <p className="text-[#1a201a] text-base line-clamp-2 mb-4 font-bold italic leading-relaxed flex-1" title={widget.prompt}>
                "{widget.prompt}"
              </p>
              <div className="flex items-center justify-between text-xs text-[#7e9c7e] mt-auto font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {widget.createdAt?.toDate ? format(widget.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {widget.aspectRatio}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {exportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a201a]/40 backdrop-blur-md p-4">
          <div className="neo-card p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white/90">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-bold text-[#1a201a]">Export Widget</h3>
               <button onClick={() => setExportModalOpen(false)} className="neo-button p-2 text-[#7e9c7e] hover:text-red-500">
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-[#1a201a] mb-3 uppercase tracking-widest">Custom Fonts (.ttf, .otf)</label>
                <input type="file" multiple accept=".ttf,.otf" onChange={e => handleFileChange(e, 'fonts', setExportFonts)} className="neo-input w-full text-sm text-[#7e9c7e] file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#7e9c7e] file:text-white hover:file:bg-[#1a201a] transition-all cursor-pointer" />
                {fileErrors.fonts && <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3" />{fileErrors.fonts}</p>}
                {exportFonts.length > 0 && <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" />{exportFonts.length} file(s) selected</p>}
                {exportFonts.map((f, i) => (
                  <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setExportFonts)} className="mt-3 neo-input w-full p-3 text-sm font-medium" placeholder="Filename in zip" />
                ))}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1a201a] mb-3 uppercase tracking-widest">Custom Icons (.png, .svg)</label>
                <input type="file" multiple accept=".png,.svg" onChange={e => handleFileChange(e, 'icons', setExportIcons)} className="neo-input w-full text-sm text-[#7e9c7e] file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#7e9c7e] file:text-white hover:file:bg-[#1a201a] transition-all cursor-pointer" />
                {fileErrors.icons && <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3" />{fileErrors.icons}</p>}
                {exportIcons.length > 0 && <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" />{exportIcons.length} file(s) selected</p>}
                {exportIcons.map((f, i) => (
                  <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setExportIcons)} className="mt-3 neo-input w-full p-3 text-sm font-medium" placeholder="Filename in zip" />
                ))}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1a201a] mb-3 uppercase tracking-widest">Custom Bitmaps (.png, .jpg)</label>
                <input type="file" multiple accept=".png,.jpg,.jpeg" onChange={e => handleFileChange(e, 'bitmaps', setExportBitmaps)} className="neo-input w-full text-sm text-[#7e9c7e] file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#7e9c7e] file:text-white hover:file:bg-[#1a201a] transition-all cursor-pointer" />
                {fileErrors.bitmaps && <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3" />{fileErrors.bitmaps}</p>}
                {exportBitmaps.length > 0 && <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" />{exportBitmaps.length} file(s) selected</p>}
                {exportBitmaps.map((f, i) => (
                  <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setExportBitmaps)} className="mt-3 neo-input w-full p-3 text-sm font-medium" placeholder="Filename in zip" />
                ))}
              </div>

              <div className="pt-6 border-t border-[#7e9c7e]/10">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-bold text-[#7e9c7e] hover:text-[#1a201a] transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced Options
                </button>
                
                {showAdvanced && (
                  <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-[#7e9c7e] mb-2 uppercase tracking-widest">Widget Title</label>
                      <input 
                        type="text" 
                        value={exportTitle} 
                        onChange={e => setExportTitle(e.target.value)} 
                        className="neo-input w-full p-3 text-sm font-medium" 
                        placeholder="My Awesome Widget" 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#7e9c7e] mb-2 uppercase tracking-widest">Version</label>
                        <input 
                          type="number" 
                          value={exportVersion} 
                          onChange={e => setExportVersion(e.target.value === '' ? '' : Number(e.target.value))} 
                          className="neo-input w-full p-3 text-sm font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#7e9c7e] mb-2 uppercase tracking-widest">Release</label>
                        <input 
                          type="number" 
                          value={exportRelease} 
                          onChange={e => setExportRelease(e.target.value === '' ? '' : Number(e.target.value))} 
                          className="neo-input w-full p-3 text-sm font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#7e9c7e] mb-2 uppercase tracking-widest">Pflags</label>
                        <input 
                          type="number" 
                          value={exportPflags} 
                          onChange={e => setExportPflags(e.target.value === '' ? '' : Number(e.target.value))} 
                          className="neo-input w-full p-3 text-sm font-medium" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <button onClick={() => setExportModalOpen(false)} className="neo-button px-6 py-2 text-[#7e9c7e] font-bold hover:text-red-500">
                Cancel
              </button>
              <button onClick={handleExportConfirm} className="neo-button-primary px-8 py-2 font-bold">
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
