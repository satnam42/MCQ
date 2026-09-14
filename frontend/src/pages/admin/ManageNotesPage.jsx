import React, { useState, useEffect } from 'react';
import {
  Upload,
  Plus,
  FileText,
  Trash2,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  X,
  RefreshCw,
  Power,
} from 'lucide-react';
import noteService from '../../services/noteService';
import { parseNoteToHtml } from '../../utils/noteParser';
import NotePreviewModal from '../../components/notes/NotePreviewModal';
import NoteViewer from '../../components/notes/NoteViewer';

const ManageNotesPage = () => {
  const [topics, setTopics] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // New Topic Dynamic Modal / Inline
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewFileContent, setPreviewFileContent] = useState('');

  // View/Edit Modal State
  const [viewNoteModal, setViewNoteModal] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [topicsRes, notesRes] = await Promise.all([
        noteService.getTopics(),
        noteService.getNotes(null, null), // Fetch all notes for admin
      ]);

      if (topicsRes && topicsRes.data && topicsRes.data.topics) {
        setTopics(topicsRes.data.topics);
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

  // Client-side File Validation
  const validateFile = (file) => {
    setFileError('');
    if (!file) return false;

    const fileName = file.name;
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    // Check Extension
    if (ext !== '.txt') {
      setFileError(`Invalid file format "${ext}". Only .txt files are allowed. PDF, DOCX, XLS, and Images are strictly rejected.`);
      return false;
    }

    // Check File Size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5MB limit.');
      return false;
    }

    // Check Empty File
    if (file.size === 0) {
      setFileError('The selected file is empty (0 bytes).');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    setFormError('');

    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);

        // Read file content for live preview
        const reader = new FileReader();
        reader.onload = (event) => {
          const rawText = event.target.result;
          setPreviewFileContent(rawText);
          const parsed = parseNoteToHtml(rawText);
          setPreviewContent(parsed);
        };
        reader.readAsText(file, 'UTF-8');
      } else {
        setSelectedFile(null);
        e.target.value = null;
      }
    }
  };

  const handleOpenPreview = () => {
    setFormError('');
    if (!selectedTopicId) {
      setFormError('ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵਿਸ਼ਾ ਚੁਣੋ (Please select a topic).');
      return;
    }
    if (!noteTitle.trim()) {
      setFormError('ਕਿਰਪਾ ਕਰਕੇ ਨੋਟ ਦਾ ਸਿਰਲੇਖ ਦਰਜ ਕਰੋ (Please enter note title).');
      return;
    }
    if (!selectedFile) {
      setFormError('ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ .txt ਫਾਈਲ ਅੱਪਲੋਡ ਕਰੋ (Please select a .txt file).');
      return;
    }
    setPreviewOpen(true);
  };

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

  const handleSaveNote = async () => {
    if (!selectedTopicId || !noteTitle.trim() || !selectedFile) {
      setFormError('All fields and file are required.');
      return;
    }

    setUploading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const formData = new FormData();
      formData.append('topicId', selectedTopicId);
      formData.append('title', noteTitle.trim());
      formData.append('file', selectedFile);

      const res = await noteService.createNote(formData);

      if (res && res.data && res.data.note) {
        setNotes((prev) => [res.data.note, ...prev]);
        setFormSuccess('ਨੋਟ ਸਫਲਤਾਪੂਰਵਕ ਅੱਪਲੋਡ ਅਤੇ ਸੇਵ ਹੋ ਗਿਆ! (Note uploaded successfully)');
        setSelectedFile(null);
        setNoteTitle('');
        setSelectedTopicId('');
        setPreviewOpen(false);
        // Reset file input element
        const fileInput = document.getElementById('txt-file-input');
        if (fileInput) fileInput.value = null;

        setTimeout(() => setFormSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Save Note Error:', err);
      setFormError(err.response?.data?.message || 'Failed to save note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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

  const handleDeleteNote = async (id) => {
    try {
      await noteService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeleteConfirmNote(null);
    } catch (err) {
      alert('Failed to delete note.');
    }
  };

  const selectedTopicObj = topics.find((t) => t.id === Number(selectedTopicId));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-amber-900/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              <span>Admin Management Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold font-gurmukhi tracking-tight">
              Manage Notes (ਸਾਹਿਤਕ ਨੋਟਸ ਪ੍ਰਬੰਧਨ)
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Upload study notes in `.txt` format, validate content, structure into HTML sections, preview, and make notes available for Punjabi candidates.
            </p>
          </div>
          <button
            onClick={fetchInitialData}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-amber-50/80 px-6 py-4 border-b border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-900 font-bold font-gurmukhi text-lg">
            <Upload className="w-5 h-5 text-amber-700" />
            <span>ਨਵਾਂ ਨੋਟ ਅੱਪਲੋਡ ਕਰੋ (Upload New Study Note)</span>
          </div>
          <button
            onClick={() => setShowAddTopic(!showAddTopic)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-amber-700" />
            <span>+ ਨਵਾਂ ਵਿਸ਼ਾ ਜੋੜੋ (Add Topic)</span>
          </button>
        </div>

        {/* Dynamic New Topic Inline Form */}
        {showAddTopic && (
          <form onSubmit={handleCreateNewTopic} className="bg-amber-100/50 p-4 border-b border-amber-200 flex flex-wrap items-center gap-3">
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

        <div className="p-6 sm:p-8 space-y-6">
          {formSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3 text-sm font-semibold font-gurmukhi">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-3 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Topic Dropdown */}
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

            {/* 2. Note Title Input */}
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

          {/* 3. Text File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 font-gurmukhi">
              3. ਟੈਕਸਟ ਫਾਈਲ ਅੱਪਲੋਡ (Upload `.txt` file) <span className="text-rose-500">*</span>
            </label>

            <div className="border-2 border-dashed border-amber-300 bg-amber-50/30 rounded-2xl p-6 text-center hover:bg-amber-50/60 transition-all">
              <input
                id="txt-file-input"
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="txt-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-3 bg-amber-100 text-amber-800 rounded-full">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-amber-800 font-bold text-sm hover:underline font-gurmukhi">
                    ਫਾਈਲ ਚੁਣਨ ਲਈ ਇੱਥੇ ਕਲਿੱਕ ਕਰੋ (Click to select `.txt` file)
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Strictly `.txt` plain text files only (Max 5MB). PDF, DOCX, XLS & Images rejected.
                  </p>
                </div>
              </label>

              {selectedFile && (
                <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {fileError && (
              <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fileError}</span>
              </p>
            )}
          </div>

          {/* Upload Form Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenPreview}
              disabled={!selectedFile || !selectedTopicId || !noteTitle.trim()}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl border border-amber-600 text-amber-900 font-bold text-sm hover:bg-amber-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4 text-amber-700" />
              <span className="font-gurmukhi">ਪੂਰਵਦਰਸ਼ਨ (Preview HTML)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveNote}
              disabled={uploading || !selectedFile || !selectedTopicId || !noteTitle.trim()}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span className="font-gurmukhi">{uploading ? 'ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ...' : 'Upload & Save Note'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Existing Notes Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <h2 className="text-lg font-bold font-gurmukhi flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>ਮੌਜੂਦਾ ਨੋਟਸ ਸੂਚੀ (Existing Notes List - {notes.length})</span>
          </h2>
        </div>

        {notes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            ਕੋਈ ਨੋਟ ਨਹੀਂ ਲੱਭਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਉੱਪਰ ਦਿੱਤੇ ਫਾਰਮ ਤੋਂ ਨਵਾਂ ਨੋਟ ਅੱਪਲੋਡ ਕਰੋ।
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
                        onClick={() => setViewNoteModal(note)}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors cursor-pointer"
                        title="Preview Note HTML"
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

      {/* Admin Preview Modal before Saving */}
      <NotePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onConfirm={handleSaveNote}
        title={noteTitle}
        topicName={selectedTopicObj ? selectedTopicObj.name : ''}
        originalFileName={selectedFile ? selectedFile.name : ''}
        htmlContent={previewContent}
        isSaving={uploading}
      />

      {/* Full View Modal */}
      {viewNoteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold font-gurmukhi">{viewNoteModal.title}</h3>
              <button
                onClick={() => setViewNoteModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <NoteViewer note={viewNoteModal} topicName={viewNoteModal.topic?.name} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmNote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
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
    </div>
  );
};

export default ManageNotesPage;
