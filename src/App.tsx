import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { WidgetFeatuator } from './components/WidgetFeatuator';
import { WidgetVistory } from './components/WidgetVistory';
import { WidgetView } from './components/WidgetView';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { SettingsPage } from './pages/SettingsPage';
import { Layers } from 'lucide-react';
import { AuthButton } from './components/Auth';
import { WidgetProvider } from './context/WidgetContext';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import { TaskHub } from './components/TaskHub';

function GeneratorPage({ user, refreshTrigger, setRefreshTrigger }: { user: User | null, refreshTrigger: number, setRefreshTrigger: React.Dispatch<React.SetStateAction<number>> }) {
  const location = useLocation();
  const editWidget = location.state?.editWidget;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-[#1a201a]">Widget Featuator</h2>
        <p className="text-[#7e9c7e]">Describe your widget and let AI build it for you.</p>
      </div>
      
      {user ? (
        <WidgetFeatuator key={location.key} onWidgetGenerated={() => setRefreshTrigger(prev => prev + 1)} editWidget={editWidget} />
      ) : (
        <div className="max-w-4xl mx-auto p-12 neo-card text-center">
          <Layers className="w-12 h-12 text-[#7e9c7e]/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-[#1a201a]">Sign in to start generating</h3>
          <p className="text-[#7e9c7e] mb-6">You need to be signed in to generate and save your widgets.</p>
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
        <h2 className="text-3xl font-bold mb-2 text-[#1a201a]">Your Vistory</h2>
        <p className="text-[#7e9c7e]">View, share, and export your previously generated widgets.</p>
      </div>
      
      {user ? (
        <WidgetVistory refreshTrigger={refreshTrigger} user={user} />
      ) : (
        <div className="max-w-4xl mx-auto p-12 neo-card text-center">
          <Layers className="w-12 h-12 text-[#7e9c7e]/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-[#1a201a]">Sign in to view history</h3>
          <p className="text-[#7e9c7e] mb-6">You need to be signed in to view your saved widgets.</p>
          <div className="flex justify-center">
            <AuthButton user={user} />
          </div>
        </div>
      )}
    </div>
  );
}

import { Toaster } from 'sonner';

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
      <div className="min-h-screen bg-[#eef2ee] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7e9c7e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TaskProvider>
      <ThemeProvider>
        <WidgetProvider>
          <Toaster position="top-center" richColors />
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
          <TaskHub />
        </WidgetProvider>
      </ThemeProvider>
    </TaskProvider>
  );
}
