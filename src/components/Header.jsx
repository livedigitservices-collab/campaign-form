import React from 'react';
import { FormInput as FormIcon, CheckCircle2, AlertCircle, Settings, FileText, Megaphone } from 'lucide-react';

export default function Header({ webAppUrl, onOpenSettings, activeTab = 'campaign', onSelectTab }) {
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
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Campaign Portal
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Google Sheets Direct Sync
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {onSelectTab && (
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => onSelectTab('campaign')}
              className={`
                flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${activeTab === 'campaign' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Campaign Entry</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('review')}
              className={`
                flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${activeTab === 'review' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daily Review & Feedback</span>
            </button>
          </nav>
        )}

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
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> URL Needed
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
