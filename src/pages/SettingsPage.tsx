import React from 'react';
import { Github, Terminal, HardDrive, Code2 } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Settings & Developer Guide</h1>
        <p className="text-neutral-400">
          Learn how to run this project locally, manage environment variables, and deploy it to GitHub.
        </p>
      </div>

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Running Locally (npm environment)</h2>
        </div>
        <div className="space-y-4 text-neutral-300">
          <p>To run this project on your local machine, you'll need Node.js and npm installed.</p>
          
          <div className="bg-neutral-950 rounded-xl p-4 font-mono text-sm border border-neutral-800">
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
          
          <div className="bg-neutral-950 rounded-xl p-4 font-mono text-sm border border-neutral-800">
            <p className="text-indigo-300">VITE_GEMINI_API_KEY=<span className="text-neutral-500">your_gemini_api_key_here</span></p>
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
          
          <div className="bg-neutral-950 rounded-xl p-4 font-mono text-sm border border-neutral-800">
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
