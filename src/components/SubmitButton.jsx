import React from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function SubmitButton({ isSubmitting, disabled }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting || disabled}
      className={`
        w-full py-3.5 px-6 rounded-xl font-semibold text-sm shadow-md transition-all duration-200
        flex items-center justify-center space-x-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${isSubmitting || disabled
          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.99]'
        }
      `}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Submitting...</span>
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          <span>Submit Details</span>
        </>
      )}
    </button>
  );
}
