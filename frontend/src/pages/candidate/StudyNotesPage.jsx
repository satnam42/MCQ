import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Sparkles, Filter, FileText, Layers } from 'lucide-react';
import noteService from '../../services/noteService';
import TopicSelector from '../../components/notes/TopicSelector';
import NoteViewer from '../../components/notes/NoteViewer';

const StudyNotesPage = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);

  useEffect(() => {
    fetchTopics();
    fetchNotes(null);
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await noteService.getTopics();
      if (res && res.data && res.data.topics) {
        setTopics(res.data.topics);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchNotes = async (topicId) => {
    setLoadingNotes(true);
    try {
      const res = await noteService.getNotes(topicId, 'active');
      if (res && res.data && res.data.notes) {
        setNotes(res.data.notes);
        setActiveNoteIndex(0);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    fetchNotes(topicId);
  };

  const selectedTopicObj = topics.find((t) => t.id === selectedTopicId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-orange-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-amber-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-amber-200 text-xs font-bold border border-amber-500/30 font-gurmukhi">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ ਤਿਆਰੀ (Study Notes)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-gurmukhi tracking-tight leading-tight">
            ਪੰਜਾਬੀ ਸਾਹਿਤ ਅਧਿਐਨ ਨੋਟਸ (Punjabi Study Material)
          </h1>
          <p className="text-amber-100 text-base sm:text-lg font-gurmukhi leading-relaxed opacity-95">
            ਵਿਸ਼ੇ ਅਨੁਸਾਰ ਪ੍ਰਮਾਣਿਕ ਪੰਜਾਬੀ ਸਾਹਿਤ ਨੋਟਸ ਪੜ੍ਹੋ ਅਤੇ PDF ਡਾਊਨਲੋਡ ਕਰੋ। (Browse structured study notes by topic and download text-based PDFs for offline exam revision).
          </p>
        </div>
      </div>

      {/* 1. Searchable Topic Selector Component */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 font-gurmukhi flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>ਵਿਸ਼ਾ ਚੁਣੋ (Select Topic)</span>
          </h2>
          {selectedTopicObj && (
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-gurmukhi">
              ਚੁਣਿਆ ਵਿਸ਼ਾ: {selectedTopicObj.name}
            </span>
          )}
        </div>

        {loadingTopics ? (
          <div className="py-8 text-center text-slate-400 font-medium animate-pulse">
            Loading topics...
          </div>
        ) : (
          <TopicSelector
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={handleSelectTopic}
            viewMode="cards"
          />
        )}
      </div>

      {/* 2. Notes Content Section */}
      <div className="space-y-6">
        {loadingNotes ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-semibold font-gurmukhi">ਨੋਟਸ ਲੋਡ ਹੋ ਰਹੇ ਹਨ... (Fetching study notes...)</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800 font-gurmukhi">
              ਇਸ ਵਿਸ਼ੇ ਲਈ ਹਾਲੇ ਕੋਈ ਨੋਟਸ ਉਪਲਬਧ ਨਹੀਂ ਹਨ
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              No notes uploaded for this topic yet. Admin can upload .txt study material from the Manage Notes section.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multiple Notes Tabs (if more than 1 note under topic) */}
            {notes.length > 1 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {notes.map((n, index) => (
                  <button
                    key={n.id}
                    onClick={() => setActiveNoteIndex(index)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm font-gurmukhi whitespace-nowrap cursor-pointer transition-all ${
                      activeNoteIndex === index
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
                    }`}
                  >
                    {n.title}
                  </button>
                ))}
              </div>
            )}

            {/* Note Viewer with Gurmukhi Typography & PDF Export */}
            <NoteViewer
              note={notes[activeNoteIndex]}
              topicName={selectedTopicObj ? selectedTopicObj.name : ''}
              showPdfDownload={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyNotesPage;
