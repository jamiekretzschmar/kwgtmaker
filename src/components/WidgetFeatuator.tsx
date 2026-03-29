import React, { useState, useEffect, useRef } from 'react';
import { generateFullWidgetPreset, generateWidgetMockup, generateWidgetAnimation, suggestWidgetImprovements, enhanceWidgetPrompt, auditWidgetContrast } from '../services/gemini';
import { saveWidget, updateWidget, saveFavoriteColors, loadFavoriteColors, loadCustomPalettes, loadAssets, saveCustomPalette, deleteCustomPalette } from '../services/firestore';
import { auth } from '../firebase';
import { Loader2, Wand2, Search, Download, CheckCircle2, AlertCircle, ChevronDown, PlayCircle, FileText, Sparkles, Palette, Code, Image as ImageIcon, Plus, Type, Upload, X, Eye, EyeOff, Save, History, RefreshCw, Trash2, Undo2, Redo2, Copy } from 'lucide-react';
import { localDb } from '../services/localDb';
import Markdown from 'react-markdown';
import { exportToKwgt } from '../utils/kwgtExport';
import { toast } from 'sonner';
import { compressImage } from '../utils/image';
import { useWidget } from '../context/WidgetContext';
import { useTask } from '../context/TaskContext';
import { extractColorsFromImage } from '../utils/colorExtractor';
import { useLocation } from 'react-router-dom';

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];

const DESIGN_STYLES = [
  'Minimalist', 'Material You', 'Brutalist', 'Glassmorphism', 'Cyberpunk', 'Retro',
  'Neumorphism', 'Skeuomorphic', 'Flat Design', 'Corporate', 'Playful', 'Gothic',
  'Steampunk', 'Synthwave', 'Anime', 'Comic Book', 'Watercolor', 'Hand-drawn',
  'Abstract', 'Geometric', 'Organic', 'Industrial', 'Vintage', 'Futuristic',
  'Monochrome', 'High Contrast'
];

const PREDEFINED_PALETTES = [
  { name: 'Default Dark', primary: '#1E1E1E', secondary: '#FFFFFF', accent: '#6366F1' },
  { name: 'Ocean', primary: '#0F172A', secondary: '#F8FAFC', accent: '#38BDF8' },
  { name: 'Forest', primary: '#14532D', secondary: '#ECFDF5', accent: '#10B981' },
  { name: 'Sunset', primary: '#450A0A', secondary: '#FEF2F2', accent: '#F97316' },
  { name: 'Cyberpunk', primary: '#09090B', secondary: '#FAFAFA', accent: '#D946EF' },
  { name: 'Monochrome', primary: '#000000', secondary: '#FFFFFF', accent: '#737373' },
];

import { ExportFile } from '../types';
import { WidgetData } from '../services/firestore';

