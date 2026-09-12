import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import QuestionCard from '../../components/QuestionCard';
import QuestionNavigator from '../../components/QuestionNavigator';
import QuizTimer from '../../components/QuizTimer';
import ProgressBar from '../../components/ProgressBar';
import ResultSummaryModal from '../../components/ResultSummaryModal';
import ResetConfirmationModal from '../../components/ResetConfirmationModal';
import { saveTestProgress, restoreTestProgress, clearTestProgress } from '../../utils/testCache';
import { ChevronLeft, ChevronRight, Send, AlertCircle, RotateCcw, CheckCircle2 } from 'lucide-react';

const DailyQuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeQuestionCount = location.state?.questionCount || 50;

  const [quizData, setQuizData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questionCount, setQuestionCount] = useState(routeQuestionCount);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRestoredBannerVisible, setIsRestoredBannerVisible] = useState(false);

  const questionRef = useRef(null);

  // Mobile scroll restoration override on mount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Smoothly scroll the current question container to top of mobile viewport whenever question changes
  useEffect(() => {
    if (!loading && questionRef.current) {
      requestAnimationFrame(() => {
        questionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
      const timer = setTimeout(() => {
        questionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, loading]);

  useEffect(() => {
    const initDailyQuiz = async () => {
      // 1. Check if an unfinished test progress exists in cache
      const cached = restoreTestProgress();
      if (cached && cached.testType === 'daily' && cached.questions && cached.questions.length > 0) {
        setQuizData({
          id: cached.dailyQuizId,
          quizDate: cached.quizDate || 'Today',
          questions: cached.questions,
        });
        setAttemptId(cached.testId);
        setQuestionCount(cached.totalQuestions || cached.questions.length || 50);
        setCurrentIndex(cached.currentQuestionIndex || 0);
        setAnswers(cached.selectedAnswers || {});
        setMarkedForReview(cached.markedForReview || {});
        setSeconds(cached.elapsedTime || 0);
        setIsRestoredBannerVisible(true);
        setLoading(false);
        return;
      }

      // 2. Otherwise load today's test fresh with target limit
      try {
        const quizRes = await api.get(`/daily-quiz?limit=${routeQuestionCount}`);
        if (quizRes.data.success) {
          const quiz = quizRes.data.data;
          setQuizData(quiz);
          setQuestionCount(quiz.questions.length);

          // Start Test Attempt
          const startRes = await api.post('/tests/start', {
            dailyQuizId: quiz.id,
            testType: 'daily',
            totalQuestions: quiz.questions.length,
          });

          if (startRes.data.success) {
            const newAttemptId = startRes.data.data.attemptId;
            setAttemptId(newAttemptId);
            saveTestProgress({
              testId: newAttemptId,
              testType: 'daily',
              title: "Today's Daily Test",
              dailyQuizId: quiz.id,
              quizDate: quiz.quizDate,
              totalQuestions: quiz.questions.length,
              questions: quiz.questions,
              currentQuestionIndex: 0,
              selectedAnswers: {},
              markedForReview: {},
              elapsedTime: 0,
              status: 'in-progress',
            });
          }
        }
      } catch (err) {
        console.error('Failed to initialize daily quiz:', err);
        setError('Unable to load test. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initDailyQuiz();
  }, []);

  // Automatically save test progress on state changes
  useEffect(() => {
    if (!loading && attemptId && quizData && quizData.questions?.length > 0) {
      saveTestProgress({
        testId: attemptId,
        testType: 'daily',
        title: "Today's Daily Test",
        dailyQuizId: quizData.id,
        quizDate: quizData.quizDate,
        totalQuestions: quizData.questions.length,
        questions: quizData.questions,
        currentQuestionIndex: currentIndex,
        selectedAnswers: answers,
        markedForReview: markedForReview,
        elapsedTime: seconds,
        status: 'in-progress',
      });
    }
  }, [loading, attemptId, quizData, currentIndex, answers, markedForReview, seconds]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Today's Test...</p>
      </div>
    );
  }

  if (error || !quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl shadow-lg border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Test Available</h2>
        <p className="text-sm text-slate-600">{error || 'Today\'s test is unavailable.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const questions = quizData.questions;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleSelectOption = (optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionKey,
    }));
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  const handleToggleMark = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      // 1. Clear saved test progress from localStorage
      clearTestProgress();

      const targetSize = questionCount || questions.length || 50;
      const quizRes = await api.get(`/daily-quiz?limit=${targetSize}`);
      const freshQuiz = quizRes.data.success ? quizRes.data.data : quizData;

      // 2. Start a new test attempt
      const startRes = await api.post('/tests/start', {
        dailyQuizId: freshQuiz.id,
        testType: 'daily',
        totalQuestions: freshQuiz.questions.length,
      });

      if (startRes.data.success) {
        const newAttemptId = startRes.data.data.attemptId;
        setAttemptId(newAttemptId);
        setQuizData(freshQuiz);

        // 3. Reset internal test state
        setAnswers({});
        setMarkedForReview({});
        setCurrentIndex(0);
        setSeconds(0);
        setIsRestoredBannerVisible(false);

        // Save fresh test state
        saveTestProgress({
          testId: newAttemptId,
          testType: 'daily',
          title: "Today's Daily Test",
          dailyQuizId: freshQuiz.id,
          quizDate: freshQuiz.quizDate,
          totalQuestions: freshQuiz.questions.length,
          questions: freshQuiz.questions,
          currentQuestionIndex: 0,
          selectedAnswers: {},
          markedForReview: {},
          elapsedTime: 0,
          status: 'in-progress',
        });
      }
    } catch (err) {
      console.error('Failed to reset test:', err);
      alert('Failed to reset test session. Please try again.');
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!attemptId) return;
    setIsSubmitting(true);

    try {
      const answersPayload = questions.map((q, idx) => ({
        questionId: q.id,
        selectedOption: answers[idx] || null,
      }));

      const res = await api.post(`/tests/${attemptId}/submit`, {
        answers: answersPayload,
        timeTakenSeconds: seconds,
      });

      if (res.data.success) {
        clearTestProgress();
        navigate(`/test-result/${attemptId}`);
      }
    } catch (err) {
      console.error('Failed to submit test:', err);
      alert('Failed to submit test. Please try again.');
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(markedForReview).filter((k) => markedForReview[k]).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Restored Test Banner */}
      {isRestoredBannerVisible && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Your previous test progress has been restored.
            </span>
          </div>
          <button
            onClick={() => setIsRestoredBannerVisible(false)}
            className="text-xs text-amber-800 hover:text-amber-950 font-bold px-2.5 py-1 bg-amber-200/60 rounded-lg hover:bg-amber-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Test Header & Timer Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Today's Daily Test
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Date: {quizData.quizDate} • {totalQuestions} Questions Persisted
          </p>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <QuizTimer seconds={seconds} setSeconds={setSeconds} />
          
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center space-x-1.5"
            title="Reset Test Session"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Test</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Test</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Progress</span>
          <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
        </div>
        <ProgressBar current={currentIndex + 1} total={totalQuestions} />
      </div>

      {/* Main Grid: Question Card + Question Navigator Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Question Card */}
        <div ref={questionRef} className="lg:col-span-2 space-y-4 scroll-mt-20 sm:scroll-mt-24">
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={totalQuestions}
            selectedOption={answers[currentIndex]}
            onSelectOption={handleSelectOption}
            isMarked={markedForReview[currentIndex]}
            onToggleMark={handleToggleMark}
            onClearAnswer={handleClearAnswer}
          />

          {/* Nav Buttons */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Test</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center space-x-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Question Navigator Palette */}
        <div className="lg:col-span-1">
          <QuestionNavigator
            totalQuestions={totalQuestions}
            currentIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
          />
        </div>

      </div>

      {/* Confirmation Modals */}
      <ResultSummaryModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        markedCount={markedCount}
        isSubmitting={isSubmitting}
      />

      <ResetConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        isResetting={isResetting}
      />

    </div>
  );
};

export default DailyQuizPage;

