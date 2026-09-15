import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ShieldAlert, BookOpen, Upload, Sparkles, CheckCircle, CheckSquare, FileText } from 'lucide-react';


const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/questions/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Admin Management Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Question Bank Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage authentic Punjabi MCQs, CSV bulk import, duplicate detection, and AI generator
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/notes"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span className="font-gurmukhi">Manage Notes</span>
          </Link>
          <Link
            to="/admin/import"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </Link>
          <Link
            to="/admin/ai-generator"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>AI Generator</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Total MCQs</div>
            <div className="text-3xl font-black text-slate-900 mt-2">{stats.totalQuestions}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Verified Questions</div>
            <div className="text-3xl font-black text-emerald-600 mt-2">{stats.verifiedQuestions}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Active Topics</div>
            <div className="text-3xl font-black text-amber-600 mt-2">{stats.totalTopics}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Easy / Medium / Tough</div>
            <div className="text-sm font-bold text-slate-800 mt-2">
              <span className="text-emerald-700">{stats.difficultyBreakdown.easy}</span> /{' '}
              <span className="text-amber-700">{stats.difficultyBreakdown.medium}</span> /{' '}
              <span className="text-rose-700">{stats.difficultyBreakdown.tough}</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link
          to="/admin/notes"
          className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1 font-gurmukhi">
            Manage Study Notes (ਨੋਟਸ)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload `.txt` files, validate format, convert to HTML, preview, update, and manage candidate study material.
          </p>
        </Link>

        
        <Link
          to="/admin/questions"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Manage Question Bank
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Search, filter by topic & difficulty, edit question text, toggle verification, and add new MCQs.
          </p>
        </Link>

        <Link
          to="/admin/import"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Bulk CSV Question Import
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload CSV datasets with automatic duplicate detection, schema validation, and row error reporting.
          </p>
        </Link>

        <Link
          to="/admin/topics"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Manage Topics & Subtopics
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            View topics, check question density, and perform topic deletion with safe transactional question cleanup.
          </p>
        </Link>

        <Link
          to="/admin/ai-generator"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            AI Question Generator
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate candidate Punjabi MCQs by topic using AI strategy layer with admin verification workflow.
          </p>
        </Link>

      </div>

    </div>
  );
};

export default AdminDashboard;
