import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import DifficultyBadge from '../../components/DifficultyBadge';
import { RotateCcw, CheckCircle2, XCircle, ChevronLeft, ChevronRight, BookOpen, Sparkles, Award } from 'lucide-react';

const ReattemptIncorrectPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // { [qIndex]: 'A' | 'B' ... }
  const [showExplanations, setShowExplanations] = useState({}); // { [qIndex]: true }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    const fetchIncorrectQuestions = async () => {
      try {
        const res = await api.get('/tests/incorrect-questions');
        if (res.data.success) {
          setQuestions(res.data.data.questions || []);
        }
      } catch (err) {
        console.error('Failed to fetch incorrect questions:', err);
        setError('Unable to load incorrect questions.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncorrectQuestions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Incorrect Questions Bank...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center space-y-4">
        <Award className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Incorrect Questions Found</h2>
        <p className="text-sm text-slate-600">
          Great job! You haven't made any mistakes in recent test attempts.
        </p>
        <div className="pt-2">
          <Link to="/daily-quiz" className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-2xl text-sm shadow-md inline-block">
            Start Today's Test
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const selectedOption = selectedOptions[currentIndex];
  const isAnswered = selectedOption !== undefined;
  const isCorrect = selectedOption === currentQuestion.correctOption;

  const handleSelectOption = (optionKey) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [currentIndex]: optionKey,
    }));
    setShowExplanations((prev) => ({
      ...prev,
      [currentIndex]: true,
    }));

    if (optionKey === currentQuestion.correctOption) {
      setMasteredCount((prev) => prev + 1);
    }
  };

  const handleResetCurrentQuestion = () => {
    setSelectedOptions((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
    setShowExplanations((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const optionKeys = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 text-white rounded-3xl p-8 shadow-xl border border-rose-900/40 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1 rounded-full text-xs font-semibold">
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>Infinite Re-attempt Practice Mode</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Re-attempt Incorrect Questions
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Practice questions you got wrong in past tests. Answer repeatedly until you master every concept!
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500">Incorrect Questions Bank</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{totalQuestions}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500">Current Question</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{currentIndex + 1} / {totalQuestions}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500">Correct in Session</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{masteredCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500">Mastery Progress</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {Math.round((masteredCount / totalQuestions) * 100)}%
          </div>
        </div>
      </div>

      {/* Main Grid: Re-attempt Question Card + Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Re-attempt Question Interactive Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            
            {/* Card Header Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="bg-rose-100 text-rose-900 px-3 py-1 rounded-full text-xs font-bold font-mono">
                  Incorrect Question #{currentIndex + 1}
                </span>
                <DifficultyBadge difficulty={currentQuestion.difficulty} />
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                  {currentQuestion.topicName}
                </span>
              </div>

              {/* Reset Current Button to Re-try again */}
              <button
                onClick={handleResetCurrentQuestion}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Re-try this question"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-try Question</span>
              </button>
            </div>

            {/* Question Text in Punjabi */}
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed font-gurmukhi">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options List in Punjabi with Instant Visual Feedback */}
            <div className="space-y-3">
              {optionKeys.map((key) => {
                const optionText = currentQuestion.options[key];
                const isSelected = selectedOption === key;
                const isCorrectOption = currentQuestion.correctOption === key;

                let cardStyle = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50';
                let circleStyle = 'bg-slate-100 text-slate-700';

                if (isAnswered) {
                  if (isCorrectOption) {
                    cardStyle = 'border-emerald-500 bg-emerald-50/80 shadow-sm';
                    circleStyle = 'bg-emerald-600 text-white font-bold';
                  } else if (isSelected && !isCorrectOption) {
                    cardStyle = 'border-rose-500 bg-rose-50/80 shadow-sm';
                    circleStyle = 'bg-rose-600 text-white font-bold';
                  }
                }

                return (
                  <div
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all ${cardStyle}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center mr-3.5 shrink-0 transition-colors ${circleStyle}`}
                    >
                      {key}
                    </div>
                    <div className="text-base text-slate-900 pt-0.5 leading-relaxed font-gurmukhi font-medium flex-1">
                      {optionText}
                    </div>

                    {isAnswered && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2 mt-1" />
                    )}
                    {isAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instant Answer Feedback & Punjabi Explanation */}
            {isAnswered && (
              <div className={`p-5 rounded-2xl border space-y-2 animate-in fade-in duration-200 ${
                isCorrect ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-900">Correct! Excellent improvement!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span className="text-rose-900">Incorrect Choice. Correct answer is Option ({currentQuestion.correctOption})</span>
                    </>
                  )}
                </div>

                {currentQuestion.explanation && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-bold text-slate-700 block mb-1">Explanation:</span>
                    <p className="font-gurmukhi text-sm text-slate-900 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                    {currentQuestion.source && (
                      <p className="text-[11px] text-slate-500 italic mt-1">Source: {currentQuestion.source}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Nav Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === totalQuestions - 1}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1.5"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Question Navigator Palette */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 sticky top-20">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex justify-between items-center">
              <span>Incorrect Questions List</span>
              <span className="text-xs font-mono bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold">
                {totalQuestions} MCQs
              </span>
            </h3>

            <div className="max-h-72 overflow-y-auto palette-scroll pr-1">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const selOpt = selectedOptions[idx];
                  const isDone = selOpt !== undefined;
                  const isRight = selOpt === q.correctOption;

                  let style = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                  if (isDone) {
                    style = isRight ? 'bg-emerald-600 text-white font-bold' : 'bg-rose-600 text-white font-bold';
                  }

                  if (isCurrent) {
                    style += ' ring-2 ring-amber-500 ring-offset-2 scale-105';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-full rounded-xl text-xs flex items-center justify-center transition-all ${style}`}
                      title={`Question #${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs space-y-2 text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                <span>Mastered Correctly</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
                <span>Needs Re-attempt</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 inline-block"></span>
                <span>Pending Attempt</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReattemptIncorrectPage;
