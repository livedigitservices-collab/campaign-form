import React, { useState } from 'react';
import Header from '../components/Header';
import DailyReviewForm from '../components/DailyReviewForm';
import ToastNotification from '../components/ToastNotification';
import UrlConfigModal from '../components/UrlConfigModal';
import { submitToGoogleSheets } from '../services/googleSheets';
import { Sparkles, PhoneCall, FileText, CheckCircle2 } from 'lucide-react';

const DEFAULT_CAMPAIGN_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';
const DEFAULT_REVIEW_URL = import.meta.env.VITE_APPS_SCRIPT_REVIEW_URL || DEFAULT_CAMPAIGN_URL;

export default function DailyReviewPage({ activeTab, onSelectTab }) {
  const [reviewUrl, setReviewUrl] = useState(() => {
    return localStorage.getItem('google_apps_script_review_url') || DEFAULT_REVIEW_URL;
  });

  const campaignUrl = localStorage.getItem('google_apps_script_url') || DEFAULT_CAMPAIGN_URL;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSaveReviewUrl = (newUrl) => {
    setReviewUrl(newUrl);
    localStorage.setItem('google_apps_script_review_url', newUrl);
  };

  const handleFormSubmit = async (formData, resetForm) => {
    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await submitToGoogleSheets(reviewUrl, formData);
      if (response.success) {
        setToast({
          type: 'success',
          message: 'Daily Review & Feedback saved to Review Google Sheet successfully!',
        });
        resetForm();
      } else {
        setToast({
          type: 'error',
          message: response.message || 'Unable to store daily review. Please try again.',
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Unable to store daily review. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        webAppUrl={reviewUrl}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Page Banner / Hero Intro */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dedicated Review & Feedback Sheet Integration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Client Daily Review & Call Portal
          </h2>
          <p className="text-sm text-slate-500">
            Select team member & client to auto-populate customer details, call clients directly, and store daily reviews & feedback into your separate Review Google Sheet.
          </p>
        </div>

        {/* Centered Form Card */}
        <div className="max-w-3xl mx-auto">
          <DailyReviewForm
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            isUrlConfigured={Boolean(reviewUrl && reviewUrl.trim())}
            onOpenSettings={() => setIsSettingsOpen(true)}
            campaignUrl={campaignUrl}
          />
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs flex items-center space-x-3 text-slate-600">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-slate-900">Campaign Client Lookup</p>
              <p className="text-slate-500">Pulls clients from Campaign Sheet</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs flex items-center space-x-3 text-slate-600">
            <PhoneCall className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-slate-900">Direct Calling</p>
              <p className="text-slate-500">Instant dialer link for phone numbers</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-2xs flex items-center space-x-3 text-slate-600">
            <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-slate-900">Dedicated Review Sheet</p>
              <p className="text-slate-500">Stores only review & feedback history</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>Daily Client Review Portal • Powered by React & Dedicated Review Google Sheet</p>
      </footer>

      {/* Settings Modal and Toast */}
      <UrlConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUrl={reviewUrl}
        onSave={handleSaveReviewUrl}
        title="Review & Feedback Sheet Web App Connection"
        subtitle="Configure Web App URL for storing Daily Reviews & Feedback"
        envVarName="VITE_APPS_SCRIPT_REVIEW_URL"
      />

      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
