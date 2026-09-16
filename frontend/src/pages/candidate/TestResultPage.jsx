import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import DifficultyBadge from '../../components/DifficultyBadge';
import { CheckCircle2, XCircle, Award, Clock, RotateCcw } from 'lucide-react';

const TestResultPage = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/tests/${attemptId}/result`);
        if (res.data.success) {
          setResult(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch test result:', err);
        setError('Unable to load test result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl shadow-lg border border-slate-200 text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Result Unavailable</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <Link to="/dashboard" className="inline-block px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { attempt, difficultyPerformance, topicPerformance, questions } = result;

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'correct') return q.isCorrect;
    if (filter === 'incorrect') return !q.isCorrect && q.selectedOption;
    if (filter === 'unanswered') return !q.selectedOption;
    return true;
  });

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainderSecs = sec % 60;
    return `${mins} mins ${remainderSecs} secs`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-2">
          <Award className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Test Completed
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Time Taken: {formatSeconds(attempt.timeTakenSeconds)}</span>
          </div>
          <div>Date: {new Date(attempt.completedAt).toLocaleDateString('en-US')}</div>
        </div>

        {/* Score & Percentage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-amber-800">Score</div>
            <div className="text-3xl font-black text-amber-900 mt-1">
              {attempt.score} <span className="text-sm font-normal text-amber-700">/ {attempt.totalQuestions}</span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-blue-800">Percentage</div>
            <div className="text-3xl font-black text-blue-900 mt-1">{attempt.percentage}%</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-emerald-800">Correct</div>
            <div className="text-3xl font-black text-emerald-900 mt-1">{attempt.correctAnswers}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-rose-800">Incorrect</div>
            <div className="text-3xl font-black text-rose-900 mt-1">
              {attempt.incorrectAnswers} <span className="text-xs text-rose-600 font-normal">({attempt.unanswered} Unanswered)</span>
            </div>
          </div>
        </div>

        {/* Re-attempt Incorrect CTA Banner */}
        {attempt.incorrectAnswers > 0 && (
          <div className="pt-4 max-w-xl mx-auto">
            <Link
              to="/reattempt-incorrect"
              className="inline-flex items-center space-x-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl text-sm shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-attempt Incorrect Questions ({attempt.incorrectAnswers})</span>
            </Link>
          </div>
        )}
      </div>

      {/* Difficulty & Topic Performance Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Difficulty Breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Performance by Difficulty
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-sm font-bold text-emerald-900">Easy</span>
              <span className="text-base font-black text-emerald-800">
                {difficultyPerformance.easy.correct} / {difficultyPerformance.easy.total}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
              <span className="text-sm font-bold text-amber-900">Medium</span>
              <span className="text-base font-black text-amber-800">
                {difficultyPerformance.medium.correct} / {difficultyPerformance.medium.total}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
              <span className="text-sm font-bold text-rose-900">Tough</span>
              <span className="text-base font-black text-rose-800">
                {difficultyPerformance.tough.correct} / {difficultyPerformance.tough.total}
              </span>
            </div>
          </div>
        </div>

        {/* Topic Accuracy Breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Topic Performance
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto palette-scroll pr-1">
            {topicPerformance.map((tp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-sm font-bold text-slate-800 font-gurmukhi">{tp.topic}</div>
                  <div className="text-xs text-slate-500">{tp.correct} / {tp.total} Correct</div>
                </div>
                <div className="text-base font-black text-amber-600">{tp.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Detailed Question Review Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Detailed Answer Review
            </h2>
            <p className="text-xs text-slate-500">Review every question with options, correct answer, and explanation</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filter === 'correct' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Correct ({attempt.correctAnswers})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filter === 'incorrect' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Incorrect ({attempt.incorrectAnswers})
            </button>
            <button
              onClick={() => setFilter('unanswered')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filter === 'unanswered' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unanswered ({attempt.unanswered})
            </button>
          </div>
        </div>

        {/* Question Review List */}
        <div className="space-y-6">
          {filteredQuestions.map((q, index) => {
            const isUserCorrect = q.isCorrect;
            const optionKeys = ['A', 'B', 'C', 'D'];

            return (
              <div
                key={index}
                className={`p-6 rounded-2xl border-2 space-y-4 transition-all ${
                  isUserCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : q.selectedOption
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs font-mono bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md">
                      #{index + 1}
                    </span>
                    <DifficultyBadge difficulty={q.difficulty} />
                    {q.isNew && (
                      <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 text-[10px] uppercase rounded-full tracking-wider shrink-0 shadow-xs">
                        NEW
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                      {q.topicName}
                    </span>
                  </div>

                  <div>
                    {isUserCorrect ? (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct Answer</span>
                      </span>
                    ) : q.selectedOption ? (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                        <XCircle className="w-4 h-4" />
                        <span>Incorrect Answer</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                        <span>Unanswered</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text in Punjabi */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-gurmukhi leading-relaxed">
                  {q.question}
                </h3>

                {/* Options List in Punjabi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {optionKeys.map((key) => {
                    const optText = q.options[key];
                    const isCorrectOpt = q.correctOption === key;
                    const isSelectedOpt = q.selectedOption === key;

                    let optionStyle = 'border-slate-200 bg-white text-slate-800';
                    if (isCorrectOpt) {
                      optionStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                    } else if (isSelectedOpt && !isCorrectOpt) {
                      optionStyle = 'border-rose-500 bg-rose-100 text-rose-900 font-bold';
                    }

                    return (
                      <div key={key} className={`p-3 rounded-xl border-2 flex items-start space-x-3 ${optionStyle}`}>
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 shrink-0">
                          {key}
                        </span>
                        <span className="font-gurmukhi text-sm leading-relaxed">{optText}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box in Punjabi */}
                {q.explanation && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                    <div className="font-bold text-amber-800 flex items-center space-x-1">
                      <span>Explanation:</span>
                    </div>
                    <p className="font-gurmukhi text-sm leading-relaxed text-slate-800 pt-1">
                      {q.explanation}
                    </p>
                    {q.source && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Source: {q.source}
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default TestResultPage;
