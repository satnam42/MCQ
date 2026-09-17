import React from 'react';
import { RefreshCw, Sparkles, Flame, CheckCircle2 } from 'lucide-react';

const QuestionRepetitionSelector = ({ value = 'mix', onChange }) => {
  const options = [
    {
      id: 'mix',
      title: '🔄 Mix Previous + New Questions',
      badge: 'Recommended',
      description: 'Includes a balanced combination of questions you have attempted previously (prioritizing revision of mistakes) and new questions.',
      icon: RefreshCw,
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-50/70',
      activeBadgeBg: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'only_new',
      title: '🆕 Only Completely Unattempted Questions',
      badge: 'Unattempted Only',
      description: 'Generates questions that you have never attempted before in any previous attempt across all topics and difficulties.',
      icon: Sparkles,
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-50/70',
      activeBadgeBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'recent_new',
      title: '✨ Recently Added Questions Only ([NEW])',
      badge: '[NEW] Tagged Only',
      description: 'Generates questions that were recently created in the database and currently display the dynamic [NEW] badge.',
      icon: Flame,
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50/70',
      activeBadgeBg: 'bg-purple-600 text-white',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-extrabold text-slate-800">
          How would you like your next questions?
        </label>
        <span className="text-[11px] font-medium text-slate-400">Stored for next sessions</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          const IconComponent = opt.icon;

          return (
            <div
              key={opt.id}
              onClick={() => onChange && onChange(opt.id)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative ${
                isSelected
                  ? `${opt.borderColor} ${opt.bgColor} shadow-sm scale-[1.01]`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      isSelected ? 'bg-white shadow-xs text-slate-900' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {opt.title}
                      </h4>
                      {isSelected && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.activeBadgeBg}`}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  <CheckCircle2
                    className={`w-5 h-5 transition-all ${
                      isSelected ? 'text-amber-600 opacity-100 scale-110' : 'text-slate-300 opacity-40'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionRepetitionSelector;
