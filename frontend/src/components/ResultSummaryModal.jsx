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
  submitError,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-gurmukhi">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center space-x-3 text-amber-600 mb-4">
          <AlertTriangle className="w-8 h-8 shrink-0 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900">
            {submitError ? 'ਟੈਸਟ ਜਮ੍ਹਾਂ ਕਰਨ ਵਿੱਚ ਅਸਮਰੱਥ (Submission Issue)' : 'ਕੀ ਤੁਸੀਂ ਟੈਸਟ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?'}
          </h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          {submitError
            ? 'ਤੁਹਾਡੇ ਉੱਤਰ ਸੁਰੱਖਿਅਤ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਦਿੱਤੇ ਬਟਨ ਤੋਂ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
            : 'Once submitted, you will not be able to modify your answers for this test session.'}
        </p>

        {submitError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold space-y-1">
            <p className="font-bold text-rose-800">{submitError}</p>
            <p className="text-[11px] text-rose-600 font-normal">
              Your answers remain saved. Click "Try Again" to retry submission.
            </p>
          </div>
        )}

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
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Back to Test
          </button>
          <button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center space-x-2 ${
              submitError
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <span>Submitting... (ਜਮ੍ਹਾਂ ਹੋ ਰਿਹਾ ਹੈ...)</span>
            ) : submitError ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Try Again (ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ)</span>
              </>
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
