import React, { useState } from 'react';
import { Download, Upload, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { exportAllData, importData } from '../utils/backupRestore';
import { auth } from '../firebase';

export function SettingsView() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import backup. Invalid file format.' });
    } finally {
      setImporting(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Save className="w-5 h-5 text-indigo-600" />
          Local Storage & Backup
        </h2>
        <p className="text-gray-600 mb-6">
          Your widgets, favorite colors, and settings are now stored locally in your browser for faster access and offline support. You can backup your data to a file and restore it later.
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-2">Export Backup</h3>
            <p className="text-sm text-gray-500 mb-4">
              Download a complete backup of all your locally stored widgets and settings.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>

          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-2">Import Backup</h3>
            <p className="text-sm text-gray-500 mb-4">
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
        <div className="flex items-center gap-4">
          {auth.currentUser?.photoURL ? (
            <img src={auth.currentUser.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {auth.currentUser?.email?.[0].toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{auth.currentUser?.displayName || 'User'}</p>
            <p className="text-sm text-gray-500">{auth.currentUser?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
