import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Wand2, History, Settings, Layers } from 'lucide-react';
import { AuthButton } from './Auth';
import { ThemeSwitcher } from './ThemeSwitcher';
import { User } from 'firebase/auth';
import { BackgroundProcesses } from './BackgroundProcesses';

export function Layout({ children, user }: { children: React.ReactNode, user: User | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Featuator', path: '/generator', icon: Wand2 },
    { name: 'Vistory', path: '/history', icon: History },
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
    <div className="min-h-screen bg-[#f5f7f5] text-[#1a201a] font-sans selection:bg-[#7e9c7e]/30">
      <header className="border-b border-white/50 bg-white/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="neo-button p-2 text-[#7e9c7e] hover:text-[#1a201a] transition-all"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#7e9c7e] rounded-xl flex items-center justify-center shadow-lg shadow-[#7e9c7e]/20">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a201a] tracking-tight hidden sm:block">kustomgen</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <AuthButton user={user} />
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div 
            className="fixed inset-0 bg-[#1a201a]/20 backdrop-blur-sm" 
            onClick={() => setIsMenuOpen(false)}
          />
          <nav className="relative w-80 max-w-sm bg-[#f5f7f5] h-full border-r border-white/50 p-8 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-[#7e9c7e] rounded-xl flex items-center justify-center shadow-lg shadow-[#7e9c7e]/20">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a201a] tracking-tight">kustomgen</h1>
            </div>
            
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'neo-button bg-[#7e9c7e] text-white font-bold shadow-lg shadow-[#7e9c7e]/20' 
                      : 'text-[#7e9c7e] hover:bg-[#7e9c7e]/10 hover:text-[#1a201a] font-bold'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-lg">{link.name}</span>
                </Link>
              );
            })}

            <div className="mt-auto p-6 neo-card bg-white/30 backdrop-blur-sm">
              <p className="text-xs font-bold text-[#7e9c7e] uppercase tracking-widest mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-[#1a201a]">System Online</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/50 flex justify-around p-4 sm:hidden z-50 shadow-lg">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-[#7e9c7e] scale-110' : 'text-[#7e9c7e]/40 hover:text-[#7e9c7e]'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-32 sm:pb-16 flex justify-center w-full">
        <div className="w-full">
          {children}
        </div>
      </main>
      <BackgroundProcesses />
    </div>
  );
}
