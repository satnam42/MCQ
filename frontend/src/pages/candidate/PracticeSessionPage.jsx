import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import QuestionCard from '../../components/QuestionCard';
import QuestionNavigator from '../../components/QuestionNavigator';
import QuizTimer from '../../components/QuizTimer';
import ProgressBar from '../../components/ProgressBar';
import ResultSummaryModal from '../../components/ResultSummaryModal';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

const PracticeSessionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { attemptId, title, questions } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {title || 'Practice Session'}
          </h1>
          <p className="text-xs text-slate-500 font-mono">Total {totalQuestions} Questions</p>
        </div>

        <div className="flex items-center space-x-4">
          <QuizTimer seconds={seconds} setSeconds={setSeconds} />
          
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
        
        <div className="lg:col-span-2 space-y-4">
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

    </div>
  );
};

export default PracticeSessionPage;
