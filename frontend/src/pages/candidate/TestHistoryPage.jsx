import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { History, ArrowRight, PlayCircle, Clock } from 'lucide-react';

const TestHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/tests/history');
        if (res.data.success) {
          const list = res.data.data.history || res.data.data.attempts || [];
          setHistory(list);
        }
      } catch (err) {
        console.error('Failed to fetch test history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Test History...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-2">
        <div className="flex items-center space-x-3 text-purple-600">
          <History className="w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Test History
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Review all your completed daily mock tests, topic practice sessions, and detailed answer keys
        </p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-sm">
          <Clock className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Previous Test Attempts Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't completed any mock tests yet. Start today's test to begin tracking your exam score history.
          </p>
          <div className="pt-2">
            <Link
              to="/daily-quiz"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-sm shadow-md transition-all"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Start Today's Test</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Test Type</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Percentage</th>
                  <th className="py-4 px-6">Time Taken</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {history.map((item) => {
                  const dateObj = item.completedAt || item.startedAt;
                  const dateStr = dateObj ? new Date(dateObj).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : 'Today';

                  const mins = Math.floor((item.timeTakenSeconds || 0) / 60);
                  const secs = (item.timeTakenSeconds || 0) % 60;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900">{dateStr}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          item.testType === 'daily' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {item.testType === 'daily' ? "Daily Test" : "Topic Practice"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {item.score} / {item.totalQuestions}
                      </td>
                      <td className="py-4 px-6 font-black text-amber-600">{item.percentage}%</td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                        {mins}m {secs}s
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/test-result/${item.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-200 transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default TestHistoryPage;
