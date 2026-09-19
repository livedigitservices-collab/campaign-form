import React from 'react';
import { FormInput as FormIcon, Link2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

export default function Header({ webAppUrl, onOpenSettings }) {
  const isUrlConfigured = Boolean(webAppUrl && webAppUrl.trim());

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <FormIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Campaign Entry Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Google Sheets Direct Sync
            </p>
          </div>
        </div>

        {/* Apps Script URL status & settings trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSettings}
            type="button"
            className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            title="Configure Google Apps Script Web App URL"
          >
            {isUrlConfigured ? (
              <span className="flex items-center text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connected
              </span>
            ) : (
              <span className="flex items-center text-amber-600 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Script URL Needed
              </span>
            )}
            <span className="text-slate-300">|</span>
            <Settings className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
