import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { BarChart2, AlertCircle, PlayCircle } from 'lucide-react';

const ProgressDashboardPage = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get('/progress');
        if (res.data.success) {
          setProgress(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Progress Data Unavailable</h2>
      </div>
    );
  }

  const { testsAttempted, averageScore, bestScore, weakTopics, topicBreakdown } = progress;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-2">
        <div className="flex items-center space-x-3 text-blue-600">
          <BarChart2 className="w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            My Progress Dashboard
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Performance metrics, topic accuracy analytics, and weak topic alerts
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Tests Attempted</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{testsAttempted}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Average Score</div>
          <div className="text-3xl font-black text-amber-600 mt-2">{averageScore}%</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Best Score</div>
          <div className="text-3xl font-black text-emerald-600 mt-2">{bestScore}%</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Weak Topics (&lt;70%)</div>
          <div className="text-3xl font-black text-rose-600 mt-2">{weakTopics.length}</div>
        </div>
      </div>

      {/* WEAK TOPICS ALERT BANNER */}
      {weakTopics.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3 text-rose-800">
            <AlertCircle className="w-7 h-7 text-rose-600 shrink-0" />
            <h2 className="text-xl font-bold">
              Weak Topic Alerts (&lt;70% Accuracy)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
            The system detected lower performance in the following topics. Focus on practicing these areas:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {weakTopics.map((wt, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-gurmukhi">{wt.topic}</h3>
                  <div className="text-xs font-bold text-rose-600 mt-1">{wt.percentage}% Accuracy</div>
                </div>
                <Link
                  to="/topic-practice"
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Practice</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOPIC ACCURACY BREAKDOWN */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
          Topic Accuracy Breakdown
        </h2>

        <div className="space-y-4">
          {topicBreakdown.map((tb, idx) => {
            const isWeak = tb.percentage < 70;
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800 font-gurmukhi">{tb.topic}</span>
                  <span className={`font-black ${isWeak ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {tb.percentage}% ({tb.correct}/{tb.total})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${isWeak ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${tb.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ProgressDashboardPage;
