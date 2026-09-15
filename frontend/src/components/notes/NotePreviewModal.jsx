import React from 'react';
import { X, Check, FileText, AlertCircle } from 'lucide-react';

const NotePreviewModal = ({ isOpen, onClose, onConfirm, title, topicName, originalFileName, htmlContent, isSaving }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold font-gurmukhi">ਨੋਟ ਪੂਰਵਦਰਸ਼ਨ (Note Preview)</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Metadata Summary */}
        <div className="bg-amber-50/60 px-6 py-3 border-b border-amber-200/60 flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-700 gap-2">
          <div>
            <span className="font-semibold text-slate-500">ਸਿਰਲੇਖ (Title): </span>
            <strong className="text-slate-900 font-gurmukhi">{title || 'Untitled'}</strong>
          </div>
          <div>
            <span className="font-semibold text-slate-500">ਵਿਸ਼ਾ (Topic): </span>
            <span className="bg-amber-200/60 text-amber-900 px-2.5 py-0.5 rounded-full font-semibold font-gurmukhi">
              {topicName || 'General'}
            </span>
          </div>
          {originalFileName && (
            <div className="text-slate-500 font-mono text-xs">
              📁 {originalFileName}
            </div>
          )}
        </div>

        {/* Formatted HTML Preview Container */}
        <div className="p-6 overflow-y-auto flex-grow bg-slate-50">
          {!htmlContent || !htmlContent.trim() ? (
            <div className="py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p>ਕੋਈ ਸਮੱਗਰੀ ਨਹੀਂ ਮਿਲੀ (Empty or invalid content)</p>
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
              <article
                className="notes-container text-slate-800"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ਰੱਦ ਕਰੋ (Cancel)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || !htmlContent || !htmlContent.trim()}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ...' : 'ਸੇਵ ਕਰੋ (Save Note)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotePreviewModal;
