import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CustomerForm from '../components/CustomerForm';
import ToastNotification from '../components/ToastNotification';
import UrlConfigModal from '../components/UrlConfigModal';
import { submitToGoogleSheets } from '../services/googleSheets';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

const DEFAULT_WEB_APP_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

export default function Home() {
  const [webAppUrl, setWebAppUrl] = useState(() => {
    return localStorage.getItem('google_apps_script_url') || DEFAULT_WEB_APP_URL;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSaveUrl = (newUrl) => {
    setWebAppUrl(newUrl);
    localStorage.setItem('google_apps_script_url', newUrl);
  };

  const handleFormSubmit = async (formData, resetForm) => {
    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await submitToGoogleSheets(webAppUrl, formData);
      if (response.success) {
        setToast({
          type: 'success',
          message: 'Details submitted successfully.',
        });
        resetForm();
      } else {
        setToast({
          type: 'error',
          message: response.message || 'Unable to submit the details. Please try again.',
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Unable to submit the details. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Page Banner / Hero Intro */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer & Campaign Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Submit Campaign Details
          </h2>
          <p className="text-sm text-slate-500">
            Fill out the customer and campaign parameters below. Submissions sync directly to your connected Google Sheet.
          </p>
        </div>

        {/* Centered Form Card */}
        <div className="max-w-3xl mx-auto">
          <CustomerForm
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            isUrlConfigured={Boolean(webAppUrl && webAppUrl.trim())}
            onOpenSettings={() => setIsSettingsOpen(true)}
            webAppUrl={webAppUrl}
          />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>Customer & Campaign Entry Portal • Powered by React & Google Apps Script</p>
      </footer>

      {/* Modal and Toast */}
      <UrlConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUrl={webAppUrl}
        onSave={handleSaveUrl}
      />

      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
