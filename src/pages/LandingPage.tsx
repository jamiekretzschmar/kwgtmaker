import React from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Layers, Download, Github, Terminal } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
          Design KWGT Widgets with <span className="text-indigo-400">AI</span>
        </h1>
        <p className="text-xl text-neutral-400 mb-10">
          Describe your dream widget, and we'll generate a high-fidelity mockup, step-by-step instructions, and the exact KWGT formulas you need to build it.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/generator"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-lg shadow-lg shadow-indigo-500/20"
          >
            <Wand2 className="w-5 h-5" />
            Start Generating
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">1. Describe</h3>
          <p className="text-neutral-400">
            Tell the AI what kind of widget you want. Be specific about the style (e.g., Neumorphism, Glassmorphism) and the data you want to display.
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
            <Wand2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">2. Generate</h3>
          <p className="text-neutral-400">
            Our AI will generate a visual mockup, provide step-by-step instructions, and output the exact KWGT Kodes and formulas needed.
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
            <Download className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">3. Export</h3>
          <p className="text-neutral-400">
            Export your widget as a .kwgt file, complete with custom fonts, icons, and bitmaps, ready to be imported into the KWGT app.
          </p>
        </div>
      </section>

      <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-12">
        <h2 className="text-3xl font-bold text-white mb-6">How to import into KWGT</h2>
        <div className="space-y-4 text-neutral-300">
          <p>1. Download the generated <strong>.kwgt</strong> file from the Generator or History page.</p>
          <p>2. Transfer the file to your Android device (if you generated it on a PC).</p>
          <p>3. Add an empty KWGT widget to your Android home screen.</p>
          <p>4. Tap the empty widget to open the KWGT editor.</p>
          <p>5. Tap the <strong>Folder icon</strong> (Import) at the top of the screen.</p>
          <p>6. Locate and select the downloaded .kwgt file.</p>
          <p>7. The widget will appear in your "Exported" list. Tap it to load it into the editor.</p>
          <p>8. Make any necessary adjustments and tap the <strong>Save icon</strong>.</p>
        </div>
      </section>
    </div>
  );
}
