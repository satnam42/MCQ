import React, { useState } from 'react';
import { Search, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

const TopicSelector = ({ topics = [], selectedTopicId, onSelectTopic, viewMode = 'cards' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (viewMode === 'dropdown') {
    return (
      <div className="relative w-full">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          ਤੁਹਾਡਾ ਵਿਸ਼ਾ ਚੁਣੋ (Select Topic)
        </label>
        <div className="relative">
          <select
            value={selectedTopicId || ''}
            onChange={(e) => onSelectTopic(e.target.value ? Number(e.target.value) : null)}
            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 font-medium text-lg cursor-pointer transition-all font-gurmukhi"
          >
            <option value="">-- ਸਾਰੇ ਵਿਸ਼ੇ (All Topics) --</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name} {topic.questionCount !== undefined ? `(${topic.questionCount} MCQs)` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ਵਿਸ਼ਾ ਖੋਜੋ... (Search topic name...)"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-medium transition-all font-gurmukhi"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Topics Grid Cards */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          ਕੋਈ ਵਿਸ਼ਾ ਨਹੀਂ ਮਿਲਿਆ (No topic matching your search)
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            onClick={() => onSelectTopic(null)}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
              selectedTopicId === null
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-md ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-gurmukhi text-base">ਸਾਰੇ ਵਿਸ਼ੇ</h3>
                  <p className="text-xs text-slate-500">All Topics</p>
                </div>
              </div>
              {selectedTopicId === null && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
            </div>
          </div>

          {filteredTopics.map((topic) => {
            const isSelected = selectedTopicId === topic.id;
            return (
              <div
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <h3 className="font-bold text-slate-900 font-gurmukhi text-base leading-tight">
                          {topic.name}
                        </h3>
                        {topic.isNew && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black px-2 py-0.5 text-[10px] uppercase rounded-full tracking-wider shrink-0">
                            NEW
                          </span>
                        )}
                        {!topic.isNew && topic.isUnseen && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.5 text-[10px] rounded-full shrink-0">
                            UNSEEN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Study Notes</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
