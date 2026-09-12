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
import { ChevronLeft, ChevronRight, Send, RotateCcw, CheckCircle2 } from 'lucide-react';

const PracticeSessionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeState = location.state || {};

  const [attemptId, setAttemptId] = useState(routeState.attemptId || null);
  const [title, setTitle] = useState(routeState.title || '');
  const [questions, setQuestions] = useState(routeState.questions || []);
  const [topicId, setTopicId] = useState(routeState.topicId || null);
  const [difficulty, setDifficulty] = useState(routeState.difficulty || 'all');
  const [repetitionMode, setRepetitionMode] = useState(routeState.repetitionMode || 'mix');
  const [questionCount, setQuestionCount] = useState(routeState.questionCount || routeState.questions?.length || 50);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRestoredBannerVisible, setIsRestoredBannerVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
    if (isInitialized && questionRef.current) {
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
  }, [currentIndex, isInitialized]);

  useEffect(() => {
    // 1. Check if an unfinished cached test exists
    const cached = restoreTestProgress();
    if (cached && cached.questions && cached.questions.length > 0) {
      setAttemptId(cached.testId);
      setTitle(cached.title || 'Practice Session');
      setQuestions(cached.questions);
      setTopicId(cached.topicId || null);
      setDifficulty(cached.difficulty || 'all');
      setRepetitionMode(cached.repetitionMode || 'mix');
      setQuestionCount(cached.totalQuestions || cached.questions.length || 50);
      setCurrentIndex(cached.currentQuestionIndex || 0);
      setAnswers(cached.selectedAnswers || {});
      setMarkedForReview(cached.markedForReview || {});
      setSeconds(cached.elapsedTime || 0);
      setIsRestoredBannerVisible(true);
      setIsInitialized(true);
      return;
    }

    // 2. Otherwise use route state if passed
    if (routeState.questions && routeState.questions.length > 0) {
      setAttemptId(routeState.attemptId);
      setTitle(routeState.title || 'Practice Session');
      setQuestions(routeState.questions);
      setTopicId(routeState.topicId || null);
      setDifficulty(routeState.difficulty || 'all');
      setRepetitionMode(routeState.repetitionMode || 'mix');
      setQuestionCount(routeState.questionCount || routeState.questions.length);

      saveTestProgress({
        testId: routeState.attemptId,
        testType: 'topic',
        title: routeState.title || 'Practice Session',
        topicId: routeState.topicId || null,
        difficulty: routeState.difficulty || 'all',
        repetitionMode: routeState.repetitionMode || 'mix',
        totalQuestions: routeState.questionCount || routeState.questions.length,
        questions: routeState.questions,
        currentQuestionIndex: 0,
        selectedAnswers: {},
        markedForReview: {},
        elapsedTime: 0,
        status: 'in-progress',
      });
    }

    setIsInitialized(true);
  }, []);

  // Auto-save progress whenever test state changes
  useEffect(() => {
    if (isInitialized && attemptId && questions && questions.length > 0) {
      saveTestProgress({
        testId: attemptId,
        testType: 'topic',
        title: title || 'Practice Session',
        topicId,
        difficulty,
        repetitionMode,
        totalQuestions: questions.length,
        questions,
        currentQuestionIndex: currentIndex,
        selectedAnswers: answers,
        markedForReview: markedForReview,
        elapsedTime: seconds,
        status: 'in-progress',
      });
    }
  }, [isInitialized, attemptId, title, questions, topicId, difficulty, repetitionMode, currentIndex, answers, markedForReview, seconds]);

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Practice Session Unavailable</h2>
        <button
          onClick={() => navigate('/topic-practice')}
          className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm"
        >
          Back to Topic Practice
        </button>
      </div>
    );
  }

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
      // 1. Clear cached test progress from localStorage
      clearTestProgress();

      let freshQuestions = questions;
      const targetSize = questionCount || questions.length || 50;

      // 2. Re-fetch fresh questions using the currently selected question count if topicId is available
      if (topicId) {
        const diffQuery = difficulty && difficulty !== 'all' ? `&difficulty=${difficulty}` : '';
        const modeQuery = repetitionMode ? `&repetitionMode=${repetitionMode}` : '';
        const qRes = await api.get(`/topics/${topicId}/questions?limit=${targetSize}${diffQuery}${modeQuery}`);
        if (qRes.data.success && qRes.data.data.questions?.length > 0) {
          freshQuestions = qRes.data.data.questions;
        }
      }

      // 3. Start a fresh attempt via backend
      const startRes = await api.post('/tests/start', {
        testType: 'topic',
        topicId: topicId || null,
        difficulty: difficulty !== 'all' ? difficulty : null,
        totalQuestions: freshQuestions.length,
      });

      if (startRes.data.success) {
        const newAttemptId = startRes.data.data.attemptId;
        setAttemptId(newAttemptId);
        setQuestions(freshQuestions);

        // 4. Reset answers and progress to Question 1
        setAnswers({});
        setMarkedForReview({});
        setCurrentIndex(0);
        setSeconds(0);
        setIsRestoredBannerVisible(false);

        // Save fresh test state with target question size
        saveTestProgress({
          testId: newAttemptId,
          testType: 'topic',
          title: title || 'Practice Session',
          topicId,
          difficulty,
          repetitionMode,
          totalQuestions: freshQuestions.length,
          questions: freshQuestions,
          currentQuestionIndex: 0,
          selectedAnswers: {},
          markedForReview: {},
          elapsedTime: 0,
          status: 'in-progress',
        });
      }
    } catch (err) {
      console.error('Failed to reset practice session:', err);
      alert('Failed to reset session. Please try again.');
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
      console.error('Failed to submit practice session:', err);
      alert('Failed to submit practice session.');
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

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {title || 'Practice Session'}
          </h1>
          <p className="text-xs text-slate-500 font-mono">Total {totalQuestions} Questions</p>
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
            <span>Submit Session</span>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
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
                <span>Submit Session</span>
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

export default PracticeSessionPage;

