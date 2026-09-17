import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen, Trash2, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, ArrowLeft } from 'lucide-react';

const ManageTopicsPage = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Delete Modal State
  const [deleteTopicData, setDeleteTopicData] = useState(null); // { id, name, questionCount }
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTopics = async (filter = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const url = filter && filter !== 'all' ? `/topics?status=${filter}` : '/topics';
      const res = await api.get(url);
      if (res.data.success) {
        setTopics(res.data.data.topics || []);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      setError('Unable to load topics list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics(statusFilter);
  }, [statusFilter]);

  const handleOpenDeleteModal = (topic) => {
    setDeleteTopicData({
      id: topic.id,
      name: topic.name,
      questionCount: topic.questionCount || 0,
    });
    setModalError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isDeleting) return; // Prevent closing while API call is in-flight
    setIsDeleteModalOpen(false);
    setDeleteTopicData(null);
    setModalError('');
  };

  const handleConfirmDeleteTopic = async () => {
    if (!deleteTopicData || isDeleting) return; // Prevent duplicate requests

    setIsDeleting(true);
    setModalError('');

    try {
      const res = await api.delete(`/topics/${deleteTopicData.id}`);

      if (res.data.success) {
        const deletedCount = res.data.data?.deletedQuestions ?? deleteTopicData.questionCount;
        setSuccessBanner(`Topic "${deleteTopicData.name}" and ${deletedCount} associated question(s) deleted successfully.`);
        
        setIsDeleteModalOpen(false);
        setDeleteTopicData(null);
        
        // Refresh topics list and question metrics
        await fetchTopics();

        // Auto-dismiss success banner after 5 seconds
        setTimeout(() => {
          setSuccessBanner('');
        }, 5000);
      } else {
        setModalError(res.data.message || 'Failed to delete topic.');
      }
    } catch (err) {
      console.error('Failed to delete topic:', err);
      const message = err.response?.data?.message || err.message || 'Server error occurred while deleting topic.';
      setModalError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalQuestionsSum = topics.reduce((sum, t) => sum + (parseInt(t.questionCount, 10) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2">
            <Link to="/admin" className="text-xs font-semibold text-slate-400 hover:text-amber-400 flex items-center transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Admin Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Manage Exam Topics & Subtopics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            View topics, monitor question density, and perform topic maintenance.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/admin/questions"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center space-x-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Manage Question Bank</span>
          </Link>
          <button
            onClick={fetchTopics}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Refresh topics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-xs text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl flex items-center space-x-3 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Active Topics</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{topics.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Catalog Questions</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalQuestionsSum}</div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Average Questions / Topic</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {topics.length > 0 ? Math.round(totalQuestionsSum / topics.length) : 0}
          </div>
        </div>
      </div>

      {/* Topics Grid Header & Status Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Active Topics List</span>
            <span className="text-xs font-normal text-slate-500">({topics.length} Topics)</span>
          </h2>

          {/* Admin Status Filter Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Topics
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                statusFilter === 'new'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>New</span>
            </button>
            <button
              onClick={() => setStatusFilter('expired_new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'expired_new'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expired New
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500 mt-3">Loading topics and question counts...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Topics Found</h3>
            <p className="text-xs text-slate-500">No active topics matching the selected filter were found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((t) => {
              const qCount = parseInt(t.questionCount, 10) || 0;
              const subtopicsList = t.subtopics || [];

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold font-mono">
                          <span>ID #{t.id}</span>
                        </div>
                        {t.isNew && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black px-2.5 py-0.5 text-[10px] uppercase rounded-full tracking-wider shadow-xs shrink-0 animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                        {qCount} Questions
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-gurmukhi leading-snug flex items-center space-x-2">
                        <span>{t.name}</span>
                      </h3>
                      {t.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-gurmukhi">
                          {t.description}
                        </p>
                      )}
                    </div>

                    {/* Subtopics Badges */}
                    {subtopicsList.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Subtopics ({subtopicsList.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {subtopicsList.map((st) => (
                            <span key={st.id} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-gurmukhi">
                              {st.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/admin/questions?topicId=${t.id}`}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 transition-colors"
                    >
                      <span>View Questions</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleOpenDeleteModal(t)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1"
                      title={`Delete topic ${t.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Topic</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Topic Confirmation Modal */}
      {isDeleteModalOpen && deleteTopicData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center space-x-3 text-rose-600 border-b border-slate-100 pb-4">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Delete Topic?</h3>
                <p className="text-xs text-slate-500 font-medium">Permanent topic & question removal</p>
              </div>
            </div>

            {modalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Topic Details Info Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Topic Name:</span>
                <span className="text-base font-bold text-slate-900 font-gurmukhi block mt-0.5">
                  {deleteTopicData.name}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Associated Questions:</span>
                <span className="text-sm font-black text-rose-600 block mt-0.5">
                  {deleteTopicData.questionCount} {deleteTopicData.questionCount === 1 ? 'Question' : 'Questions'}
                </span>
              </div>
            </div>

            {/* Warning Text */}
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Warning</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                This will permanently delete the topic <strong>"{deleteTopicData.name}"</strong> and all{' '}
                <strong>{deleteTopicData.questionCount} questions</strong> associated with it. This action cannot be undone.
              </p>
            </div>

            {/* Footer Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteTopic}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Deleting Topic...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Topic</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManageTopicsPage;
