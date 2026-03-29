import React, { useState, useEffect } from 'react';
import { Github, Terminal, HardDrive, Code2, Palette, Download, Upload, Loader2, Save, AlertCircle, CheckCircle2, Type, Trash2, Plus, X } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { exportAllData, importData } from '../utils/backupRestore';
import { auth } from '../firebase';
import { loadCustomPalettes, saveCustomPalette, deleteCustomPalette, loadAssets, saveAsset, deleteAsset } from '../services/firestore';

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

    setImporting(true);
    setMessage(null);
    try {
      await importData(file);
      setMessage({ type: 'success', text: 'Backup imported successfully! Refresh to see changes.' });
      if (auth.currentUser) {
        loadCustomPalettes(auth.currentUser.uid).then(setPalettes);
        loadAssets(auth.currentUser.uid, 'font').then(setFonts);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import backup. Invalid file format.' });
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
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    
    if (!file.name.endsWith('.ttf') && !file.name.endsWith('.otf')) {
      alert('Please upload a .ttf or .otf font file.');
      return;
    }

    try {
      await saveAsset(auth.currentUser.uid, 'font', file.name, file);
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
        <h1 className="text-3xl font-bold mb-4">Settings & Developer Guide</h1>
        <p className="text-neutral-400">
          Manage your local data, themes, and learn how to run this project locally.
        </p>
      </div>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold">Custom Palettes</h2>
        </div>
        <p className="text-neutral-400 mb-6">
          Create custom color palettes to use in your widgets.
        </p>

        <div className="space-y-6">
          <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <h3 className="text-white font-medium mb-4">Create New Palette</h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input 
                type="text" 
                placeholder="Palette Name" 
                value={newPaletteName}
                onChange={(e) => setNewPaletteName(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {newPaletteColors.map((color, idx) => (
                  <div key={idx} className="relative group">
                    <input 
                      type="color" 
                      value={color}
                      onChange={(e) => {
                        const newC = [...newPaletteColors];
                        newC[idx] = e.target.value;
                        setNewPaletteColors(newC);
                      }}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    {newPaletteColors.length > 1 && (
                      <button 
                        onClick={() => setNewPaletteColors(newPaletteColors.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setNewPaletteColors([...newPaletteColors, '#ffffff'])}
                  className="w-10 h-10 rounded border border-dashed border-neutral-600 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-400 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button 
              onClick={handleCreatePalette}
              disabled={!newPaletteName.trim() || newPaletteColors.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Save Palette
            </button>
          </div>

          {palettes.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {palettes.map(palette => (
                <div key={palette.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-white font-medium">{palette.name}</h4>
                    <button onClick={() => handleDeletePalette(palette.id)} className="text-neutral-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {palette.colors.map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-neutral-700" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Type className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold">Custom Fonts</h2>
        </div>
        <p className="text-neutral-400 mb-6">
          Upload custom .ttf or .otf fonts to use in your widgets. These are stored locally.
        </p>

        <div className="space-y-6">
          <div className="relative">
            <input
              type="file"
              accept=".ttf,.otf"
              onChange={handleFontUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full flex items-center justify-center gap-2 px-4 py-8 bg-neutral-950 border border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors">
              <Upload className="w-5 h-5" />
              <span>Click or drag to upload font (.ttf, .otf)</span>
            </div>
          </div>

          {fonts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {fonts.map(font => (
                <div key={font.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-neutral-500" />
                    <span className="text-white truncate max-w-[200px]">{font.name}</span>
                  </div>
                  <button onClick={() => handleDeleteFont(font.id)} className="text-neutral-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Save className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold">Local Storage & Backup</h2>
        </div>
        <p className="text-neutral-400 mb-6">
          Your widgets, favorite colors, and settings are stored locally in your browser for faster access and offline support. You can backup your data to a file and restore it later.
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
          <div className="p-5 border border-neutral-800 rounded-xl bg-neutral-950">
            <h3 className="font-medium text-white mb-2">Export Backup</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Download a complete backup of all your locally stored widgets and settings.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>

          <div className="p-5 border border-neutral-800 rounded-xl bg-neutral-950">
            <h3 className="font-medium text-white mb-2">Import Backup</h3>
            <p className="text-sm text-neutral-500 mb-4">
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold">Theme Settings</h2>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-neutral-300">Choose your preferred app theme:</p>
          <ThemeSwitcher />
        </div>
      </section>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Running Locally (npm environment)</h2>
        </div>
        <div className="space-y-4 text-neutral-300">
          <p>To run this project on your local machine, you'll need Node.js and npm installed.</p>
          
          <div className="bg-neutral-950 rounded-xl p-4 font-mono text-sm border border-neutral-800 overflow-x-auto custom-scrollbar">
            <p className="text-neutral-500"># 1. Clone or download the repository</p>
            <p className="text-emerald-400">git clone &lt;repository-url&gt;</p>
            <p className="text-emerald-400">cd kustomgen</p>
            <br />
            <p className="text-neutral-500"># 2. Install dependencies</p>
            <p className="text-emerald-400">npm install</p>
            <br />
            <p className="text-neutral-500"># 3. Set up environment variables (see below)</p>
            <p className="text-emerald-400">cp .env.example .env</p>
            <br />
            <p className="text-neutral-500"># 4. Start the development server</p>
            <p className="text-emerald-400">npm run dev</p>
          </div>
        </div>
      </section>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Code2 className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">Environment Variables</h2>
        </div>
        <div className="space-y-4 text-neutral-300">
          <p>Create a <code>.env</code> file in the root of your project with the following variables:</p>
          
          <div className="bg-neutral-950 rounded-xl p-4 font-mono text-sm border border-neutral-800 overflow-x-auto custom-scrollbar">
            <p className="text-indigo-300 whitespace-nowrap">VITE_GEMINI_API_KEY=<span className="text-neutral-500">your_gemini_api_key_here</span></p>
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            Note: Firebase configuration is handled via the <code>firebase-applet-config.json</code> file.
          </p>
        </div>
      </section>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Github className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-bold text-white">Uploading to GitHub</h2>
        </div>
        <div className="space-y-4 text-neutral-300">
          <p>If you are using Google AI Studio, you can export this project directly to GitHub using the export menu in the top right corner.</p>
          <p>To manually upload this project to GitHub from your local machine, run the following commands in your terminal:</p>
          
          <div className="bg-neutral-950 rounded-xl p-4 font-mono text-sm border border-neutral-800 overflow-x-auto custom-scrollbar">
            <p className="text-neutral-500"># Initialize a new git repository</p>
            <p className="text-emerald-400">git init</p>
            <br />
            <p className="text-neutral-500"># Add all files (respects .gitignore)</p>
            <p className="text-emerald-400">git add .</p>
            <br />
            <p className="text-neutral-500"># Commit your changes</p>
            <p className="text-emerald-400">git commit -m "Initial commit"</p>
            <br />
            <p className="text-neutral-500"># Link to your GitHub repository</p>
            <p className="text-emerald-400">git remote add origin https://github.com/yourusername/your-repo-name.git</p>
            <br />
            <p className="text-neutral-500"># Push to the main branch</p>
            <p className="text-emerald-400">git branch -M main</p>
            <p className="text-emerald-400">git push -u origin main</p>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <h4 className="font-bold text-yellow-500 mb-2">Important Security Note</h4>
            <p className="text-sm text-yellow-200/70">
              Never commit your <code>.env</code> file or <code>firebase-applet-config.json</code> to GitHub if they contain sensitive production keys. The <code>.gitignore</code> file is already configured to ignore <code>.env</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
