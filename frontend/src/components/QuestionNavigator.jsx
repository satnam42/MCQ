import React from 'react';

const QuestionNavigator = ({
  totalQuestions,
  currentIndex,
  answers,
  markedForReview,
  onSelectQuestion,
}) => {
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    if (markedForReview[i]) {
      markedCount++;
    } else if (answers[i]) {
      answeredCount++;
    } else {
      unansweredCount++;
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sticky top-20">
      <h3 className="font-bold text-slate-800 mb-3 flex items-center justify-between text-base">
        <span>Question Palette</span>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">
          Total: {totalQuestions}
        </span>
      </h3>

      {/* Counter Legend Summary in English */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-medium">
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-2 text-center">
          <div className="font-bold text-base">{answeredCount}</div>
          <div>Answered</div>
        </div>
        <div className="bg-purple-50 text-purple-800 border border-purple-200 rounded-lg p-2 text-center">
          <div className="font-bold text-base">{markedCount}</div>
          <div>Marked</div>
        </div>
        <div className="bg-slate-100 text-slate-700 border border-slate-200 rounded-lg p-2 text-center">
          <div className="font-bold text-base">{unansweredCount}</div>
          <div>Unanswered</div>
        </div>
      </div>

      {/* Palette Buttons Grid */}
      <div className="max-h-72 overflow-y-auto palette-scroll pr-1">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = !!answers[index];
            const isMarked = !!markedForReview[index];

            let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
            if (isMarked) {
              btnStyle = 'bg-purple-600 text-white font-bold shadow-sm';
            } else if (isAnswered) {
              btnStyle = 'bg-emerald-600 text-white font-bold shadow-sm';
            }

            if (isCurrent) {
              btnStyle += ' ring-2 ring-amber-500 ring-offset-2 scale-105';
            }

            return (
              <button
                key={index}
                onClick={() => onSelectQuestion(index)}
                className={`h-9 w-full rounded-lg text-xs transition-all flex items-center justify-center font-medium ${btnStyle}`}
                title={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Legend Guide in English */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
          <span>Answered</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span>
          <span>Marked for Review</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 inline-block"></span>
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
