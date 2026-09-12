import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

const ResetConfirmationModal = ({ isOpen, onClose, onConfirmReset, isResetting = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative scale-100 animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          disabled={isResetting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 text-rose-600">
          <div className="p-3 bg-rose-100 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reset Test Session?</h3>
            <p className="text-xs text-slate-500">This action cannot be undone</p>
          </div>
        </div>

        <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
          Are you sure you want to reset this test? All your current answers and progress will be lost.
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={onConfirmReset}
            disabled={isResetting}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isResetting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Reset Test</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResetConfirmationModal;
