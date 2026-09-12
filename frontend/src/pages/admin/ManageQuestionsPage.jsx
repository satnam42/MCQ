import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import DifficultyBadge from '../../components/DifficultyBadge';
import { Search, Plus, Edit3, Trash2, CheckCircle2, XCircle, Download, FileText, BookOpen } from 'lucide-react';

const ManageQuestionsPage = () => {
  const location = useLocation();

  // Read URL query params (e.g. /admin/questions?topicId=12)
  const searchParams = new URLSearchParams(location.search);
  const initialTopic = searchParams.get('topicId') || '';
  const initialDifficulty = searchParams.get('difficulty') || '';

  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialDifficulty);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
    topicId: '',
    difficulty: 'medium',
    source: '',
  });

  const handleExport = async (format) => {
    try {
      const topicQuery = selectedTopic ? `&topicId=${selectedTopic}` : '';
      const diffQuery = selectedDifficulty ? `&difficulty=${selectedDifficulty}` : '';
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/questions/export?format=${format}${topicQuery}${diffQuery}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questions_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export questions:', err);
      alert('Failed to export questions.');
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const topicQuery = selectedTopic ? `&topicId=${selectedTopic}` : '';
      const diffQuery = selectedDifficulty ? `&difficulty=${selectedDifficulty}` : '';
      const searchQuery = search ? `&search=${encodeURIComponent(search)}` : '';

      const res = await api.get(`/questions?page=${page}&limit=10${topicQuery}${diffQuery}${searchQuery}`);
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/topics');
        if (res.data.success) {
          setTopics(res.data.data.topics || []);
        }
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const topicParam = params.get('topicId') || '';
    const diffParam = params.get('difficulty') || '';
    setSelectedTopic(topicParam);
    setSelectedDifficulty(diffParam);
  }, [location.search]);

  useEffect(() => {
    setSelectedIds([]);
    fetchQuestions();
  }, [page, selectedTopic, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedIds([]);
    setPage(1);
    fetchQuestions();
  };

  const isAllSelected = questions.length > 0 && questions.every((q) => selectedIds.includes(q.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = questions.map((q) => q.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = questions.map((q) => q.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected question(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.post('/questions/bulk-delete', { ids: selectedIds });
      if (res.data.success) {
        setSelectedIds([]);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to bulk delete questions:', err);
      alert('Failed to delete selected questions.');
    }
  };

  const handleToggleVerify = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/questions/${id}/verify`, { isVerified: !currentStatus });
      if (res.data.success) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to toggle verification:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await api.delete(`/questions/${id}`);
      if (res.data.success) {
        setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormData({
      question: q.question,
      optionA: q.options?.A || q.option_a,
      optionB: q.options?.B || q.option_b,
      optionC: q.options?.C || q.option_c,
      optionD: q.options?.D || q.option_d,
      correctOption: q.correctOption || q.correct_option,
      explanation: q.explanation || '',
      topicId: q.topicId || q.topic_id || '',
      difficulty: q.difficulty || 'medium',
      source: q.source || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormData({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanation: '',
      topicId: topics[0]?.id || '',
      difficulty: 'medium',
      source: '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, formData);
      } else {
        await api.post('/questions', formData);
      }
      setIsEditModalOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question. Please check duplicate detector alerts.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Question Bank</h1>
          <p className="text-xs text-slate-500">View, edit, search, and verify Punjabi MCQs</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 animate-in fade-in"
              title="Delete all selected questions"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
          <Link
            to="/admin/topics"
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
            title="View and manage topics"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manage Topics</span>
          </Link>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
            title="Download all questions as CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
            title="Download all questions as JSON file"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New MCQ</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Punjabi question text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-gurmukhi"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="tough">Tough</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                      title="Select all questions on this page"
                    />
                  </th>
                  <th className="py-4 px-4">ID</th>
                  <th className="py-4 px-6 max-w-md">Question Text (Punjabi)</th>
                  <th className="py-4 px-6">Topic</th>
                  <th className="py-4 px-6">Difficulty</th>
                  <th className="py-4 px-6">Verified</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {questions.map((q) => {
                  const isRowSelected = selectedIds.includes(q.id);
                  return (
                    <tr
                      key={q.id}
                      className={`transition-colors ${
                        isRowSelected ? 'bg-rose-50/60 hover:bg-rose-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleToggleSelect(q.id)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-500">#{q.id}</td>
                      <td className="py-4 px-6 font-gurmukhi font-semibold text-slate-900 max-w-md truncate">
                        {q.question}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 font-medium font-gurmukhi">
                        {q.topicName || q.Topic?.name}
                      </td>
                      <td className="py-4 px-6">
                        <DifficultyBadge difficulty={q.difficulty} />
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleVerify(q.id, q.isVerified)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            q.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {q.isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{q.isVerified ? 'Verified' : 'Pending'}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Question"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <span>Page {page} of {totalPages}</span>
          <div className="space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b pb-3">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Question Text (Punjabi):</label>
                <textarea
                  required
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 font-gurmukhi text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Option A:</label>
                  <input
                    type="text"
                    required
                    value={formData.optionA}
                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-gurmukhi focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Option B:</label>
                  <input
                    type="text"
                    required
                    value={formData.optionB}
                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-gurmukhi focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Option C:</label>
                  <input
                    type="text"
                    required
                    value={formData.optionC}
                    onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-gurmukhi focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Option D:</label>
                  <input
                    type="text"
                    required
                    value={formData.optionD}
                    onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-gurmukhi focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Correct Option:</label>
                  <select
                    value={formData.correctOption}
                    onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Difficulty:</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="tough">Tough</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Topic:</label>
                  <select
                    value={formData.topicId}
                    onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-gurmukhi"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Explanation (Punjabi):</label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-gurmukhi focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md"
                >
                  Save Question
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManageQuestionsPage;
