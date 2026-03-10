import React, { useState } from 'react';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, LogOut, AlertCircle } from 'lucide-react';

export function AuthButton({ user }: { user: any }) {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Login failed:', err);
      
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Domain not authorized. If you are using an IP address (like 192.168.x.x) on your phone, you must add it to the Authorized Domains in your Firebase Console (Authentication > Settings > Authorized domains).`);
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/popup-blocked') {
        // Fallback to redirect on mobile if popup is blocked or closes immediately
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: any) {
          setError(`Login failed: ${redirectErr.message}`);
        }
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
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium hidden sm:block">{user.displayName || user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
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
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Sign In with Google
      </button>
      {error && (
        <div className="absolute top-20 right-4 max-w-sm bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-start gap-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-red-300">Authentication Error</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs text-left mt-1 underline">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
