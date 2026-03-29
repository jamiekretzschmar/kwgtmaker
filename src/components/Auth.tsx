import React, { useState } from 'react';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, LogOut, AlertCircle } from 'lucide-react';

export function AuthButton({ user }: { user: any }) {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Login failed:', err);
      
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`Domain not authorized. You must add "${currentDomain}" to the Authorized Domains in your Firebase Console (Authentication > Settings > Authorized domains).`);
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/popup-blocked') {
        setError(`Popup blocked or closed. Please ensure your browser allows popups for this site, or try opening the app in a new tab.`);
      } else {
        setError(`Login failed: ${err.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 neo-card bg-white/50">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-[#7e9c7e]" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 bg-[#7e9c7e] rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user.email?.[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-bold text-[#1a201a] hidden sm:block">{user.displayName || user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="neo-button flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#7e9c7e] hover:text-red-500"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLogin}
        className="neo-button-primary flex items-center gap-2 px-6 py-2.5 text-sm font-bold"
      >
        <LogIn className="w-4 h-4" />
        Sign In with Google
      </button>
      {error && (
        <div className="fixed top-24 right-6 max-w-sm bg-white/90 backdrop-blur-md border-2 border-red-500/30 text-red-700 px-6 py-4 rounded-2xl text-sm flex items-start gap-4 shadow-2xl z-[100] animate-in fade-in slide-in-from-right-8 duration-500">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-500" />
          <div className="flex flex-col gap-2">
            <span className="font-bold text-red-600 text-base uppercase tracking-wider">Authentication Error</span>
            <span className="font-medium leading-relaxed">{error}</span>
            <button onClick={() => setError(null)} className="neo-button px-3 py-1 text-xs font-bold self-start mt-2">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
