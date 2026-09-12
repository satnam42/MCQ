import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PlayCircle, Award, BookOpen, BarChart2, History, Flame, RotateCcw } from 'lucide-react';

const CandidateDashboard = () => {
  const { user } = useAuth();

  const [todayQuiz, setTodayQuiz] = useState(null);
  const [todayQuestionCount, setTodayQuestionCount] = useState(50);
  const [loading, setLoading] = useState(true);
  const [progressSummary, setProgressSummary] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [quizRes, progRes] = await Promise.all([
          api.get('/daily-quiz'),
          api.get('/progress'),
        ]);

        if (quizRes.data.success) {
          setTodayQuiz(quizRes.data.data);
        }
        if (progRes.data.success) {
          setProgressSummary(progRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load candidate dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Daily MCQ Preparation Series 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Candidate'}!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Your daily 50-Question mock test for Punjabi Lecturer Cadre examination is ready.
          </p>
          <p className="text-xs text-slate-400 font-mono">{todayStr}</p>
        </div>
      </div>

      {/* Main Feature Banner: TODAY'S TEST CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-amber-200 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="p-3 rounded-2xl bg-amber-100 text-amber-800">
                <Award className="w-8 h-8 text-amber-600" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Today's Test
                </h2>
                <p className="text-xs text-slate-500">Multiple Choice Questions (Persisted per Date)</p>
              </div>
            </div>

            {/* Question count selector (50, 100, 150) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                How many questions do you want to start?
              </label>
              <div className="flex items-center space-x-2">
                {[50, 100, 150].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTodayQuestionCount(cnt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      todayQuestionCount === cnt
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty breakdown pill grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                <span className="block text-xl font-extrabold text-emerald-800">Easy</span>
                <span className="text-xs font-semibold text-emerald-700">Category</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <span className="block text-xl font-extrabold text-amber-800">Medium</span>
                <span className="text-xs font-semibold text-amber-700">Category</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
                <span className="block text-xl font-extrabold text-rose-800">Tough</span>
                <span className="text-xs font-semibold text-rose-700">Category</span>
              </div>
            </div>
          </div>

          <div className="lg:text-right shrink-0">
            <Link
              to="/daily-quiz"
              state={{ questionCount: todayQuestionCount }}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-base shadow-xl hover:shadow-2xl transition-all scale-100 hover:scale-105"
            >
              <PlayCircle className="w-6 h-6" />
              <span>Start Today's Test ({todayQuestionCount} Qs)</span>
            </Link>
            <p className="text-xs text-slate-400 mt-2 font-medium">{todayQuestionCount} MCQs • Full Explanations Included</p>
          </div>

        </div>
      </div>

      {/* RE-ATTEMPT MISTAKES FEATURE BANNER */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-rose-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Mastery Practice Section</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Re-attempt Incorrect Questions
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Practice questions you answered incorrectly in past attempts. Re-try questions repeatedly with instant explanation feedback.
          </p>
        </div>

        <div>
          <Link
            to="/reattempt-incorrect"
            className="inline-flex items-center space-x-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Re-attempt Mistakes</span>
          </Link>
        </div>
      </div>

      {/* Overview Quick Stats */}
      {progressSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Tests Attempted</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{progressSummary.testsAttempted}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Average Score</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{progressSummary.averageScore}%</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Best Score</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{progressSummary.bestScore}%</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Questions Solved</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{progressSummary.questionsAttempted}</div>
          </div>
        </div>
      )}

      {/* Navigation Shortcut Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Preparation Modes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link
            to="/topic-practice"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">
              Topic Practice
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Practice questions categorized by Punjabi Literature, Grammar, Sufi, Gurmat, and Qissa Literature.
            </p>
          </Link>

          <Link
            to="/progress"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">
              My Progress
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track overall accuracy, performance trends, and identified weak topics needing improvement.
            </p>
          </Link>

          <Link
            to="/history"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">
              Test History
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review all past test attempts, selected answers, correct solutions, and authoritative explanations.
            </p>
          </Link>

        </div>
      </div>

    </div>
  );
};

export default CandidateDashboard;
