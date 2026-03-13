import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Wand2, History, Settings, Layers } from 'lucide-react';
import { AuthButton } from './Auth';
import { User } from 'firebase/auth';

export function Layout({ children, user }: { children: React.ReactNode, user: User | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Generator', path: '/generator', icon: Wand2 },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  React.useEffect(() => {
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors hidden sm:block"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">KustomGen</h1>
            </Link>
          </div>
          <AuthButton user={user} />
        </div>
      </header>

      {/* Sidebar Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex hidden sm:flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsMenuOpen(false)}
          />
          <nav className="relative w-64 max-w-sm bg-neutral-900 h-full border-r border-neutral-800 p-6 flex flex-col gap-2 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">KustomGen</h1>
            </div>
            
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-indigo-600/10 text-indigo-400 font-medium' 
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex justify-around p-3 sm:hidden z-50 pb-safe">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-1 ${
                isActive ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 sm:pb-12">
        {children}
      </main>
    </div>
  );
}
