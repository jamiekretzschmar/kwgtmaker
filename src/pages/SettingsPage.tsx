import React, { useState, useEffect } from 'react';
import { Github, Terminal, HardDrive, Code2, Palette, Download, Upload, Loader2, Save, AlertCircle, CheckCircle2, Type, Trash2, Plus, X } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { exportAllData, importData } from '../utils/backupRestore';
import { auth } from '../firebase';
import { loadCustomPalettes, saveCustomPalette, deleteCustomPalette, loadAssets, saveAsset, deleteAsset } from '../services/firestore';

const ColorInput = ({ color, onChange, onRemove, showRemove }: { color: string, onChange: (c: string) => void, onRemove: () => void, showRemove: boolean }) => {
  const [localColor, setLocalColor] = useState(color);

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  return (
    <div className="relative group flex items-center gap-1 bg-white/50 rounded-lg p-1 border border-white/80 shadow-sm">
      <input 
        type="color" 
        value={localColor}
        onChange={(e) => {
          setLocalColor(e.target.value);
          onChange(e.target.value);
        }}
        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
      />
      <input
        type="text"
        value={localColor}
        onChange={(e) => {
          const val = e.target.value;
          setLocalColor(val);
          if (val.length === 7 && val.startsWith('#')) {
            onChange(val);
          }
        }}
        onBlur={() => {
          if (!localColor.startsWith('#') || localColor.length !== 7) {
            setLocalColor(color);
          } else {
            onChange(localColor);
          }
        }}
        className="w-20 bg-transparent text-xs text-[#1a201a] px-1 outline-none uppercase font-mono"
        maxLength={7}
      />
      {showRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [palettes, setPalettes] = useState<{ id: string; name: string; colors: string[] }[]>([]);
  const [fonts, setFonts] = useState<any[]>([]);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [newPaletteColors, setNewPaletteColors] = useState<string[]>(['#ffffff']);

  useEffect(() => {
    if (auth.currentUser) {
      loadCustomPalettes(auth.currentUser.uid).then(setPalettes);
      loadAssets(auth.currentUser.uid, 'font').then(setFonts);
    }
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      await exportAllData();
      setMessage({ type: 'success', text: 'Backup exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export backup.' });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setMessage({ type: 'error', text: 'Please select a .json backup file. .zip files are not supported for app backups.' });
      e.target.value = '';
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      await importData(file);
      setMessage({ type: 'success', text: 'Backup imported successfully! Your data has been restored.' });
      if (auth.currentUser) {
        const updatedPalettes = await loadCustomPalettes(auth.currentUser.uid);
        setPalettes(updatedPalettes);
        const updatedFonts = await loadAssets(auth.currentUser.uid, 'font');
        setFonts(updatedFonts);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: 'Failed to import backup. The file might be corrupted or in an invalid format.' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleCreatePalette = async () => {
    if (!auth.currentUser || !newPaletteName.trim() || newPaletteColors.length === 0) return;
    const newPalette = {
      id: Date.now().toString(),
      name: newPaletteName,
      colors: newPaletteColors
    };
    await saveCustomPalette(auth.currentUser.uid, newPalette);
    setPalettes([...palettes, newPalette]);
    setNewPaletteName('');
    setNewPaletteColors(['#ffffff']);
  };

  const handleDeletePalette = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteCustomPalette(auth.currentUser.uid, id);
    setPalettes(palettes.filter(p => p.id !== id));
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !auth.currentUser) return;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.endsWith('.ttf') && !file.name.endsWith('.otf')) {
          alert(`Skipping ${file.name}: Please upload a .ttf or .otf font file.`);
          continue;
        }
        await saveAsset(auth.currentUser.uid, 'font', file.name, file);
      }
      const updatedFonts = await loadAssets(auth.currentUser.uid, 'font');
      setFonts(updatedFonts);
    } catch (error) {
      console.error("Failed to upload font", error);
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteFont = async (id: string) => {
    try {
      await deleteAsset(id);
      setFonts(fonts.filter(f => f.id !== id));
    } catch (error) {
      console.error("Failed to delete font", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-4 text-[#1a201a]">Settings & Developer Guide</h1>
        <p className="text-[#7e9c7e]">
          Manage your local data, themes, and learn how to run this project locally.
        </p>
      </div>

      <section className="neo-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-[#7e9c7e]" />
          <h2 className="text-2xl font-bold text-[#1a201a]">Custom Palettes</h2>
        </div>
        <p className="text-[#7e9c7e] mb-6">
          Create custom color palettes to use in your widgets.
        </p>

        <div className="space-y-6">
          <div className="bg-white/30 backdrop-blur-sm p-5 rounded-xl border border-white/50 shadow-inner">
            <h3 className="text-[#1a201a] font-medium mb-4">Create New Palette</h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input 
                type="text" 
                placeholder="Palette Name" 
                value={newPaletteName}
                onChange={(e) => setNewPaletteName(e.target.value)}
                className="flex-1 neo-input"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {newPaletteColors.map((color, idx) => (
                  <ColorInput 
                    key={idx}
                    color={color}
                    onChange={(newColor) => {
                      const newC = [...newPaletteColors];
                      newC[idx] = newColor;
                      setNewPaletteColors(newC);
                    }}
                    onRemove={() => setNewPaletteColors(newPaletteColors.filter((_, i) => i !== idx))}
                    showRemove={newPaletteColors.length > 1}
                  />
                ))}
                <button 
                  onClick={() => setNewPaletteColors([...newPaletteColors, '#ffffff'])}
                  className="w-10 h-10 rounded border border-dashed border-[#7e9c7e]/40 flex items-center justify-center text-[#7e9c7e] hover:text-[#1a201a] hover:border-[#7e9c7e] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button 
              onClick={handleCreatePalette}
              disabled={!newPaletteName.trim() || newPaletteColors.length === 0}
              className="px-4 py-2 neo-button-primary"
            >
              Save Palette
            </button>
          </div>

          {palettes.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {palettes.map(palette => (
                <div key={palette.id} className="bg-white/30 backdrop-blur-sm p-4 rounded-xl border border-white/50 flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[#1a201a] font-medium">{palette.name}</h4>
                    <button onClick={() => handleDeletePalette(palette.id)} className="text-[#7e9c7e] hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {palette.colors.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/50 rounded-full pl-1 pr-2 py-1 border border-white/80 shadow-sm" title={c}>
                        <div className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: c }} />
                        <span className="text-[10px] text-[#7e9c7e] font-mono uppercase">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="neo-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Type className="w-6 h-6 text-[#7e9c7e]" />
          <h2 className="text-2xl font-bold text-[#1a201a]">Custom Fonts</h2>
        </div>
        <p className="text-[#7e9c7e] mb-6">
          Upload custom .ttf or .otf fonts to use in your widgets. These are stored locally.
        </p>

        <div className="space-y-6">
          <div className="relative">
            <input
              type="file"
              accept=".ttf,.otf"
              multiple
              onChange={handleFontUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full flex items-center justify-center gap-2 px-4 py-8 bg-white/30 border border-dashed border-[#7e9c7e]/40 rounded-xl text-[#7e9c7e] hover:text-[#1a201a] hover:border-[#7e9c7e] transition-colors">
              <Upload className="w-5 h-5" />
              <span>Click or drag to upload font(s) (.ttf, .otf)</span>
            </div>
          </div>

          {fonts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {fonts.map(font => (
                <div key={font.id} className="bg-white/30 backdrop-blur-sm p-4 rounded-xl border border-white/50 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-[#7e9c7e]" />
                    <span className="text-[#1a201a] truncate max-w-[200px]">{font.name}</span>
                  </div>
                  <button onClick={() => handleDeleteFont(font.id)} className="text-[#7e9c7e] hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="neo-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Save className="w-6 h-6 text-[#7e9c7e]" />
          <h2 className="text-2xl font-bold text-[#1a201a]">Local Storage & Backup</h2>
        </div>
        <p className="text-[#7e9c7e] mb-6">
          Your widgets, favorite colors, and settings are stored locally in your browser for faster access and offline support. You can backup your data to a file and restore it later.
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 border border-white/50 rounded-xl bg-white/30 shadow-sm">
            <h3 className="font-medium text-[#1a201a] mb-2">Export Backup</h3>
            <p className="text-sm text-[#7e9c7e] mb-4">
              Download a complete backup of all your locally stored widgets and settings.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full neo-button flex items-center justify-center gap-2 px-4 py-2 text-sm"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>

          <div className="p-5 border border-white/50 rounded-xl bg-white/30 shadow-sm">
            <h3 className="font-medium text-[#1a201a] mb-2">Import Backup</h3>
            <p className="text-sm text-[#7e9c7e] mb-4">
              Restore your widgets and settings from a previously exported backup file.
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                disabled={importing}
                className="w-full neo-button-primary flex items-center justify-center gap-2 px-4 py-2 text-sm"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="neo-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-[#7e9c7e]" />
          <h2 className="text-2xl font-bold text-[#1a201a]">Theme Settings</h2>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-[#1a201a]">Choose your preferred app theme:</p>
          <ThemeSwitcher />
        </div>
      </section>

      <section className="neo-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="w-6 h-6 text-[#7e9c7e]" />
          <h2 className="text-2xl font-bold text-[#1a201a]">Running Locally (npm environment)</h2>
        </div>
        <div className="space-y-4 text-[#1a201a]/80">
          <p>To run this project on your local machine, you'll need Node.js and npm installed.</p>
          
          <div className="bg-white/30 rounded-xl p-4 font-mono text-sm border border-white/50 overflow-x-auto custom-scrollbar shadow-inner">
            <p className="text-[#7e9c7e]"># 1. Clone or download the repository</p>
            <p className="text-emerald-600">git clone &lt;repository-url&gt;</p>
            <p className="text-emerald-600">cd kustomgen</p>
            <br />
            <p className="text-[#7e9c7e]"># 2. Install dependencies</p>
            <p className="text-emerald-600">npm install</p>
            <br />
            <p className="text-[#7e9c7e]"># 3. Set up environment variables (see below)</p>
            <p className="text-emerald-600">cp .env.example .env</p>
            <br />
            <p className="text-[#7e9c7e]"># 4. Start the development server</p>
            <p className="text-emerald-600">npm run dev</p>
          </div>
        </div>
      </section>

      <section className="neo-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Code2 className="w-6 h-6 text-[#7e9c7e]" />
          <h2 className="text-2xl font-bold text-[#1a201a]">Environment Variables</h2>
        </div>
        <div className="space-y-4 text-[#1a201a]/80">
          <p>Create a <code>.env</code> file in the root of your project with the following variables:</p>
          
          <div className="bg-white/30 rounded-xl p-4 font-mono text-sm border border-white/50 overflow-x-auto custom-scrollbar shadow-inner">
            <p className="text-indigo-600 whitespace-nowrap">VITE_GEMINI_API_KEY=<span className="text-[#7e9c7e]">your_gemini_api_key_here</span></p>
          </div>
          <p className="text-sm text-[#7e9c7e] mt-2">
            Note: Firebase configuration is handled via the <code>firebase-applet-config.json</code> file.
          </p>
        </div>
      </section>

      <section className="neo-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Github className="w-6 h-6 text-[#1a201a]" />
          <h2 className="text-2xl font-bold text-[#1a201a]">Uploading to GitHub</h2>
        </div>
        <div className="space-y-4 text-[#1a201a]/80">
          <p>If you are using Google AI Studio, you can export this project directly to GitHub using the export menu in the top right corner.</p>
          <p>To manually upload this project to GitHub from your local machine, run the following commands in your terminal:</p>
          
          <div className="bg-white/30 rounded-xl p-4 font-mono text-sm border border-white/50 overflow-x-auto custom-scrollbar shadow-inner">
            <p className="text-[#7e9c7e]"># Initialize a new git repository</p>
            <p className="text-emerald-600">git init</p>
            <br />
            <p className="text-[#7e9c7e]"># Add all files (respects .gitignore)</p>
            <p className="text-emerald-600">git add .</p>
            <br />
            <p className="text-[#7e9c7e]"># Commit your changes</p>
            <p className="text-emerald-600">git commit -m "Initial commit"</p>
            <br />
            <p className="text-[#7e9c7e]"># Link to your GitHub repository</p>
            <p className="text-emerald-600">git remote add origin https://github.com/yourusername/your-repo-name.git</p>
            <br />
            <p className="text-[#7e9c7e]"># Push to the main branch</p>
            <p className="text-emerald-600">git branch -M main</p>
            <p className="text-emerald-600">git push -u origin main</p>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <h4 className="font-bold text-yellow-600 mb-2">Important Security Note</h4>
            <p className="text-sm text-yellow-700/70">
              Never commit your <code>.env</code> file or <code>firebase-applet-config.json</code> to GitHub if they contain sensitive production keys. The <code>.gitignore</code> file is already configured to ignore <code>.env</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
