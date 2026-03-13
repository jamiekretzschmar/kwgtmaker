import React, { useState, useEffect } from 'react';
import { generateWidgetMockup, generateWidgetInstructions, searchWidgetKodes, generateWidgetAnimation, suggestWidgetImprovements, enhanceWidgetPrompt } from '../services/gemini';
import { saveWidget, updateWidget } from '../services/firestore';
import { auth } from '../firebase';
import { Loader2, Wand2, Search, Download, CheckCircle2, AlertCircle, ChevronDown, PlayCircle, FileText, Sparkles, Palette, Code, Image as ImageIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import { exportToKwgt } from '../utils/kwgtExport';
import { compressImage } from '../utils/image';

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];

const POPULAR_PROMPTS = [
  "A neomorphic dark music player with an animation that looks like an equalizer",
  "A minimalist glassmorphism weather widget with a 5-day forecast",
  "A retro 8-bit style clock and battery indicator",
  "A sleek cyberpunk dashboard with system stats (CPU, RAM, Battery)",
  "A clean iOS-style calendar and events widget",
  "A material design fitness tracker showing steps and calories"
];

interface ExportFile {
  file: File;
  name: string;
  previewUrl?: string;
  fontFamily?: string;
}

export function WidgetGenerator({ onWidgetGenerated }: { onWidgetGenerated: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWidgetId, setCurrentWidgetId] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);

  const [fonts, setFonts] = useState<ExportFile[]>([]);
  const [icons, setIcons] = useState<ExportFile[]>([]);
  const [bitmaps, setBitmaps] = useState<ExportFile[]>([]);
  const [fileErrors, setFileErrors] = useState<{fonts?: string, icons?: string, bitmaps?: string}>({});

  const [result, setResult] = useState<{
    mockupUrl: string;
    instructions: string;
    kodes: string;
  } | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoLoadingMessage, setVideoLoadingMessage] = useState('');
  const [videoError, setVideoError] = useState<string | null>(null);

  const [wizardInput, setWizardInput] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardResult, setWizardResult] = useState<string | null>(null);

  const [primaryColor, setPrimaryColor] = useState('#1E1E1E');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [accentColor, setAccentColor] = useState('#6366F1');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Drafting layout...');
  const [activeTab, setActiveTab] = useState<'preview' | 'instructions' | 'code'>('preview');

  useEffect(() => {
    if (!loading) return;
    const messages = [
      'Drafting layout...',
      'Applying colors...',
      'Writing Kodes...',
      'Generating mockup...',
      'Finalizing instructions...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 8000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceWidgetPrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      console.error("Failed to enhance prompt:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      fonts.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [fonts]);

  const handleGenerateAnimation = async () => {
    if (!result?.mockupUrl) return;
    
    // Check if user has selected an API key
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Assume success after dialog closes to handle race condition
      }
    }

    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoLoadingMessage('Initializing animation generation...');

    // Simulate progress messages since video generation takes a while
    const messages = [
      'Analyzing widget design...',
      'Setting up animation parameters...',
      'Rendering frames (this may take a few minutes)...',
      'Applying easing and transitions...',
      'Finalizing video format...'
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setVideoLoadingMessage(messages[messageIndex]);
    }, 15000);

    try {
      const url = await generateWidgetAnimation(prompt, result.mockupUrl, aspectRatio);
      setVideoUrl(url);
    } catch (err) {
      console.error('Video generation failed:', err);
      setVideoError(err instanceof Error ? err.message : 'Failed to generate animation.');
    } finally {
      clearInterval(messageInterval);
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !auth.currentUser) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveTab('preview');

    const fullPrompt = `${prompt}\n\nColor Palette:\nPrimary: ${primaryColor}\nSecondary: ${secondaryColor}\nAccent: ${accentColor}`;

    try {
      // Run generation tasks in parallel
      const [mockupUrl, instructions, kodes] = await Promise.all([
        generateWidgetMockup(fullPrompt, aspectRatio).catch(err => {
          throw new Error(`Failed to generate mockup: ${err.message || 'Unknown error'}`);
        }),
        generateWidgetInstructions(fullPrompt).catch(err => {
          throw new Error(`Failed to generate instructions: ${err.message || 'Unknown error'}`);
        }),
        searchWidgetKodes(fullPrompt).catch(err => {
          throw new Error(`Failed to search for Kodes: ${err.message || 'Unknown error'}`);
        })
      ]);

      const compressedMockupUrl = await compressImage(mockupUrl, 800, 0.7);

      setResult({ mockupUrl: compressedMockupUrl, instructions, kodes });

      // Save to Firestore
      if (currentWidgetId) {
        await updateWidget(currentWidgetId, {
          prompt,
          aspectRatio,
          mockupUrl: compressedMockupUrl,
          instructions,
          kodes,
        });
      } else {
        const newId = await saveWidget({
          userId: auth.currentUser.uid,
          prompt,
          aspectRatio,
          mockupUrl: compressedMockupUrl,
          instructions,
          kodes,
        });
        if (newId) {
          setCurrentWidgetId(newId);
        }
      }

      onWidgetGenerated();
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during generation. Please try again or check your API key quota.');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    setWizardLoading(true);
    try {
      const suggestions = await suggestWidgetImprovements(prompt, wizardInput);
      setWizardResult(suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setWizardLoading(false);
    }
  };

  const handleExportText = () => {
    if (!result) return;
    const content = `# Widget: ${prompt}\n\n## Instructions\n${result.instructions}\n\n## Kodes\n${result.kodes}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `widget-docs-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        const processedFiles = files.map(file => {
          const exportFile: ExportFile = { file, name: file.name };
          if (type === 'fonts') {
            const url = URL.createObjectURL(file);
            const fontFamily = `custom-font-${Math.random().toString(36).substring(7)}`;
            
            // Inject font face
            const style = document.createElement('style');
            style.textContent = `
              @font-face {
                font-family: '${fontFamily}';
                src: url('${url}');
              }
            `;
            document.head.appendChild(style);
            
            exportFile.previewUrl = url;
            exportFile.fontFamily = fontFamily;
          }
          return exportFile;
        });

        setter(processedFiles);
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

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Wand2 className="w-6 h-6 text-indigo-400" />
        Create KWGT Widget
      </h2>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div>
          <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
            <label className="block text-sm font-medium text-neutral-300">
              Describe your widget
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Enhance Prompt
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPrompts(!showPrompts)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Popular Prompts <ChevronDown className="w-3 h-3" />
                </button>
                {showPrompts && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl z-10 overflow-hidden">
                    {POPULAR_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPrompt(p);
                          setShowPrompts(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white border-b border-neutral-700/50 last:border-0 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., a neomorphic dark music player with an animation that looks like an equalizer"
            className="w-full h-32 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Color Palette
            </label>
            <div className="flex items-center gap-4 bg-neutral-800 p-3 rounded-xl border border-neutral-700">
              <div className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  title="Primary Color"
                />
                <span className="text-[10px] text-neutral-400">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  title="Secondary Color"
                />
                <span className="text-[10px] text-neutral-400">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  title="Accent Color"
                />
                <span className="text-[10px] text-neutral-400">Accent</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ASPECT_RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Custom Fonts (.ttf, .otf)</label>
            <input type="file" multiple accept=".ttf,.otf" onChange={e => handleFileChange(e, 'fonts', setFonts)} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors" />
            {fileErrors.fonts && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileErrors.fonts}</p>}
            {fonts.length > 0 && <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{fonts.length} file(s) selected</p>}
            {fonts.map((f, i) => (
              <div key={i} className="mt-2 space-y-2">
                <input type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setFonts)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white" placeholder="Filename in zip" />
                {f.fontFamily && (
                  <div className="p-3 bg-neutral-800 rounded-md border border-neutral-700">
                    <p className="text-xs text-neutral-500 mb-1">Preview:</p>
                    <p style={{ fontFamily: f.fontFamily }} className="text-lg text-white">The quick brown fox jumps over the lazy dog 1234567890</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Custom Icons (.png, .svg)</label>
            <input type="file" multiple accept=".png,.svg" onChange={e => handleFileChange(e, 'icons', setIcons)} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors" />
            {fileErrors.icons && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileErrors.icons}</p>}
            {icons.length > 0 && <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{icons.length} file(s) selected</p>}
            {icons.map((f, i) => (
              <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setIcons)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white" placeholder="Filename in zip" />
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Custom Bitmaps (.png, .jpg)</label>
            <input type="file" multiple accept=".png,.jpg,.jpeg" onChange={e => handleFileChange(e, 'bitmaps', setBitmaps)} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors" />
            {fileErrors.bitmaps && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileErrors.bitmaps}</p>}
            {bitmaps.length > 0 && <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{bitmaps.length} file(s) selected</p>}
            {bitmaps.map((f, i) => (
              <input key={i} type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setBitmaps)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm text-white" placeholder="Filename in zip" />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-700 disabled:text-neutral-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 h-[50px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                {result ? 'Regenerate Widget' : 'Generate Widget'}
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-200 flex items-start gap-3">
          <div className="mt-0.5">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-red-300">Generation Error</h4>
            <p className="text-sm mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h3 className="text-xl font-bold text-white">Generated Result</h3>
             <div className="flex flex-wrap gap-3">
               <button
                  onClick={handleExportText}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Export Docs
                </button>
               <button
                  onClick={() => exportToKwgt({ id: currentWidgetId || undefined, prompt, aspectRatio, ...result, userId: auth.currentUser?.uid || '', createdAt: new Date() }, { fonts, icons, bitmaps })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export .kwgt
                </button>
             </div>
          </div>

          <div className="flex border-b border-neutral-800 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'preview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'instructions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <FileText className="w-4 h-4" /> Instructions
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'code' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <Code className="w-4 h-4" /> Raw Code
            </button>
          </div>

          <div className="pt-4">
            {activeTab === 'preview' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-700 flex flex-col items-center justify-center p-4">
                  {videoUrl ? (
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="max-w-full max-h-[600px] object-contain rounded-xl shadow-2xl"
                    />
                  ) : (
                    <img
                      src={result.mockupUrl}
                      alt="Widget Mockup"
                      className="max-w-full max-h-[600px] object-contain rounded-xl shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {!videoUrl && (
                    <div className="mt-4 w-full max-w-md">
                      {isGeneratingVideo ? (
                        <div className="flex flex-col items-center p-4 bg-neutral-900/50 rounded-xl border border-neutral-700/50">
                          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                          <p className="text-sm text-neutral-300 text-center">{videoLoadingMessage}</p>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateAnimation}
                          className="w-full py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Generate Animation Preview
                        </button>
                      )}
                      {videoError && (
                        <p className="text-red-400 text-xs mt-2 text-center">{videoError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 animate-in fade-in duration-300">
                <div className="prose prose-invert prose-indigo max-w-none">
                  <Markdown>{result.instructions}</Markdown>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 overflow-x-auto">
                  <pre className="text-sm text-indigo-300 font-mono whitespace-pre-wrap">
                    <code>{result.kodes}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Widget Wizard */}
          <div className="space-y-4 pt-8 border-t border-neutral-800">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Widget Wizard
            </h3>
            <p className="text-sm text-neutral-400">
              Want to tweak this widget? Describe what you'd like to change, or leave it blank for general improvement suggestions.
            </p>
            <form onSubmit={handleWizardSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={wizardInput}
                onChange={(e) => setWizardInput(e.target.value)}
                placeholder="e.g., Make it red, add a battery bar..."
                className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={wizardLoading}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-700 disabled:text-neutral-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {wizardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Get Suggestions
              </button>
            </form>
            
            {wizardResult && (
              <div className="bg-neutral-800/50 rounded-2xl p-6 border border-indigo-500/30 mt-4 animate-in fade-in slide-in-from-top-2">
                <div className="prose prose-invert prose-indigo max-w-none">
                  <Markdown>{wizardResult}</Markdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
