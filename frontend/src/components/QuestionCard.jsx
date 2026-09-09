import React from 'react';
import DifficultyBadge from './DifficultyBadge';
import { Bookmark, RotateCcw } from 'lucide-react';

const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  isMarked,
  onToggleMark,
  onClearAnswer,
}) => {
  if (!question) return null;

  const options = question.options || {
    A: question.optionA || question.option_a,
    B: question.optionB || question.option_b,
    C: question.optionC || question.option_c,
    D: question.optionD || question.option_d,
  };

  const optionKeys = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold font-mono">
            Question {questionNumber} / {totalQuestions}
          </span>
          <DifficultyBadge difficulty={question.difficulty} />
          {question.topicName && (
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
              {question.topicName}
            </span>
          )}
        </div>

        {/* Action button: Mark for Review */}
        <button
          onClick={onToggleMark}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isMarked
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
        </button>
      </div>

      {/* Question Text in Punjabi */}
      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed font-gurmukhi">
          {question.question}
        </h2>
      </div>

      {/* Options List in Punjabi */}
      <div className="space-y-3 mb-8">
        {optionKeys.map((key) => {
          const optionText = options[key];
          const isSelected = selectedOption === key;

          return (
            <div
              key={key}
              onClick={() => onSelectOption(key)}
              className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center mr-3.5 shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {key}
              </div>
              <div className="text-base text-slate-800 pt-0.5 leading-relaxed font-gurmukhi font-medium">
                {optionText}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={onClearAnswer}
          disabled={!selectedOption}
          className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Answer</span>
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
