import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 animate-bounce-short">
      <div
        className={`
          flex items-start p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300
          ${isSuccess
            ? 'bg-emerald-900/90 text-white border-emerald-700 shadow-emerald-900/20'
            : 'bg-rose-900/90 text-white border-rose-700 shadow-rose-900/20'
          }
        `}
      >
        <div className="shrink-0 mr-3 mt-0.5">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400" />
          )}
        </div>

        <div className="flex-1 text-sm font-medium pr-2 leading-relaxed">
          {toast.message}
        </div>

        <button
          onClick={onClose}
          type="button"
          className="shrink-0 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
