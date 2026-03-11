import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ApiKeySelector } from './components/ApiKeySelector';
import { WidgetGenerator } from './components/WidgetGenerator';
import { WidgetHistory } from './components/WidgetHistory';
import { WidgetView } from './components/WidgetView';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { SettingsPage } from './pages/SettingsPage';
import { Layers } from 'lucide-react';
import { AuthButton } from './components/Auth';

function GeneratorPage({ user, refreshTrigger, setRefreshTrigger }: { user: User | null, refreshTrigger: number, setRefreshTrigger: React.Dispatch<React.SetStateAction<number>> }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Widget Generator</h2>
        <p className="text-neutral-400">Describe your widget and let AI build it for you.</p>
      </div>
      
      {user ? (
        <WidgetGenerator onWidgetGenerated={() => setRefreshTrigger(prev => prev + 1)} />
      ) : (
        <div className="max-w-4xl mx-auto p-12 bg-neutral-900 rounded-2xl border border-neutral-800 text-center">
          <Layers className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sign in to start generating</h3>
          <p className="text-neutral-400 mb-6">You need to be signed in to generate and save your widgets.</p>
          <div className="flex justify-center">
            <AuthButton user={user} />
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryPage({ user, refreshTrigger }: { user: User | null, refreshTrigger: number }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Your Widgets</h2>
        <p className="text-neutral-400">View, share, and export your previously generated widgets.</p>
      </div>
      
      {user ? (
        <WidgetHistory refreshTrigger={refreshTrigger} />
      ) : (
        <div className="max-w-4xl mx-auto p-12 bg-neutral-900 rounded-2xl border border-neutral-800 text-center">
          <Layers className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sign in to view history</h3>
          <p className="text-neutral-400 mb-6">You need to be signed in to view your saved widgets.</p>
          <div className="flex justify-center">
            <AuthButton user={user} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/generator" element={<GeneratorPage user={user} refreshTrigger={refreshTrigger} setRefreshTrigger={setRefreshTrigger} />} />
        <Route path="/history" element={<HistoryPage user={user} refreshTrigger={refreshTrigger} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/widget/:id" element={<WidgetView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