export function WidgetFeatuator({ onWidgetGenerated, editWidget }: { onWidgetGenerated: () => void, editWidget?: WidgetData }) {
  const [prompt, setPrompt] = useState(editWidget?.prompt || '');
  const [aspectRatio, setAspectRatio] = useState(editWidget?.aspectRatio || '1:1');
  const [vibe, setVibe] = useState('Minimalist');
  const [error, setError] = useState<string | null>(null);
  const [currentWidgetId, setCurrentWidgetId] = useState<string | null>(editWidget?.id || null);
  const [showStyles, setShowStyles] = useState(false);
  const [showPalettes, setShowPalettes] = useState(false);

  const [numVariations, setNumVariations] = useState(1);
  const [customPalettes, setCustomPalettes] = useState<any[]>([]);
  const [customFonts, setCustomFonts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPalettes = async () => {
      if (auth.currentUser) {
        const palettes = await loadCustomPalettes(auth.currentUser.uid);
        setCustomPalettes(palettes);
      }
    };
    fetchPalettes();
    
    // Listen for changes in the palettes table
    const interval = setInterval(fetchPalettes, 2000);
    return () => clearInterval(interval);
  }, []);

  const { state, setState, pushToHistory, undo, redo } = useWidget();
  const { addTask, updateTask } = useTask();
  const { result, results, selectedResultIndex, loading, auditResult, isAuditing, videoUrl, isGeneratingVideo, videoLoadingMessage, videoError, fonts, icons, bitmaps, fileErrors, history, historyIndex } = state;

  const setResult = (result: any) => setState(prev => ({ ...prev, result }));
  const setResults = (results: any[]) => setState(prev => ({ ...prev, results }));
  const setSelectedResultIndex = (selectedResultIndex: number) => setState(prev => ({ ...prev, selectedResultIndex }));
  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));
  const setAuditResult = (auditResult: any) => setState(prev => ({ ...prev, auditResult }));
  const setIsAuditing = (isAuditing: boolean) => setState(prev => ({ ...prev, isAuditing }));
  const setVideoUrl = (videoUrl: string | null) => setState(prev => ({ ...prev, videoUrl }));
  const setIsGeneratingVideo = (isGeneratingVideo: boolean) => setState(prev => ({ ...prev, isGeneratingVideo }));
  const setVideoLoadingMessage = (videoLoadingMessage: string) => setState(prev => ({ ...prev, videoLoadingMessage }));
  const setVideoError = (videoError: string | null) => setState(prev => ({ ...prev, videoError }));
  const setFonts = (fonts: ExportFile[] | ((prev: ExportFile[]) => ExportFile[])) => setState(prev => ({ ...prev, fonts: typeof fonts === 'function' ? fonts(prev.fonts) : fonts }));
  const setIcons = (icons: ExportFile[] | ((prev: ExportFile[]) => ExportFile[])) => setState(prev => ({ ...prev, icons: typeof icons === 'function' ? icons(prev.icons) : icons }));
  const setBitmaps = (bitmaps: ExportFile[] | ((prev: ExportFile[]) => ExportFile[])) => setState(prev => ({ ...prev, bitmaps: typeof bitmaps === 'function' ? bitmaps(prev.bitmaps) : bitmaps }));
  const setFileErrors = (fileErrors: any | ((prev: any) => any)) => setState(prev => ({ ...prev, fileErrors: typeof fileErrors === 'function' ? fileErrors(prev.fileErrors) : fileErrors }));
  const setFavoriteColors = (favoriteColors: string[]) => setState(prev => ({ ...prev, favoriteColors }));

  const location = useLocation();

  useEffect(() => {
    setLoading(false);
    const remixWidget = location.state?.remixWidget;
    const targetWidget = editWidget || remixWidget;

    if (targetWidget) {
      setPrompt(targetWidget.prompt);
      setAspectRatio(targetWidget.aspectRatio || '1:1');
      // Only set currentWidgetId if we are EDITING, not REMIXING
      if (editWidget) {
        setCurrentWidgetId(targetWidget.id || null);
      } else {
        setCurrentWidgetId(null);
      }
      if (targetWidget.presetJson || targetWidget.mockupUrl || targetWidget.instructions) {
        const res = {
          mockupUrl: targetWidget.mockupUrl,
          instructions: targetWidget.instructions,
          presetJson: targetWidget.presetJson,
          id: targetWidget.id
        };
        setResult(res);
        setResults([res]);
        pushToHistory(res, [res], 0);
      }
      if (targetWidget.primaryColor) setPrimaryColor(targetWidget.primaryColor);
      if (targetWidget.secondaryColor) setSecondaryColor(targetWidget.secondaryColor);
      if (targetWidget.accentColor) setAccentColor(targetWidget.accentColor);
    }
  }, [editWidget, location.state]);

  const addFavoriteColor = async (color: string) => {
    if (!state.favoriteColors.includes(color)) {
      const newColors = [...state.favoriteColors, color];
      setFavoriteColors(newColors);
      if (auth.currentUser) {
        try {
          await saveFavoriteColors(auth.currentUser.uid, newColors);
        } catch (err) {
          console.error('Failed to save favorite colors:', err);
        }
      }
    }
  };

  const removeFavoriteColor = async (color: string) => {
    const newColors = state.favoriteColors.filter(c => c !== color);
    setFavoriteColors(newColors);
    if (auth.currentUser) {
      try {
        await saveFavoriteColors(auth.currentUser.uid, newColors);
      } catch (err) {
        console.error('Failed to save favorite colors:', err);
      }
    }
  };

  const [wizardInput, setWizardInput] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (auth.currentUser) {
        try {
          const colors = await loadFavoriteColors(auth.currentUser.uid);
          setFavoriteColors(colors);
          
          const fonts = await loadAssets(auth.currentUser.uid, 'font');
          setCustomFonts(fonts);
        } catch (err) {
          console.error('Failed to load user data:', err);
        }
      }
    };
    loadData();
  }, []);
  const [wizardResult, setWizardResult] = useState<string[] | null>(null);

  const [primaryColor, setPrimaryColor] = useState('#1E1E1E');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [accentColor, setAccentColor] = useState('#6366F1');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
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

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingColors(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target?.result as string;
        const colors = await extractColorsFromImage(imageUrl);
        if (colors.length >= 3) {
          setPrimaryColor(colors[0]);
          setSecondaryColor(colors[1]);
          setAccentColor(colors[2]);
        }
        setIsExtractingColors(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to extract colors:', err);
      setIsExtractingColors(false);
    }
  };

  const handleSaveStyle = async () => {
    if (!auth.currentUser) return;
    const styleName = window.prompt('Enter a name for this style:');
    if (!styleName) return;

    try {
      await saveCustomPalette(auth.currentUser.uid, {
        name: styleName,
        colors: [primaryColor, secondaryColor, accentColor]
      });
    } catch (err) {
      console.error('Failed to save style:', err);
    }
  };

  const handleDeletePalette = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!auth.currentUser || !window.confirm('Delete this palette?')) return;
    try {
      await deleteCustomPalette(auth.currentUser.uid, id);
    } catch (err) {
      console.error('Failed to delete palette:', err);
    }
  };

  const simulateLiveData = (text: string) => {
    if (!isLivePreview) return text;
    return text
      .replace(/\$bi\(level\)\$/g, '85')
      .replace(/\$df\(hh:mm\)\$/g, '10:45')
      .replace(/\$mi\(title\)\$/g, 'Midnight City')
      .replace(/\$mi\(artist\)\$/g, 'M83')
      .replace(/\$wi\(temp\)\$/g, '22°C')
      .replace(/\$wi\(cond\)\$/g, 'Sunny');
  };

  // Cleanup object URLs to avoid memory leaks
  const prevFontsRef = useRef<ExportFile[]>([]);
  const fontsRef = useRef(fonts);
  
  useEffect(() => {
    fontsRef.current = fonts;
    const prevFonts = prevFontsRef.current;
    // Find fonts that were removed
    const removedFonts = prevFonts.filter(pf => !fonts.find(f => f.name === pf.name));
    removedFonts.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    prevFontsRef.current = fonts;
  }, [fonts]);

  useEffect(() => {
    return () => {
      fontsRef.current.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const handleAddCustomFont = async (font: any) => {
    try {
      const blob = font.data;
      const file = new File([blob], font.name, { type: blob.type });
      
      const url = URL.createObjectURL(file);
      const fontFamily = `custom-font-${Math.random().toString(36).substring(7)}`;
      
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${fontFamily}';
          src: url('${url}');
        }
      `;
      document.head.appendChild(style);

      setFonts(prev => {
        if (prev.find(f => f.name === file.name)) return prev;
        return [...prev, { file, name: file.name, previewUrl: url, fontFamily }];
      });
    } catch (err) {
      console.error('Failed to add custom font:', err);
    }
  };

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

    const taskId = addTask({
      name: 'Generating Animation',
      status: 'processing',
      progress: 0,
    });

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
      updateTask(taskId, { progress: Math.min(90, (messageIndex + 1) * 15), name: messages[messageIndex] });
    }, 15000);

    try {
      updateTask(taskId, { progress: 10, name: 'Initializing animation generation...' });
      const url = await generateWidgetAnimation(prompt, result.mockupUrl, aspectRatio);
      setVideoUrl(url);
      updateTask(taskId, { progress: 100, status: 'completed', name: 'Animation generated successfully' });
    } catch (err) {
      console.error('Video generation failed:', err);
      setVideoError(err instanceof Error ? err.message : 'Failed to generate animation.');
      updateTask(taskId, { status: 'failed', error: err instanceof Error ? err.message : 'Failed to generate animation.' });
    } finally {
      clearInterval(messageInterval);
      setIsGeneratingVideo(false);
    }
  };

  const [exportFormat, setExportFormat] = useState<'kwgt' | 'klwp' | 'kwlc'>('kwgt');

  const handleGenerate = async (e?: React.FormEvent, overridePrompt?: string) => {
    if (e) e.preventDefault();
    const currentPrompt = overridePrompt || prompt;
    if (!currentPrompt.trim() || !auth.currentUser) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setAuditResult(null);
    setActiveTab('preview');

    const taskId = addTask({
      name: 'Generating Widget',
      status: 'processing',
      progress: 0,
    });

    try {
      const promptsList = currentPrompt.split('\n').filter(p => p.trim());
      
      const generateVariation = async (index: number) => {
        const variationPrompt = promptsList[index % promptsList.length] || currentPrompt;
        const fullPrompt = `${variationPrompt}\n\nColor Palette:\nPrimary: ${primaryColor}\nSecondary: ${secondaryColor}\nAccent: ${accentColor}`;

        // 1. Generate the full preset and instructions
        const { json: presetJson, instructions } = await generateFullWidgetPreset(fullPrompt, vibe, {
          fonts: (Array.isArray(fonts) ? fonts : []).map(f => f.name),
          icons: (Array.isArray(icons) ? icons : []).map(i => i.name),
          bitmaps: (Array.isArray(bitmaps) ? bitmaps : []).map(b => b.name)
        });

        // 2. Generate the mockup image separately
        let compressedMockupUrl = '';
        try {
          const mockupUrl = await generateWidgetMockup(fullPrompt, aspectRatio);
          compressedMockupUrl = await compressImage(mockupUrl, 800, 0.7);
        } catch (mockupErr) {
          console.error('Mockup generation failed:', mockupErr);
          compressedMockupUrl = `https://picsum.photos/seed/${encodeURIComponent(variationPrompt)}/800/800?blur=4`;
        }

        // Save to Firestore
        let newId = currentWidgetId;
        if (currentWidgetId && index === 0) {
          await updateWidget(currentWidgetId, {
            prompt: variationPrompt,
            aspectRatio,
            mockupUrl: compressedMockupUrl,
            instructions,
            presetJson,
          });
        } else {
          newId = await saveWidget({
            userId: auth.currentUser!.uid,
            prompt: variationPrompt,
            aspectRatio,
            mockupUrl: compressedMockupUrl,
            instructions,
            presetJson,
          });
        }

        return { mockupUrl: compressedMockupUrl, instructions, presetJson, id: newId };
      };

      updateTask(taskId, { progress: 20, name: `Generating ${numVariations} variation(s)...` });
      
      const generatedResults = [];
      for (let i = 0; i < numVariations; i++) {
        updateTask(taskId, { progress: 20 + (i / numVariations) * 60, name: `Generating variation ${i + 1} of ${numVariations}...` });
        const res = await generateVariation(i);
        generatedResults.push(res);
      }

      setResults(generatedResults);
      setResult(generatedResults[0]);
      setSelectedResultIndex(0);
      pushToHistory(generatedResults[0], generatedResults, 0);
      if (generatedResults[0].id) {
        setCurrentWidgetId(generatedResults[0].id);
      }

      // 3. Audit Contrast for the first one
      setIsAuditing(true);
      try {
        updateTask(taskId, { progress: 80, name: 'Auditing contrast...' });
        const audit = await auditWidgetContrast(generatedResults[0].presetJson);
        setAuditResult(audit);
      } catch (err) {
        console.error('Audit failed:', err);
      } finally {
        setIsAuditing(false);
      }

      updateTask(taskId, { progress: 100, status: 'completed', name: 'Widget generated successfully' });
      onWidgetGenerated();
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during generation. Please try again or check your API key quota.');
      updateTask(taskId, { status: 'failed', error: err instanceof Error ? err.message : 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const [wizardError, setWizardError] = useState<string | null>(null);

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    setWizardLoading(true);
    setWizardError(null);

    const taskId = addTask({
      name: 'Generating Suggestions',
      status: 'processing',
      progress: 0,
    });

    try {
      updateTask(taskId, { progress: 50, name: 'Analyzing prompt...' });
      const suggestions = await suggestWidgetImprovements(prompt, wizardInput);
      setWizardResult(suggestions);
      updateTask(taskId, { progress: 100, status: 'completed', name: 'Suggestions generated' });
    } catch (err) {
      console.error(err);
      setWizardError(err instanceof Error ? err.message : 'Failed to get suggestions.');
      updateTask(taskId, { status: 'failed', error: err instanceof Error ? err.message : 'Failed to get suggestions.' });
    } finally {
      setWizardLoading(false);
    }
  };

  const handleExportText = () => {
    if (!result) return;
    const content = `# Widget: ${prompt}\n\n## Instructions\n${result.instructions}\n\n## Preset JSON\n${JSON.stringify(result.presetJson, null, 2)}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `widget-docs-${result.id || 'new'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyKodes = () => {
    if (!result?.presetJson) return;
    const kodes = JSON.stringify(result.presetJson, null, 2);
    navigator.clipboard.writeText(kodes);
    toast.success('KWGT Kodes copied to clipboard!');
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
        valid = files.every(f => f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.svg') || f.name.toLowerCase().endsWith('.ttf') || f.name.toLowerCase().endsWith('.json'));
        if (!valid) errorMsg = 'Only .png, .svg, .ttf, and .json files are allowed for icons.';
      } else if (type === 'bitmaps') {
        valid = files.every(f => f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg'));
        if (!valid) errorMsg = 'Only .png, .jpg, and .jpeg files are allowed for bitmaps.';
      }

      if (valid) {
        setter(prev => {
          const newFiles = [...prev];
          files.forEach(file => {
            if (!newFiles.find(f => f.name === file.name)) {
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
              newFiles.push(exportFile);
            }
          });
          return newFiles;
        });
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
    <div className="w-full max-w-4xl mx-auto p-8 neo-card shadow-xl">
      <h2 className="text-2xl font-bold text-[#1a201a] mb-8 flex items-center gap-3">
        <div className="p-2 bg-[#7e9c7e]/10 rounded-lg">
          <Wand2 className="w-6 h-6 text-[#7e9c7e]" />
        </div>
        Create KWGT Widget
      </h2>

      <form onSubmit={handleGenerate} className="space-y-8">
        <div>
          <div className="flex flex-wrap justify-between items-end gap-2 mb-3">
            <label className="block text-sm font-semibold text-[#1a201a]/70 ml-1">
              Describe your widget
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="text-xs font-medium text-[#7e9c7e] hover:text-[#1a201a] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Enhance Prompt
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStyles(!showStyles)}
                  className="text-xs font-medium text-[#7e9c7e] hover:text-[#1a201a] flex items-center gap-1.5 transition-colors"
                >
                  Style: <span className="text-[#1a201a]">{vibe}</span> <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showStyles && (
                  <div className="absolute right-0 top-full mt-2 w-56 max-h-72 overflow-y-auto bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl shadow-2xl z-20 custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2">
                      {DESIGN_STYLES.map((v, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setVibe(v);
                            setShowStyles(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all ${
                            vibe === v 
                              ? 'bg-[#7e9c7e] text-white shadow-md' 
                              : 'text-[#1a201a]/70 hover:bg-[#7e9c7e]/10 hover:text-[#1a201a]'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., a neomorphic dark music player with an animation that looks like an equalizer"
              className="w-full h-36 px-5 py-4 neo-input text-[#1a201a] placeholder-[#7e9c7e]/50 resize-none pr-14"
              required
            />
            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              className="absolute bottom-3 right-3 p-2.5 bg-[#7e9c7e] text-white rounded-xl shadow-lg hover:bg-[#6a856a] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Enhance with AI"
            >
              <Wand2 className={`w-5 h-5 ${isEnhancing ? 'animate-spin' : 'group-hover:rotate-12'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-semibold text-[#1a201a]/70 ml-1">
                  Color Palette
                </label>
                <div className="flex gap-1.5 ml-2">
                  <label className="cursor-pointer px-2 py-0.5 bg-white/50 border border-[#7e9c7e]/20 rounded-lg text-[9px] font-bold text-[#7e9c7e] hover:bg-white transition-all flex items-center gap-1 shadow-sm">
                    <ImageIcon className="w-2.5 h-2.5" />
                    {isExtractingColors ? '...' : 'Wallpaper'}
                    <input type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveStyle}
                    className="px-2 py-0.5 bg-white/50 border border-[#7e9c7e]/20 rounded-lg text-[9px] font-bold text-[#7e9c7e] hover:bg-white transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Save className="w-2.5 h-2.5" />
                    Save
                  </button>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPalettes(!showPalettes)}
                  className="text-xs font-medium text-[#7e9c7e] hover:text-[#1a201a] flex items-center gap-1.5 transition-colors"
                >
                  <Palette className="w-3.5 h-3.5" /> Predefined <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showPalettes && (
                  <div className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl shadow-2xl z-20 custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 space-y-1">
                      {customPalettes.length > 0 && (
                        <div className="px-3 py-2 text-[10px] font-bold text-[#7e9c7e] uppercase tracking-widest">Custom</div>
                      )}
                      {customPalettes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(p.primary);
                            setSecondaryColor(p.secondary);
                            setAccentColor(p.accent);
                            setShowPalettes(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#1a201a]/70 hover:bg-[#7e9c7e]/10 hover:text-[#1a201a] rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <div className="flex gap-1 shrink-0">
                            <div className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: p.primary }} />
                            <div className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: p.secondary }} />
                            <div className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: p.accent }} />
                          </div>
                          <span className="truncate font-medium flex-1">{p.name}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePalette(e, p.id!.toString())}
                            className="p-1.5 text-[#7e9c7e]/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </button>
                      ))}
                      <div className="px-3 py-2 text-[10px] font-bold text-[#7e9c7e] uppercase tracking-widest mt-2">Predefined</div>
                      {PREDEFINED_PALETTES.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(p.primary);
                            setSecondaryColor(p.secondary);
                            setAccentColor(p.accent);
                            setShowPalettes(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#1a201a]/70 hover:bg-[#7e9c7e]/10 hover:text-[#1a201a] rounded-xl transition-all flex items-center gap-3"
                        >
                          <div className="flex gap-1 shrink-0">
                            <div className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: p.primary }} />
                            <div className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: p.secondary }} />
                            <div className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: p.accent }} />
                          </div>
                          <span className="truncate font-medium">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-inner">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border-2 border-white/80">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 scale-150"
                    title="Primary Color"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#7e9c7e] uppercase tracking-tighter">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border-2 border-white/80">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 scale-150"
                    title="Secondary Color"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#7e9c7e] uppercase tracking-tighter">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border-2 border-white/80">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 scale-150"
                    title="Accent Color"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#7e9c7e] uppercase tracking-tighter">Accent</span>
              </div>
              <button
                type="button"
                onClick={() => addFavoriteColor(accentColor)}
                className="w-10 h-10 rounded-xl border border-white/80 flex items-center justify-center text-[#7e9c7e] hover:text-[#1a201a] bg-white/50 shadow-sm hover:shadow-md transition-all active:scale-95"
                title="Save Accent Color"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {state.favoriteColors.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mt-4 ml-1">
                {state.favoriteColors.map(color => (
                  <div key={color} className="relative group">
                    <button
                      type="button"
                      onClick={() => setAccentColor(color)}
                      className="w-7 h-7 rounded-lg border-2 border-white/80 shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFavoriteColor(color)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-md transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#1a201a]/70 mb-3 ml-1">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      aspectRatio === ratio
                        ? 'bg-[#7e9c7e] text-white border-[#7e9c7e] shadow-md'
                        : 'bg-white/30 text-[#1a201a]/70 border-white/50 hover:bg-white/50'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#7e9c7e]/10">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-[#1a201a]/70 ml-1 flex items-center gap-2">
              <Type className="w-4 h-4" /> Fonts
            </label>
            <div className="relative group">
              <input 
                type="file" 
                multiple 
                accept=".ttf,.otf" 
                onChange={e => handleFileChange(e, 'fonts', setFonts)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/30 border border-dashed border-[#7e9c7e]/30 rounded-xl text-[#7e9c7e] group-hover:border-[#7e9c7e] group-hover:text-[#1a201a] transition-all text-xs font-medium">
                <Upload className="w-4 h-4" />
                <span>Upload .ttf/.otf</span>
              </div>
            </div>
            {customFonts.length > 0 && (
              <select
                onChange={(e) => {
                  const font = customFonts.find(f => String(f.id) === e.target.value);
                  if (font) handleAddCustomFont(font);
                  e.target.value = '';
                }}
                className="w-full bg-white/30 border border-white/50 rounded-xl px-4 py-2.5 text-xs text-[#1a201a] focus:ring-2 focus:ring-[#7e9c7e]/20 outline-none shadow-sm"
                defaultValue=""
              >
                <option value="" disabled>Add from saved fonts...</option>
                {customFonts.map(f => (
                  <option key={f.id} value={String(f.id)}>{f.name}</option>
                ))}
              </select>
            )}
            {fileErrors.fonts && <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" />{fileErrors.fonts}</p>}
            {fonts.length > 0 && <p className="text-emerald-600 text-[10px] mt-1 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" />{fonts.length} file(s) ready</p>}
            {(Array.isArray(fonts) ? fonts : []).map((f, i) => (
              <div key={i} className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex gap-2">
                  <input type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setFonts)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="flex-1 bg-white/50 border border-white/80 rounded-xl px-3 py-2 text-xs text-[#1a201a] shadow-inner" placeholder="Filename in zip" />
                  <button
                    type="button"
                    onClick={() => setFonts(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-2 text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
                    title="Remove Font"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {f.fontFamily && (
                  <div className="p-4 bg-white/30 rounded-xl border border-white/50 shadow-sm">
                    <p className="text-[10px] font-bold text-[#7e9c7e] uppercase tracking-widest mb-2">Preview</p>
                    <p style={{ fontFamily: f.fontFamily }} className="text-sm text-[#1a201a] leading-relaxed">The quick brown fox jumps over the lazy dog</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-[#1a201a]/70 ml-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Icons
            </label>
            <div className="relative group">
              <input 
                type="file" 
                multiple 
                accept=".png,.svg,.ttf,.json" 
                onChange={e => handleFileChange(e, 'icons', setIcons)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/30 border border-dashed border-[#7e9c7e]/30 rounded-xl text-[#7e9c7e] group-hover:border-[#7e9c7e] group-hover:text-[#1a201a] transition-all text-xs font-medium">
                <Upload className="w-4 h-4" />
                <span>Upload Icons</span>
              </div>
            </div>
            {fileErrors.icons && <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" />{fileErrors.icons}</p>}
            {icons.length > 0 && <p className="text-emerald-600 text-[10px] mt-1 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" />{icons.length} file(s) ready</p>}
            {(Array.isArray(icons) ? icons : []).map((f, i) => (
              <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <input type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setIcons)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="flex-1 bg-white/50 border border-white/80 rounded-xl px-3 py-2 text-xs text-[#1a201a] shadow-inner" placeholder="Filename in zip" />
                <button
                  type="button"
                  onClick={() => setIcons(prev => prev.filter((_, idx) => idx !== i))}
                  className="p-2 text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
                  title="Remove Icon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-[#1a201a]/70 ml-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Bitmaps
            </label>
            <div className="relative group">
              <input 
                type="file" 
                multiple 
                accept=".png,.jpg,.jpeg" 
                onChange={e => handleFileChange(e, 'bitmaps', setBitmaps)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/30 border border-dashed border-[#7e9c7e]/30 rounded-xl text-[#7e9c7e] group-hover:border-[#7e9c7e] group-hover:text-[#1a201a] transition-all text-xs font-medium">
                <Upload className="w-4 h-4" />
                <span>Upload Bitmaps</span>
              </div>
            </div>
            {fileErrors.bitmaps && <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" />{fileErrors.bitmaps}</p>}
            {bitmaps.length > 0 && <p className="text-emerald-600 text-[10px] mt-1 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" />{bitmaps.length} file(s) ready</p>}
            {(Array.isArray(bitmaps) ? bitmaps : []).map((f, i) => (
              <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <input type="text" value={f.name} onChange={e => handleFileNameChange(i, e.target.value, setBitmaps)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="flex-1 bg-white/50 border border-white/80 rounded-xl px-3 py-2 text-xs text-[#1a201a] shadow-inner" placeholder="Filename in zip" />
                <button
                  type="button"
                  onClick={() => setBitmaps(prev => prev.filter((_, idx) => idx !== i))}
                  className="p-2 text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
                  title="Remove Bitmap"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-6 items-center pt-8 border-t border-[#7e9c7e]/10">
          <div className="flex items-center gap-3 bg-white/30 px-4 py-2 rounded-2xl border border-white/50 shadow-sm">
            <label className="text-xs font-bold text-[#7e9c7e] uppercase tracking-wider">Variations</label>
            <select
              value={numVariations}
              onChange={(e) => setNumVariations(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-[#1a201a] outline-none cursor-pointer"
            >
              {[1, 2, 3, 4].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full sm:w-auto px-10 py-4 neo-button-primary flex items-center justify-center gap-3 h-[56px] min-w-[240px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="animate-pulse">{loadingMessage}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span className="font-bold">{result ? 'Regenerate Widget' : 'Generate Widget'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-700 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-bold text-red-800">Generation Error</h4>
            <p className="text-sm mt-1 opacity-80 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
             <h3 className="text-2xl font-bold text-[#1a201a] flex items-center gap-3">
               <div className="w-2 h-8 bg-[#7e9c7e] rounded-full" />
               Generated Result
             </h3>
             <div className="flex flex-wrap gap-3">
                <div className="flex gap-2 mr-4">
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="p-2.5 neo-button disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2.5 neo-button disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleCopyKodes}
                  className="px-5 py-2.5 neo-button flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Copy className="w-4 h-4" />
                  Copy Kodes
                </button>
                <button
                   onClick={handleExportText}
                   className="px-5 py-2.5 neo-button flex items-center justify-center gap-2 text-sm font-bold"
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
            <div className="flex-1" />
            <button
              onClick={() => setIsLivePreview(!isLivePreview)}
              className={`px-4 py-3 text-xs font-bold transition-all flex items-center gap-2 ${
                isLivePreview ? 'text-green-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {isLivePreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Live Data
            </button>
          </div>

          <div className="pt-4">
            {activeTab === 'preview' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {results && results.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {results.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedResultIndex(idx);
                          setResult(res);
                          setCurrentWidgetId(res.id);
                        }}
                        className={`relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedResultIndex === idx ? 'border-indigo-500 scale-105 shadow-lg' : 'border-neutral-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={res.mockupUrl} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white text-center py-0.5">
                          Var {idx + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 flex flex-col items-center justify-center p-8 relative min-h-[500px]">
                  {/* 3D Phone Frame Simulation */}
                  <div className="relative group perspective-1000">
                    <div className="relative w-[300px] h-[600px] bg-neutral-950 rounded-[3rem] border-[8px] border-neutral-800 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-6">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 rounded-b-2xl z-20 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neutral-900" />
                        <div className="w-8 h-1 rounded-full bg-neutral-900" />
                      </div>

                      {/* Screen Content */}
                      <div className="absolute inset-0 bg-[#121212] flex flex-col items-center justify-start pt-16 px-4">
                        {/* Status Bar */}
                        <div className="w-full flex justify-between px-4 mb-8 text-[10px] font-bold text-white/40">
                          <span>10:45</span>
                          <div className="flex gap-1">
                            <div className="w-3 h-2 border border-white/20 rounded-sm" />
                            <div className="w-2 h-2 bg-white/20 rounded-full" />
                          </div>
                        </div>

                        {/* The Widget */}
                        <div className="w-full animate-in zoom-in-95 duration-500">
                          {videoUrl ? (
                            <video 
                              src={videoUrl} 
                              controls={false}
                              autoPlay 
                              loop 
                              muted
                              className="w-full rounded-2xl shadow-2xl"
                            />
                          ) : (
                            <img
                              src={result.mockupUrl}
                              alt="Widget Mockup"
                              className="w-full rounded-2xl shadow-2xl"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Dock */}
                        <div className="absolute bottom-8 left-4 right-4 h-16 bg-white/5 rounded-3xl flex items-center justify-around px-4">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-xl bg-white/10" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
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
                {auditResult && (
                  <div className={`p-4 rounded-xl border ${auditResult.compliant ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-amber-900/20 border-amber-800 text-amber-400'}`}>
                    <h4 className="font-semibold flex items-center gap-2">
                      {auditResult.compliant ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      Contrast Audit: {auditResult.compliant ? 'Compliant' : 'Needs Improvement'}
                    </h4>
                    <p className="text-sm mt-1">{auditResult.suggestions}</p>
                  </div>
                )}
                {isAuditing && <div className="text-sm text-indigo-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Auditing contrast...</div>}
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 animate-in fade-in duration-300">
                <div className="prose prose-invert prose-indigo max-w-none markdown-body">
                  <Markdown>{simulateLiveData(result.instructions)}</Markdown>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 overflow-x-auto">
                  <pre className="text-sm text-indigo-300 font-mono whitespace-pre-wrap">
                    <code>{JSON.stringify(result.presetJson, null, 2)}</code>
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
            
            {wizardError && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-200 mt-4">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{wizardError}</p>
              </div>
            )}
            
            {wizardResult && wizardResult.length > 0 && (
              <div className="bg-neutral-800/50 rounded-2xl p-6 border border-indigo-500/30 mt-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-medium text-indigo-400 mb-3">Suggested Prompts</h4>
                <div className="flex flex-col gap-2">
                  {wizardResult.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(suggestion);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        handleGenerate(undefined, suggestion);
                      }}
                      className="text-left px-4 py-3 bg-neutral-900 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-sm text-neutral-300 transition-colors flex items-start gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
