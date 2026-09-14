import React, { useState, useEffect } from 'react';
import { Search, Sparkles, FileText, User, CheckCircle, ChevronRight, BookOpen } from 'lucide-react';
import noteService from '../../services/noteService';
import NoteViewer from '../../components/notes/NoteViewer';

const StudyNotesPage = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [authorSearchTerm, setAuthorSearchTerm] = useState('');

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoadingTopics(true);
    try {
      const res = await noteService.getTopics();
      if (res && res.data && res.data.topics) {
        const allTopics = res.data.topics;
        setTopics(allTopics);

        // Automatically select "Punjabi authors" default topic
        const punjabiAuthorsTopic = allTopics.find(
          (t) =>
            t.name.toLowerCase() === 'punjabi authors' ||
            t.name.toLowerCase().includes('punjabi author') ||
            t.name.includes('ਪੰਜਾਬੀ ਸਾਹਿਤਕਾਰ')
        );

        let defaultTopicId = null;
        if (punjabiAuthorsTopic) {
          defaultTopicId = punjabiAuthorsTopic.id;
        } else if (allTopics.length > 0) {
          defaultTopicId = allTopics[0].id;
        }

        setSelectedTopicId(defaultTopicId);
        fetchNotes(defaultTopicId);
      } else {
        fetchNotes(null);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      fetchNotes(null);
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchNotes = async (topicId) => {
    setLoadingNotes(true);
    try {
      const res = await noteService.getNotes(topicId, 'active');
      if (res && res.data && res.data.notes) {
        const fetchedNotes = res.data.notes;
        setNotes(fetchedNotes);
        if (fetchedNotes.length > 0) {
          setActiveNoteId(fetchedNotes[0].id);
        } else {
          setActiveNoteId(null);
        }
      } else {
        setNotes([]);
        setActiveNoteId(null);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      setNotes([]);
      setActiveNoteId(null);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSelectAuthor = (noteId) => {
    setActiveNoteId(noteId);
    // Smooth scroll to selected author section with sticky header offset
    setTimeout(() => {
      const targetElement = document.getElementById(`author-note-${noteId}`);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 50);
  };

  const selectedTopicObj = topics.find((t) => t.id === selectedTopicId);

  // Filter notes by author search term if entered
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(authorSearchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-x-hidden">
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
            ਪੰਜਾਬੀ ਸਾਹਿਤਕਾਰਾਂ ਦੇ ਪ੍ਰਮਾਣਿਕ ਨੋਟਸ ਪੜ੍ਹੋ ਅਤੇ PDF ਡਾਊਨਲੋਡ ਕਰੋ। (Browse structured study notes by author and download text-based PDFs for offline exam revision).
          </p>
        </div>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vertical Author Selector (Sticky Sidebar on Desktop) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 lg:sticky lg:top-24 w-full max-w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-extrabold text-slate-900 font-gurmukhi flex items-center space-x-2">
              <User className="w-5 h-5 text-amber-600" />
              <span>ਲੇਖਕ ਚੁਣੋ (Select Author)</span>
            </h2>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full font-gurmukhi">
              {notes.length} {notes.length === 1 ? 'Author' : 'Authors'}
            </span>
          </div>

          {/* Author Search Bar (Shown if >3 authors) */}
          {notes.length > 3 && (
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={authorSearchTerm}
                onChange={(e) => setAuthorSearchTerm(e.target.value)}
                placeholder="ਲੇਖਕ ਖੋਜੋ... (Search author...)"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-gurmukhi"
              />
            </div>
          )}

          {/* Vertical Author Cards List */}
          {loadingNotes ? (
            <div className="py-8 text-center text-slate-400 font-medium animate-pulse font-gurmukhi">
              ਲੇਖਕ ਨੋਟਸ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200 font-gurmukhi">
              ਕੋਈ ਲੇਖਕ ਨਹੀਂ ਮਿਲਿਆ (No author matching search)
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredNotes.map((note) => {
                const isSelected = activeNoteId === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => handleSelectAuthor(note.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl font-gurmukhi transition-all duration-200 flex items-center justify-between cursor-pointer min-h-[48px] ${
                      isSelected
                        ? 'bg-amber-600 text-white font-extrabold shadow-md ring-2 ring-amber-500/20 border border-amber-600'
                        : 'bg-white text-slate-800 font-bold hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <span className={`text-base flex-shrink-0 ${isSelected ? 'text-amber-200' : 'text-amber-500'}`}>
                        ★
                      </span>
                      <span className="text-base tracking-tight leading-snug break-words">
                        {note.title}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-amber-200 flex-shrink-0 ml-1" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Author Study Notes List */}
        <div className="lg:col-span-8 space-y-8 w-full max-w-full">
          {loadingNotes ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-600 font-semibold font-gurmukhi">ਨੋਟਸ ਲੋਡ ਹੋ ਰਹੇ ਹਨ... (Fetching study notes...)</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 font-gurmukhi">
                ਹਾਲੇ ਕੋਈ ਲੇਖਕ ਨੋਟਸ ਉਪਲਬਧ ਨਹੀਂ ਹਨ
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No notes uploaded for Punjabi authors yet. Admin can upload study material from the Manage Notes section.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {notes.map((note) => (
                <div
                  key={note.id}
                  id={`author-note-${note.id}`}
                  className="scroll-mt-24 scroll-mt-header transition-all duration-300"
                >
                  <NoteViewer
                    note={note}
                    topicName={selectedTopicObj ? selectedTopicObj.name : 'Punjabi authors'}
                    showPdfDownload={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyNotesPage;
