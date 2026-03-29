import React from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Layers, Download, Github, Terminal } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-[#1a201a] tracking-tight mb-6">
          Design KWGT Widgets with <span className="text-[#7e9c7e]">AI</span>
        </h1>
        <p className="text-xl text-[#7e9c7e] mb-10">
          Describe your dream widget, and we'll generate a high-fidelity mockup, step-by-step instructions, and the exact KWGT formulas you need to build it.
        </p>
        <div className="flex justify-center gap-4 flex-col items-center">
          <Link
            to="/generator"
            className="px-8 py-4 neo-button-primary text-white font-semibold rounded-xl transition-all flex items-center gap-2 text-lg"
          >
            <Wand2 className="w-5 h-5" />
            Start Generating
          </Link>
          <span className="text-[10px] text-[#7e9c7e]/50 font-mono mt-4">v1.0.5-updated</span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="neo-card p-8">
          <div className="w-12 h-12 bg-[#7e9c7e]/10 rounded-xl flex items-center justify-center mb-6">
            <Layers className="w-6 h-6 text-[#7e9c7e]" />
          </div>
          <h3 className="text-xl font-bold text-[#1a201a] mb-3">1. Describe</h3>
          <p className="text-[#7e9c7e]">
            Tell the AI what kind of widget you want. Be specific about the style (e.g., Neumorphism, Glassmorphism) and the data you want to display.
          </p>
        </div>
        <div className="neo-card p-8">
          <div className="w-12 h-12 bg-[#7e9c7e]/10 rounded-xl flex items-center justify-center mb-6">
            <Wand2 className="w-6 h-6 text-[#7e9c7e]" />
          </div>
          <h3 className="text-xl font-bold text-[#1a201a] mb-3">2. Generate</h3>
          <p className="text-[#7e9c7e]">
            Our AI will generate a visual mockup, provide step-by-step instructions, and output the exact KWGT Kodes and formulas needed.
          </p>
        </div>
        <div className="neo-card p-8">
          <div className="w-12 h-12 bg-[#7e9c7e]/10 rounded-xl flex items-center justify-center mb-6">
            <Download className="w-6 h-6 text-[#7e9c7e]" />
          </div>
          <h3 className="text-xl font-bold text-[#1a201a] mb-3">3. Export</h3>
          <p className="text-[#7e9c7e]">
            Export your widget as a .kwgt file, complete with custom fonts, icons, and bitmaps, ready to be imported into the KWGT app.
          </p>
        </div>
      </section>

      <section className="neo-card p-8 md:p-12">
        <h2 className="text-3xl font-bold text-[#1a201a] mb-6">How to import into KWGT</h2>
        <div className="space-y-4 text-[#1a201a]/80">
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
