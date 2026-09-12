import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BarChart2,
  TrendingUp,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  BookOpen,
  Target,
  Zap,
  HelpCircle
} from 'lucide-react';

const formatSeconds = (totalSec) => {
  if (!totalSec || totalSec <= 0) return '0 min';
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs} sec`;
  return `${mins}m ${secs}s`;
};

const ProgressDashboardPage = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await api.get('/progress');
      if (res.data.success) {
        setProgress(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch progress analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="text-sm font-semibold text-slate-600">Calculating your MCQ performance analytics...</p>
      </div>
    );
  }

  // 8. Empty State Handling
  const testsAttempted = progress?.testsAttempted || 0;
  if (!progress || testsAttempted === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center space-x-3 text-blue-600">
            <BarChart2 className="w-8 h-8" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              My Progress & Analytics
            </h1>
          </div>
          <p className="text-sm text-slate-600">
            Track accuracy trends, topic strengths, time statistics, and streaks as you complete tests.
          </p>
        </div>

        {/* Empty State Banner Card */}
        <div className="max-w-2xl mx-auto my-8 p-8 sm:p-12 bg-white rounded-3xl shadow-lg border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <BarChart2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Start your first test to see your progress analytics.
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Complete practice tests to unlock accuracy charts, streak tracking, strengths & weaknesses analysis, and detailed test history.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/daily-quiz"
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Start Today's Test</span>
            </Link>

            <Link
              to="/topic-practice"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>Topic Practice</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Destructure computed analytics from backend
  const {
    questionsAttempted = 0,
    totalCorrectAnswers = 0,
    totalIncorrectAnswers = 0,
    totalUnanswered = 0,
    overallAccuracy = 0,
    averageScore = 0,
    bestScore = 0,
    currentStreak = 0,
    bestStreak = 0,
    scoreHistory = [],
    topicAccuracy = [],
    strengths = [],
    weaknesses = [],
    difficultyAccuracy = { easy: 0, medium: 0, tough: 0 },
    recentTests = [],
    timeAnalytics = {},
    weakTopics = [],
  } = progress;

  // Goals math
  const nextTargetQuestions = Math.ceil((questionsAttempted + 1) / 500) * 500 || 500;
  const questionsProgressPct = Math.min(Math.round((questionsAttempted / nextTargetQuestions) * 100), 100);
  const targetAccuracy = 85;
  const accuracyGap = Math.max(0, targetAccuracy - overallAccuracy);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 0. Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 text-blue-600">
            <BarChart2 className="w-8 h-8" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              My Progress & Analytics
            </h1>
          </div>
          <p className="text-sm text-slate-600">
            Comprehensive learning performance, topic mastery, accuracy trends, and streaks
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{currentStreak} Day Streak</span>
          </div>
          <Link
            to="/daily-quiz"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-1.5"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Take Test</span>
          </Link>
        </div>
      </div>

      {/* 1. Summary Cards (9 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Tests</span>
          <div className="text-3xl font-black text-slate-900">{testsAttempted}</div>
          <span className="text-[11px] font-semibold text-slate-400 block">Completed sessions</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Questions Attempted</span>
          <div className="text-3xl font-black text-slate-900">{questionsAttempted}</div>
          <span className="text-[11px] font-semibold text-slate-400 block">Total MCQs solved</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Correct Answers</span>
          <div className="text-3xl font-black text-emerald-600">{totalCorrectAnswers}</div>
          <span className="text-[11px] font-semibold text-emerald-700 block">Right choices</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Incorrect Answers</span>
          <div className="text-3xl font-black text-rose-600">{totalIncorrectAnswers}</div>
          <span className="text-[11px] font-semibold text-rose-700 block">Wrong choices</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Overall Accuracy</span>
          <div className="text-3xl font-black text-amber-600">{overallAccuracy}%</div>
          <span className="text-[11px] font-semibold text-amber-700 block">Average correct rate</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Average Score</span>
          <div className="text-3xl font-black text-blue-600">{averageScore}%</div>
          <span className="text-[11px] font-semibold text-blue-700 block">Per test average</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Best Score</span>
          <div className="text-3xl font-black text-emerald-600">{bestScore}%</div>
          <span className="text-[11px] font-semibold text-emerald-700 block">Highest record</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-amber-200 bg-amber-50/40 shadow-sm space-y-1">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>Current Streak</span>
          </span>
          <div className="text-3xl font-black text-amber-700">{currentStreak} <span className="text-base font-bold">Days</span></div>
          <span className="text-[11px] font-semibold text-amber-800 block">Active daily practice</span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-200 bg-purple-50/40 shadow-sm space-y-1">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>Best Streak</span>
          </span>
          <div className="text-3xl font-black text-purple-700">{bestStreak} <span className="text-base font-bold">Days</span></div>
          <span className="text-[11px] font-semibold text-purple-800 block">All-time record</span>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Chart A: Accuracy Trend (SVG Line Chart) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span>Accuracy Trend</span>
              </h3>
              <p className="text-xs text-slate-500">Performance percentage across previous test attempts</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
              {scoreHistory.length} Tests
            </span>
          </div>

          {scoreHistory.length > 0 ? (
            <div className="pt-2 space-y-4">
              {/* Visual SVG Line Representation */}
              <div className="relative h-48 w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#e2e8f0" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#e2e8f0" strokeDasharray="4" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeDasharray="4" />

                  {/* Draw Trend Line */}
                  {(() => {
                    const points = scoreHistory.map((item, idx) => {
                      const x = scoreHistory.length === 1 ? 250 : (idx / (scoreHistory.length - 1)) * 460 + 20;
                      const y = 140 - (item.percentage / 100) * 120;
                      return { x, y, pct: item.percentage, testNum: item.testNum };
                    });

                    const pathD = points.reduce((acc, p, idx) => {
                      return `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                    }, '');

                    return (
                      <>
                        {/* Gradient Fill under line */}
                        <path
                          d={`${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`}
                          fill="rgba(245, 158, 11, 0.15)"
                        />
                        {/* Line */}
                        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Points */}
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                              {p.pct}%
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Attempt pills list */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {scoreHistory.map((sh, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">
                    Test {sh.testNum}: <strong className="text-slate-900">{sh.percentage}%</strong>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No test data available yet.</p>
          )}
        </div>

        {/* Chart B: Correct vs Incorrect (Donut Chart) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Correct vs Incorrect Answers</span>
            </h3>
            <p className="text-xs text-slate-500">Proportion of correct, incorrect, and unanswered questions</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray={`${overallAccuracy}, 100`}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">{overallAccuracy}%</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Accuracy</span>
              </div>
            </div>

            {/* Legend Stats */}
            <div className="space-y-3 w-full sm:w-auto text-xs font-semibold">
              <div className="flex items-center justify-between space-x-6 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-2 text-emerald-900">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Correct Answers:</span>
                </div>
                <span className="font-bold text-emerald-700 text-sm">{totalCorrectAnswers} ({questionsAttempted > 0 ? Math.round((totalCorrectAnswers/questionsAttempted)*100) : 0}%)</span>
              </div>

              <div className="flex items-center justify-between space-x-6 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <div className="flex items-center space-x-2 text-rose-900">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>Incorrect Answers:</span>
                </div>
                <span className="font-bold text-rose-700 text-sm">{totalIncorrectAnswers} ({questionsAttempted > 0 ? Math.round((totalIncorrectAnswers/questionsAttempted)*100) : 0}%)</span>
              </div>

              {totalUnanswered > 0 && (
                <div className="flex items-center justify-between space-x-6 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
                    <span>Unanswered:</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{totalUnanswered}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Chart C & D: Topic & Difficulty Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Topic Performance Bar Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Topic Performance & Accuracy</h3>
              <p className="text-xs text-slate-500">Calculated dynamically from your actual completed quiz attempts</p>
            </div>
            <Link to="/topic-practice" className="text-xs font-bold text-amber-600 hover:underline">
              Practice Topics →
            </Link>
          </div>

          <div className="space-y-4">
            {topicAccuracy.length > 0 ? (
              topicAccuracy.map((t, idx) => {
                const acc = t.accuracy || t.percentage || 0;
                let barColor = 'bg-emerald-500';
                let textColor = 'text-emerald-700';
                if (acc < 70) {
                  barColor = 'bg-rose-500';
                  textColor = 'text-rose-700';
                } else if (acc < 80) {
                  barColor = 'bg-amber-500';
                  textColor = 'text-amber-700';
                }

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                      <span className="font-bold text-slate-800 font-gurmukhi">{t.topic}</span>
                      <span className={`font-black ${textColor}`}>
                        {acc}% ({t.correct || Math.round((acc*t.totalQuestions)/100)} / {t.totalQuestions})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500">Topic performance will populate as you solve topic tests.</p>
            )}
          </div>
        </div>

        {/* Difficulty Performance */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Difficulty Performance</h3>
            <p className="text-xs text-slate-500">Accuracy rate breakdown by question difficulty</p>
          </div>

          <div className="space-y-4">
            {/* Easy */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-950">
                <span>Easy Questions</span>
                <span className="text-base font-black text-emerald-700">{difficultyAccuracy.easy || 0}%</span>
              </div>
              <div className="w-full bg-emerald-200/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${difficultyAccuracy.easy || 0}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                <span>Medium Questions</span>
                <span className="text-base font-black text-amber-700">{difficultyAccuracy.medium || 0}%</span>
              </div>
              <div className="w-full bg-amber-200/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${difficultyAccuracy.medium || 0}%` }}
                />
              </div>
            </div>

            {/* Tough */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-rose-950">
                <span>Tough Questions</span>
                <span className="text-base font-black text-rose-700">{difficultyAccuracy.tough || 0}%</span>
              </div>
              <div className="w-full bg-rose-200/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${difficultyAccuracy.tough || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Your Strengths */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-700 border-b border-slate-100 pb-3">
            <Award className="w-6 h-6 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Your Strengths</h3>
          </div>

          <div className="space-y-3">
            {strengths.length > 0 ? (
              strengths.map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-sm font-gurmukhi block">{s.topic}</span>
                    <span className="text-[11px] text-slate-500">Based on recent MCQs solved</span>
                  </div>
                  <span className="text-base font-black text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-300">
                    {s.accuracy}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Complete more tests to generate your top strengths.</p>
            )}
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 text-rose-700 border-b border-slate-100 pb-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <h3 className="text-lg font-bold text-slate-900">Needs Improvement</h3>
          </div>

          <div className="space-y-3">
            {weaknesses.length > 0 ? (
              weaknesses.map((w, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-sm font-gurmukhi block">{w.topic}</span>
                    <span className="text-[11px] text-rose-800 font-semibold">Recommended for re-attempt</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black text-rose-700 bg-white px-3 py-1 rounded-xl border border-rose-300">
                      {w.accuracy}%
                    </span>
                    <Link
                      to="/topic-practice"
                      className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors"
                      title="Practice this topic"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No weak topics identified yet!</p>
            )}
          </div>
        </div>

      </div>

      {/* 5. Progress / Goals & Time Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Progress & Goals */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Target className="w-5 h-5 text-amber-500" />
              <span>Practice Goals & Milestones</span>
            </h3>
            <p className="text-xs text-slate-500">Track your progress toward practice volume and accuracy targets</p>
          </div>

          {/* Goal 1: Questions Practiced */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Questions Practiced Milestone</span>
              <span className="text-sm font-extrabold text-amber-600">{questionsAttempted} / {nextTargetQuestions}</span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${questionsProgressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-0.5">
              <span>Progress: {questionsProgressPct}%</span>
              <span>{nextTargetQuestions - questionsAttempted} questions to next milestone</span>
            </div>
          </div>

          {/* Goal 2: Accuracy Target */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Target Accuracy Goal</span>
              <span className="text-sm font-extrabold text-emerald-600">Current: {overallAccuracy}% • Target: {targetAccuracy}%</span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((overallAccuracy / targetAccuracy) * 100))}%` }}
              />
            </div>
            <div className="text-[11px] font-semibold text-slate-600 pt-0.5">
              {accuracyGap > 0 ? (
                <span>Improve by <strong>+{accuracyGap}%</strong> to reach your target examination readiness goal.</span>
              ) : (
                <span className="text-emerald-700 font-bold">🎉 Target accuracy reached! Keep maintaining this high performance.</span>
              )}
            </div>
          </div>
        </div>

        {/* Time Analytics */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Time Analytics</span>
            </h3>
            <p className="text-xs text-slate-500">Speed and time management statistics</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Avg Time / Question</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {timeAnalytics.avgTimePerQuestionSeconds || 0} sec
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Avg Test Duration</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatSeconds(timeAnalytics.avgTestTimeSeconds)}
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 block">Fastest Test</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {formatSeconds(timeAnalytics.fastestTestSeconds)}
              </span>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <span className="text-xs font-semibold text-amber-800 block">Slowest Test</span>
              <span className="text-xl font-black text-amber-700 mt-1 block">
                {formatSeconds(timeAnalytics.slowestTestSeconds)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Recent Test History Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Recent Tests</h3>
            <p className="text-xs text-slate-500">Your latest completed test sessions and scores</p>
          </div>

          <Link to="/history" className="text-xs font-bold text-amber-600 hover:underline">
            View Full History →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-4 rounded-l-xl">Test #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-center">Questions</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Accuracy</th>
                <th className="py-3.5 px-4 text-center">Time Taken</th>
                <th className="py-3.5 px-4 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-semibold text-slate-800">
              {recentTests.length > 0 ? (
                recentTests.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      Test #{t.testNum || recentTests.length - idx}
                      <span className="text-[11px] font-normal text-slate-400 block capitalize">{t.testType}</span>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-500">
                      {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold">
                      {t.totalQuestions}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-900">
                      {t.correctAnswers} / {t.totalQuestions}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        t.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        t.percentage >= 65 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.percentage}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-600">
                      {formatSeconds(t.timeTakenSeconds)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/test-result/${t.attemptId}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs inline-flex items-center space-x-1"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-xs text-slate-400">
                    No recent tests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ProgressDashboardPage;
