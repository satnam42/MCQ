import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const ResultSummaryModal = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center space-x-3 text-amber-600 mb-4">
          <AlertTriangle className="w-8 h-8 shrink-0 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900">Are you sure you want to submit?</h3>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Once submitted, you will not be able to modify your answers for this test session.
        </p>

        {/* Summary Breakdown Cards */}
        <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Total Questions:</span>
            <span className="font-bold text-slate-900">{totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-emerald-700 font-medium">Answered:</span>
            <span className="font-bold text-emerald-700">{answeredCount}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Unanswered:</span>
            <span className="font-bold text-slate-700">{unansweredCount}</span>
          </div>
          {markedCount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-purple-700 font-medium">Marked for Review:</span>
              <span className="font-bold text-purple-700">{markedCount}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Back to Test
          </button>
          <button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Submit Test</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResultSummaryModal;
