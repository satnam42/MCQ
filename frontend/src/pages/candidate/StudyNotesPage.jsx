import React, { useState, useEffect } from 'react';
import { Search, Sparkles, FileText, User, CheckCircle, ChevronRight, ChevronLeft, BookOpen, Layers } from 'lucide-react';
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
  const [isMobileAuthorListExpanded, setIsMobileAuthorListExpanded] = useState(false);

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
    setIsMobileAuthorListExpanded(false);

    // Smooth scroll directly to active note viewer section
    setTimeout(() => {
      const targetElement = document.getElementById('active-note-section');
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 50);
  };

  const selectedTopicObj = topics.find((t) => t.id === selectedTopicId);

  // Filter notes by author search term
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(authorSearchTerm.toLowerCase())
  );

  // Find currently active note object
  const activeNoteIndex = filteredNotes.findIndex((n) => n.id === activeNoteId);
  const activeNote =
    (activeNoteIndex !== -1 ? filteredNotes[activeNoteIndex] : filteredNotes[0]) || notes[0];

  const handlePrevAuthor = () => {
    if (activeNoteIndex > 0) {
      handleSelectAuthor(filteredNotes[activeNoteIndex - 1].id);
    }
  };

  const handleNextAuthor = () => {
    if (activeNoteIndex < filteredNotes.length - 1) {
      handleSelectAuthor(filteredNotes[activeNoteIndex + 1].id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-orange-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-amber-900/60 backdrop-blur-md px-3.5 py-1 rounded-full text-amber-200 text-xs font-bold border border-amber-500/30 font-gurmukhi">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ ਤਿਆਰੀ (Study Notes)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-gurmukhi tracking-tight leading-tight">
            ਪੰਜਾਬੀ ਸਾਹਿਤ ਅਧਿਐਨ ਨੋਟਸ (Punjabi Study Material)
          </h1>
          <p className="text-amber-100 text-sm sm:text-base font-gurmukhi leading-relaxed opacity-95">
            ਪੰਜਾਬੀ ਸਾਹਿਤਕਾਰਾਂ ਦੇ ਪ੍ਰਮਾਣਿਕ ਨੋਟਸ ਪੜ੍ਹੋ ਅਤੇ PDF ਡਾਊਨਲੋਡ ਕਰੋ। (Browse structured study notes by author and download text-based PDFs for offline exam revision).
          </p>
        </div>
      </div>

      {/* Main Responsive Layout: 2-Column Desktop, Stacked Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Author Selector Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4 lg:sticky lg:top-24 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-gurmukhi flex items-center space-x-2">
              <User className="w-5 h-5 text-amber-600" />
              <span>ਲੇਖਕ ਚੁਣੋ (Select Author)</span>
            </h2>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full font-gurmukhi">
              {notes.length} {notes.length === 1 ? 'Author' : 'Authors'}
            </span>
          </div>

          {/* Search Bar (Shown if > 3 authors) */}
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

          {/* Active Author Indicator Badge on Mobile */}
          {activeNote && (
            <div className="lg:hidden flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center space-x-2 truncate">
                <span className="text-amber-600 font-bold">★</span>
                <span className="text-xs sm:text-sm font-bold text-amber-950 font-gurmukhi truncate">
                  ਚੁਣਿਆ ਲੇਖਕ: {activeNote.title}
                </span>
              </div>
              <button
                onClick={() => setIsMobileAuthorListExpanded(!isMobileAuthorListExpanded)}
                className="text-xs font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 shrink-0 font-gurmukhi"
              >
                {isMobileAuthorListExpanded ? 'ਛੁਪਾਓ (Hide)' : 'ਬਦਲੋ (Change)'}
              </button>
            </div>
          )}

          {/* Author Cards List */}
          {loadingNotes ? (
            <div className="py-6 text-center text-slate-400 font-medium animate-pulse font-gurmukhi text-sm">
              ਲੇਖਕ ਨੋਟਸ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200 font-gurmukhi">
              ਕੋਈ ਲੇਖਕ ਨਹੀਂ ਮਿਲਿਆ (No author matching search)
            </div>
          ) : (
            <div
              className={`space-y-2 max-h-[260px] sm:max-h-[320px] lg:max-h-[580px] overflow-y-auto pr-1 ${
                isMobileAuthorListExpanded ? 'block' : 'hidden lg:block'
              }`}
            >
              {filteredNotes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => handleSelectAuthor(note.id)}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-xl font-gurmukhi transition-all duration-200 flex items-center justify-between cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-600 text-white font-extrabold shadow-md ring-2 ring-amber-500/20 border border-amber-600'
                        : 'bg-white text-slate-800 font-bold hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <span className={`text-sm flex-shrink-0 ${isSelected ? 'text-amber-200' : 'text-amber-500'}`}>
                        ★
                      </span>
                      <span className="text-sm tracking-tight leading-snug break-words">
                        {note.title}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircle className="w-4 h-4 text-amber-200 flex-shrink-0 ml-1" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Prominently Displayed Active Author Study Note */}
        <div id="active-note-section" className="lg:col-span-8 space-y-6 w-full scroll-mt-24">
          {loadingNotes ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-600 font-semibold font-gurmukhi">ਨੋਟਸ ਲੋਡ ਹੋ ਰਹੇ ਹਨ... (Fetching study notes...)</p>
            </div>
          ) : !activeNote ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 font-gurmukhi">
                ਹਾਲੇ ਕੋਈ ਲੇਖਕ ਨੋਟਸ ਉਪਲਬਧ ਨਹੀਂ ਹਨ
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No notes uploaded for Punjabi authors yet. Admin can upload study material from the Manage Notes section.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Active Note Card View */}
              <NoteViewer
                note={activeNote}
                topicName={selectedTopicObj ? selectedTopicObj.name : 'Punjabi authors'}
                showPdfDownload={true}
              />

              {/* Author Navigation Bar (Previous / Next Author) */}
              {filteredNotes.length > 1 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between font-gurmukhi gap-2">
                  <button
                    onClick={handlePrevAuthor}
                    disabled={activeNoteIndex <= 0}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-amber-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 border border-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ਪਿਛਲਾ ਲੇਖਕ (Previous)</span>
                  </button>

                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                    {activeNoteIndex + 1} / {filteredNotes.length} Authors
                  </span>

                  <button
                    onClick={handleNextAuthor}
                    disabled={activeNoteIndex >= filteredNotes.length - 1}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <span>ਅਗਲਾ ਲੇਖਕ (Next)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyNotesPage;
