import React, { useState, useEffect } from 'react';
import {
  Upload,
  Plus,
  FileText,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  X,
  RefreshCw,
  Power,
  FileJson,
  Copy,
  Check,
  Layers,
  Edit3,
  Code,
  PenTool,
  Save,
  Sparkles,
} from 'lucide-react';
import noteService from '../../services/noteService';
import RichNoteEditor from '../../components/notes/RichNoteEditor';
import NoteRenderer from '../../components/notes/NoteRenderer';
import NotePreviewModal from '../../components/notes/NotePreviewModal';
import NoteViewer from '../../components/notes/NoteViewer';

const DEFAULT_NOTE_JSON = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: 'ਭਾਈ ਵੀਰ ਸਿੰਘ - ਜੀਵਨ ਅਤੇ ਰਚਨਾਵਾਂ',
          marks: [{ type: 'bold' }],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'ਜਨਮ: ',
          marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { fontSize: '18px', color: '#b45309' } }],
        },
        {
          type: 'text',
          text: '5 ਦਸੰਬਰ 1872, ਅੰਮ੍ਰਿਤਸਰ',
          marks: [{ type: 'textStyle', attrs: { fontSize: '18px' } }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'ਰਾਣਾ ਸੂਰਤ ਸਿੰਘ',
                  marks: [{ type: 'bold' }],
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'ਮੇਰਾ ਸਾਈਂ ਜੀਓ',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const ManageNotesPage = () => {
  const [topics, setTopics] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Active Editor Mode: 'visual' | 'json' | 'preview'
  const [activeTab, setActiveTab] = useState('visual');

  // Currently Editing Note State
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [editorContent, setEditorContent] = useState(DEFAULT_NOTE_JSON);
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_NOTE_JSON, null, 2));
  const [jsonSyntaxError, setJsonSyntaxError] = useState('');

  // File Upload Modal & State
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isBulkJson, setIsBulkJson] = useState(false);
  const [jsonNotesCount, setJsonNotesCount] = useState(0);

  // Form Notifications
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Sample JSON Modal
  const [showJsonSampleModal, setShowJsonSampleModal] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  // New Topic Dynamic Inline Form
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewNoteModal, setViewNoteModal] = useState(null);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [topicsRes, notesRes] = await Promise.all([
        noteService.getTopics(),
        noteService.getNotes(null, null),
      ]);

      if (topicsRes && topicsRes.data && topicsRes.data.topics) {
        setTopics(topicsRes.data.topics);
        if (!selectedTopicId && topicsRes.data.topics.length > 0) {
          setSelectedTopicId(topicsRes.data.topics[0].id);
        }
      }
      if (notesRes && notesRes.data && notesRes.data.notes) {
        setNotes(notesRes.data.notes);
      }
    } catch (err) {
      console.error('Error fetching admin notes data:', err);
      setFormError('Failed to load topics and notes. Please check server status.');
    } finally {
      setLoading(false);
    }
  };

  // Handler when Visual Editor updates
  const handleEditorChange = ({ json }) => {
    setEditorContent(json);
    setJsonText(JSON.stringify(json, null, 2));
    setJsonSyntaxError('');
  };

  // Handler when JSON Editor text changes
  const handleJsonTextChange = (e) => {
    const text = e.target.value;
    setJsonText(text);
    setJsonSyntaxError('');

    try {
      const parsed = JSON.parse(text);
      setEditorContent(parsed);
    } catch (err) {
      setJsonSyntaxError(`Invalid JSON Syntax: ${err.message}`);
    }
  };

  const handleResetForm = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setEditorContent(DEFAULT_NOTE_JSON);
    setJsonText(JSON.stringify(DEFAULT_NOTE_JSON, null, 2));
    setJsonSyntaxError('');
    setSelectedFile(null);
    setFileError('');
  };

  const handleLoadNoteForEdit = (note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setSelectedTopicId(note.topic_id || (note.topic ? note.topic.id : ''));

    let contentToLoad = note.raw_content || note.rawContent || note.html_content || note.htmlContent;
    if (typeof contentToLoad === 'string') {
      const trimmed = contentToLoad.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          setEditorContent(parsed);
          setJsonText(JSON.stringify(parsed, null, 2));
        } catch (e) {
          setEditorContent(contentToLoad);
          setJsonText(contentToLoad);
        }
      } else {
        setEditorContent(contentToLoad);
        setJsonText(contentToLoad);
      }
    } else if (typeof contentToLoad === 'object') {
      setEditorContent(contentToLoad);
      setJsonText(JSON.stringify(contentToLoad, null, 2));
    }

    // Scroll to editor card
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSaveEditorNote = async () => {
    if (!selectedTopicId) {
      setFormError('ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵਿਸ਼ਾ ਚੁਣੋ (Please select a topic).');
      return;
    }
    if (!noteTitle.trim()) {
      setFormError('ਕਿਰਪਾ ਕਰਕੇ ਨੋਟ ਦਾ ਸਿਰਲੇਖ ਦਰਜ ਕਰੋ (Please enter note title).');
      return;
    }
    if (jsonSyntaxError) {
      setFormError('JSON Editor ਵਿੱਚ ਸਿੰਟੈਕਸ ਐਰਰ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਠੀਕ ਕਰੋ। (Please fix JSON syntax errors before saving).');
      return;
    }

    setUploading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const rawContentStr = typeof editorContent === 'object' ? JSON.stringify(editorContent) : String(editorContent);

      const formData = new FormData();
      formData.append('topicId', selectedTopicId);
      formData.append('title', noteTitle.trim());
      formData.append('rawContent', rawContentStr);
      formData.append('originalFileName', 'structured_note.json');

      let res;
      if (editingNoteId) {
        res = await noteService.updateNote(editingNoteId, formData);
      } else {
        res = await noteService.createNote(formData);
      }

      if (res && res.data) {
        setFormSuccess(
          editingNoteId
            ? '✅ ਨੋਟ ਸਫਲਤਾਪੂਰਵਕ ਅੱਪਡੇਟ ਹੋ ਗਿਆ! (Note updated successfully)'
            : '✅ ਨਵਾਂ ਨੋਟ ਸਫਲਤਾਪੂਰਵਕ ਬਣਾਇਆ ਅਤੇ ਸੇਵ ਹੋ ਗਿਆ! (Note created successfully)'
        );
        handleResetForm();
        fetchInitialData();
        setTimeout(() => setFormSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Save Note Error:', err);
      setFormError(err.response?.data?.message || 'Failed to save note. Please verify server connection.');
    } finally {
      setUploading(false);
    }
  };

  // Create Topic inline
  const handleCreateNewTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    setCreatingTopic(true);
    try {
      const res = await noteService.createTopic({ name: newTopicName.trim() });
      if (res && res.data && res.data.topic) {
        const created = res.data.topic;
        setTopics((prev) => [...prev, created]);
        setSelectedTopicId(created.id);
        setNewTopicName('');
        setShowAddTopic(false);
        setFormSuccess(`ਨਵਾਂ ਵਿਸ਼ਾ "${created.name}" ਸਫਲਤਾਪੂਰਵਕ ਬਣਾਇਆ ਗਿਆ!`);
        setTimeout(() => setFormSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setCreatingTopic(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (note) => {
    try {
      const newStatus = note.status === 'active' ? 'disabled' : 'active';
      const formData = new FormData();
      formData.append('status', newStatus);

      const res = await noteService.updateNote(note.id, formData);
      if (res && res.data && res.data.note) {
        setNotes((prev) => prev.map((n) => (n.id === note.id ? res.data.note : n)));
      }
    } catch (err) {
      alert('Failed to toggle note status.');
    }
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    try {
      await noteService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeleteConfirmNote(null);
    } catch (err) {
      alert('Failed to delete note.');
    }
  };

  // File Upload Handlers (.txt or .json)
  const handleFileUploadSave = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedTopicId) formData.append('topicId', selectedTopicId);
      if (noteTitle.trim()) formData.append('title', noteTitle.trim());

      let res;
      if (isBulkJson) {
        res = await noteService.bulkImportNotes(formData);
      } else {
        res = await noteService.createNote(formData);
      }

      if (res && res.data) {
        setFormSuccess('✅ ਨੋਟਸ ਫਾਈਲ ਸਫਲਤਾਪੂਰਵਕ ਅੱਪਲੋਡ ਹੋ ਗਈ! (File imported successfully)');
        setShowFileUploadModal(false);
        setSelectedFile(null);
        fetchInitialData();
        setTimeout(() => setFormSuccess(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const sampleJsonStructure = `[
  {
    "topic": "ਭਾਈ ਵੀਰ ਸਿੰਘ",
    "title": "ਭਾਈ ਵੀਰ ਸਿੰਘ - ਜੀਵਨ ਅਤੇ ਰਚਨਾਵਾਂ",
    "content": "### ਭਾਈ ਵੀਰ ਸਿੰਘ\\n\\n**ਜਨਮ/ਦੇਹਾਂਤ**\\n\\n- ਜਨਮ: **5 ਦਸੰਬਰ 1872**\\n- ਦੇਹਾਂਤ: **10 ਜੂਨ 1957**"
  }
]`;

  const copySampleJson = () => {
    navigator.clipboard.writeText(sampleJsonStructure);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const selectedTopicObj = topics.find((t) => t.id === Number(selectedTopicId));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Rich Text Notes Admin Panel</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-gurmukhi tracking-tight">
              ਸਾਹਿਤਕ ਨੋਟਸ ਪ੍ਰਬੰਧਨ (Manage Study Notes)
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-gurmukhi leading-relaxed">
              Create professional Punjabi study notes using Word/Docs-style Rich Text Editor, modify JSON directly, preview rendered cards live, or upload `.txt`/`.json` files.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFileUploadModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>File Upload (.txt/.json)</span>
            </button>
            <button
              onClick={() => setShowJsonSampleModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>JSON Sample</span>
            </button>
            <button
              onClick={fetchInitialData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center space-x-3 text-sm font-semibold font-gurmukhi shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center space-x-3 text-sm font-semibold shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ── RICH TEXT EDITOR CARD ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl font-bold">
              <PenTool className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-gurmukhi">
                {editingNoteId ? 'ਨੋਟ ਐਡਿਟ ਕਰੋ (Edit Study Note)' : 'ਨਵਾਂ ਨੋਟ ਬਣਾਓ (Create Rich Text Note)'}
              </h2>
              <p className="text-xs text-slate-500 font-gurmukhi">
                Structured JSON Source of Truth with Live Visual Editor
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddTopic(!showAddTopic)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-amber-700" />
              <span>+ ਨਵਾਂ ਵਿਸ਼ਾ (Add Topic)</span>
            </button>
            {editingNoteId && (
              <button
                onClick={handleResetForm}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                + Create New Note Instead
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Inline New Topic Form */}
        {showAddTopic && (
          <form onSubmit={handleCreateNewTopic} className="bg-amber-100/50 p-4 rounded-xl border border-amber-200 flex flex-wrap items-center gap-3">
            <div className="flex-grow min-w-[240px]">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="ਨਵੇਂ ਵਿਸ਼ੇ ਦਾ ਨਾਂ (New Topic Name e.g. ਨਾਵਲਕਾਰ)"
                className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium font-gurmukhi focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={creatingTopic || !newTopicName.trim()}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {creatingTopic ? 'Adding...' : 'Save Topic'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddTopic(false)}
              className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Note Metadata Fields (Topic & Title) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 font-gurmukhi">
              1. ਵਿਸ਼ਾ (Topic) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm text-slate-800 font-medium font-gurmukhi text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- ਵਿਸ਼ਾ ਚੁਣੋ (Select Topic) --</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 font-gurmukhi">
              2. ਨੋਟ ਦਾ ਸਿਰਲੇਖ (Note Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g. ਭਾਈ ਵੀਰ ਸਿੰਘ - ਜੀਵਨ ਅਤੇ ਰਚਨਾਵਾਂ"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm text-slate-800 font-medium font-gurmukhi text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Mode Selector Tabs (Visual Editor | JSON Editor | Live Preview) */}
        <div className="border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-t-2xl font-gurmukhi">
            <button
              onClick={() => setActiveTab('visual')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Visual Editor (ਵਿਜ਼ੁਅਲ ਐਡੀਟਰ)</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Editor (ਜੇਸਨ ਐਡੀਟਰ)</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview (ਪੂਰਵਦਰਸ਼ਨ)</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            JSON Source of Truth
          </span>
        </div>

        {/* Tab Content & Desktop Responsive Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Editor Column */}
          <div className={`${activeTab === 'preview' ? 'hidden lg:block lg:col-span-6' : 'lg:col-span-12 xl:col-span-7'} space-y-4`}>
            {activeTab === 'visual' && (
              <div className="space-y-2">
                <RichNoteEditor
                  initialContent={editorContent}
                  onChange={handleEditorChange}
                />
              </div>
            )}

            {activeTab === 'json' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Structured Document JSON</span>
                  {jsonSyntaxError && <span className="text-rose-600 font-bold">{jsonSyntaxError}</span>}
                </div>
                <textarea
                  value={jsonText}
                  onChange={handleJsonTextChange}
                  rows={16}
                  className="w-full p-4 bg-slate-950 text-amber-300 rounded-2xl font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="lg:hidden bg-amber-50/40 p-6 border border-amber-200/80 rounded-2xl">
                <h3 className="text-sm font-bold text-amber-900 font-gurmukhi mb-3 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>Live Preview (ਕੈਂਡੀਡੇਟ ਵਿਊ)</span>
                </h3>
                <NoteRenderer rawContent={editorContent} />
              </div>
            )}
          </div>

          {/* Side-by-Side Live Preview Column on Desktop */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-5 bg-gradient-to-b from-amber-50/60 to-orange-50/30 p-6 border border-amber-200/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <h3 className="text-base font-bold text-amber-950 font-gurmukhi flex items-center space-x-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>Live Candidate Preview</span>
              </h3>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-gurmukhi">
                {selectedTopicObj ? selectedTopicObj.name : 'Topic'}
              </span>
            </div>

            <div className="max-h-[580px] overflow-y-auto pr-1">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h1 className="text-2xl font-extrabold text-amber-950 font-gurmukhi border-b border-amber-100 pb-2">
                  {noteTitle || 'ਸਿਰਲੇਖ ਦਾ ਪੂਰਵਦਰਸ਼ਨ (Title Preview)'}
                </h1>
                <NoteRenderer rawContent={editorContent} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {editingNoteId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer font-gurmukhi"
            >
              ਰੱਦ ਕਰੋ (Cancel Edit)
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveEditorNote}
            disabled={uploading || !selectedTopicId || !noteTitle.trim()}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-base shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-gurmukhi"
          >
            <Save className="w-5 h-5" />
            <span>
              {uploading
                ? 'ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ...'
                : editingNoteId
                ? 'ਅੱਪਡੇਟ ਕਰੋ (Update Note)'
                : 'ਸੇਵ ਕਰੋ (Save Note)'}
            </span>
          </button>
        </div>
      </div>

      {/* ── EXISTING NOTES MANAGEMENT TABLE ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <h2 className="text-lg font-bold font-gurmukhi flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>ਮੌਜੂਦਾ ਨੋਟਸ ਸੂਚੀ (Existing Notes List - {notes.length})</span>
          </h2>
        </div>

        {notes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium font-gurmukhi">
            ਕੋਈ ਨੋਟ ਨਹੀਂ ਲੱਭਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਉੱਪਰ ਦਿੱਤੇ ਐਡੀਟਰ ਤੋਂ ਨਵਾਂ ਨੋਟ ਬਣਾਓ।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider">
                  <th className="py-3.5 px-6">Topic (ਵਿਸ਼ਾ)</th>
                  <th className="py-3.5 px-6">Title (ਸਿਰਲੇਖ)</th>
                  <th className="py-3.5 px-6">Original File</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-amber-900 font-gurmukhi">
                      {note.topic ? note.topic.name : 'Unassigned'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900 font-gurmukhi">
                      {note.title}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {note.original_file_name || note.originalFileName}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(note)}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                          note.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{note.status === 'active' ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleLoadNoteForEdit(note)}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors cursor-pointer"
                        title="Edit Note in Visual Editor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewNoteModal(note)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Full Candidate Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmNote(note)}
                        className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── FILE UPLOAD MODAL (.txt or .json) ── */}
      {showFileUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-lg font-gurmukhi">
                <Upload className="w-5 h-5 text-amber-700" />
                <span>ਅੱਪਲੋਡ ਫਾਈਲ (Upload `.txt` or `.json`)</span>
              </div>
              <button onClick={() => setShowFileUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-2xl p-6 text-center">
                <input
                  id="modal-file-input"
                  type="file"
                  accept=".txt,.json,text/plain,application/json"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) {
                      setSelectedFile(f);
                      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
                      setIsBulkJson(ext === '.json');
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="modal-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                  <Upload className="w-8 h-8 text-amber-700" />
                  <span className="text-sm font-bold text-amber-900 font-gurmukhi">
                    ਕਲਿੱਕ ਕਰਕੇ ਫਾਈਲ ਚੁਣੋ (Click to select `.txt` or `.json` file)
                  </span>
                </label>
                {selectedFile && (
                  <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFileUploadModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFileUploadSave}
                disabled={!selectedFile || uploading}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULL VIEW MODAL ── */}
      {viewNoteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold font-gurmukhi">{viewNoteModal.title}</h3>
              <button onClick={() => setViewNoteModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <NoteViewer note={viewNoteModal} />
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteConfirmNote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-gurmukhi">
              ਕੀ ਤੁਸੀਂ ਇਸ ਨੋਟ ਨੂੰ ਮਿਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ? (Delete Note?)
            </h3>
            <p className="text-sm text-slate-600 font-gurmukhi">
              "{deleteConfirmNote.title}" ਨੋਟ ਸਥਾਈ ਤੌਰ 'ਤੇ ਮਿਟਾ ਦਿੱਤਾ ਜਾਵੇਗਾ।
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmNote(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-300 cursor-pointer"
              >
                ਰੱਦ ਕਰੋ (Cancel)
              </button>
              <button
                onClick={() => handleDeleteNote(deleteConfirmNote.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
              >
                ਹਾਂ, ਮਿਟਾਓ (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SAMPLE JSON MODAL ── */}
      {showJsonSampleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <FileJson className="w-5 h-5 text-amber-600" />
                <span>Sample JSON Format for Bulk Notes Upload</span>
              </div>
              <button onClick={() => setShowJsonSampleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upload an array of note objects in `.json` format. Missing topics will be created automatically by name!
            </p>

            <div className="relative">
              <pre className="bg-slate-950 text-amber-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
                {sampleJsonStructure}
              </pre>
              <button
                onClick={copySampleJson}
                className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                {copiedSample ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSample ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowJsonSampleModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNotesPage;
