import React from 'react';
import { Bookmark, Calendar } from 'lucide-react';
import DownloadPdfButton from './DownloadPdfButton';

const NoteViewer = ({ note, topicName, showPdfDownload = true }) => {
  if (!note) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <p className="text-slate-500 font-medium">ਕੋਈ ਨੋਟ ਉਪਲਬਧ ਨਹੀਂ ਹੈ (No note available to view)</p>
      </div>
    );
  }

  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('pa-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 px-6 py-6 text-white relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-amber-800/60 text-amber-100 text-xs px-3 py-1 rounded-full font-semibold font-gurmukhi border border-amber-500/30">
              <Bookmark className="w-3.5 h-3.5" />
              <span>{note.topic ? note.topic.name : topicName || 'ਪੰਜਾਬੀ ਸਾਹਿਤ'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-gurmukhi pt-1 leading-snug">
              {note.title}
            </h1>
            {formattedDate && (
              <div className="flex items-center space-x-2 text-amber-200 text-xs pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>ਅਪਡੇਟ: {formattedDate}</span>
              </div>
            )}
          </div>

          {showPdfDownload && (
            <div className="flex-shrink-0">
              <DownloadPdfButton note={note} topicName={note.topic ? note.topic.name : topicName} />
            </div>
          )}
        </div>
      </div>

      {/* Structured HTML Study Content */}
      <div id={`note-content-${note.id}`} className="p-6 sm:p-8 bg-amber-50/20">
        <article
          className="notes-container text-slate-800"
          dangerouslySetInnerHTML={{ __html: note.html_content || note.htmlContent }}
        />
      </div>
    </div>
  );
};

export default NoteViewer;
