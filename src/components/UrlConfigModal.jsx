import React, { useState } from 'react';
import { X, ExternalLink, Key, Check } from 'lucide-react';

export default function UrlConfigModal({ isOpen, onClose, currentUrl, onSave }) {
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSave(urlInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Google Apps Script Connection</h3>
            <p className="text-xs text-slate-500">Configure Web App URL for Google Sheets Sync</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="scriptUrl" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Web App URL
            </label>
            <input
              id="scriptUrl"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-800"
              required
            />
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Obtain this URL by deploying your Google Apps Script as a <b>Web App</b> with access set to <b>"Anyone"</b>.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center">
              💡 Setup Tip:
            </p>
            <p className="text-amber-700">
              You can also set <code>VITE_APPS_SCRIPT_URL</code> inside a <code>.env</code> file in your project root.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Web App URL</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
