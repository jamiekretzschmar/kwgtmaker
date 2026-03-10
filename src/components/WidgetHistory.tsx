import React, { useEffect, useState } from 'react';
import { loadWidgets, deleteWidget, WidgetData } from '../services/firestore';
import { auth } from '../firebase';
import { Trash2, Clock, Calendar, Share2, Check, X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { exportToKwgt } from '../utils/kwgtExport';

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

interface ExportFile {
  file: File;
  name: string;
}

export function WidgetHistory({ refreshTrigger }: { refreshTrigger: number }) {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        const data = await loadWidgets(auth.currentUser.uid);
        // Sort by createdAt descending
        data.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
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
  }, [refreshTrigger]);

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
    setExportTitle(widget.prompt.split(' ').slice(0, 3).join(' ') || 'KustomGen Widget');
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
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="text-center p-12 text-neutral-500">
        <p>No widgets generated yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Link
            to={`/widget/${widget.id}`}
            key={widget.id}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1 group relative flex flex-col"
          >
            <div className={`${aspectRatioMap[widget.aspectRatio] || 'aspect-square'} bg-neutral-800 flex items-center justify-center p-4 relative`}>
              <img
                src={widget.mockupUrl}
                alt={widget.prompt}
                className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button
                  onClick={(e) => handleShare(widget.id!, e)}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100"
                  title="Share Widget"
                >
                  {copiedId === widget.id ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const content = `# Widget: ${widget.prompt}\n\n## Instructions\n${widget.instructions}\n\n## Kodes\n${widget.kodes}`;
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
                  className="p-3 bg-neutral-600 hover:bg-neutral-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100"
                  title="Export Docs"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => openExportModal(widget, e)}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100"
                  title="Export .kwgt"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDelete(widget.id!, e)}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100"
                  title="Delete Widget"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <p className="text-neutral-200 text-sm line-clamp-2 mb-4 font-medium flex-1" title={widget.prompt}>
                "{widget.prompt}"
              </p>
              <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {widget.createdAt?.toDate ? format(widget.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {widget.aspectRatio}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">Export Widget</h3>
               <button onClick={() => setExportModalOpen(false)} className="text-neutral-400 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Include Custom Fonts (.ttf, .otf)</label>
                <input type="file" multiple accept=".ttf,.otf" onChange={e => handleFileChange(e, 'fonts', setExportFonts)} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors" />
                {fileErrors.fonts && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileErrors.fonts}</p>}
                {exportFonts.length > 0 && <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{exportFonts.length} file(s) selected</p>}
                {exportFonts.map((f, i) => (
                  <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setExportFonts)} className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white" placeholder="Filename in zip" />
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Include Custom Icons (.png, .svg)</label>
                <input type="file" multiple accept=".png,.svg" onChange={e => handleFileChange(e, 'icons', setExportIcons)} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors" />
                {fileErrors.icons && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileErrors.icons}</p>}
                {exportIcons.length > 0 && <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{exportIcons.length} file(s) selected</p>}
                {exportIcons.map((f, i) => (
                  <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setExportIcons)} className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white" placeholder="Filename in zip" />
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Include Custom Bitmaps (.png, .jpg)</label>
                <input type="file" multiple accept=".png,.jpg,.jpeg" onChange={e => handleFileChange(e, 'bitmaps', setExportBitmaps)} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors" />
                {fileErrors.bitmaps && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileErrors.bitmaps}</p>}
                {exportBitmaps.length > 0 && <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{exportBitmaps.length} file(s) selected</p>}
                {exportBitmaps.map((f, i) => (
                  <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setExportBitmaps)} className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white" placeholder="Filename in zip" />
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced Options
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Widget Title</label>
                      <input 
                        type="text" 
                        value={exportTitle} 
                        onChange={e => setExportTitle(e.target.value)} 
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                        placeholder="My Awesome Widget" 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Version</label>
                        <input 
                          type="number" 
                          value={exportVersion} 
                          onChange={e => setExportVersion(e.target.value === '' ? '' : Number(e.target.value))} 
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Release</label>
                        <input 
                          type="number" 
                          value={exportRelease} 
                          onChange={e => setExportRelease(e.target.value === '' ? '' : Number(e.target.value))} 
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Pflags</label>
                        <input 
                          type="number" 
                          value={exportPflags} 
                          onChange={e => setExportPflags(e.target.value === '' ? '' : Number(e.target.value))} 
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setExportModalOpen(false)} className="px-4 py-2 text-neutral-300 hover:text-white font-medium">
                Cancel
              </button>
              <button onClick={handleExportConfirm} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors">
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
