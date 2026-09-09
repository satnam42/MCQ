import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DifficultyBadge from '../../components/DifficultyBadge';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

const AIQuestionGenPage = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/topics');
        if (res.data.success && res.data.data.topics?.length > 0) {
          setTopics(res.data.data.topics);
          setSelectedTopic(res.data.data.topics[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      }
    };
    fetchTopics();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return;

    setGenerating(true);
    try {
      const res = await api.post('/questions/generate-ai', {
        topicId: selectedTopic,
        difficulty,
        count: parseInt(count, 10),
      });

      if (res.data.success) {
        setGeneratedQuestions(res.data.data.generatedQuestions || []);
      }
    } catch (err) {
      console.error('AI Question Generation failed:', err);
      alert('AI Generation failed. Check local generator strategy configuration.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-3 text-purple-400">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            AI MCQ Generator Engine
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-300">
          Generate candidate Punjabi MCQs by topic using AI strategy pattern abstraction layer
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Topic:</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-500 font-gurmukhi"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="tough">Tough</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Questions Count:</label>
              <select
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-500"
              >
                <option value={3}>3 MCQs</option>
                <option value={5}>5 MCQs</option>
                <option value={10}>10 MCQs</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-base shadow-md disabled:opacity-40 transition-all flex items-center justify-center space-x-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating AI MCQs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-purple-200" />
                <span>Generate Questions Draft</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Questions Review List */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              AI Generated Draft Questions
            </h2>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">
              {generatedQuestions.length} Questions Drafted
            </span>
          </div>

          <div className="space-y-6">
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-purple-200 bg-purple-50/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-purple-900">Draft #{idx + 1}</span>
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                
                <h3 className="font-bold text-slate-900 font-gurmukhi text-base leading-relaxed">
                  {q.question}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs font-gurmukhi">
                  <div className={`p-2.5 rounded-lg border ${q.correctOption === 'A' ? 'bg-emerald-100 border-emerald-400 font-bold' : 'bg-white'}`}>A: {q.optionA}</div>
                  <div className={`p-2.5 rounded-lg border ${q.correctOption === 'B' ? 'bg-emerald-100 border-emerald-400 font-bold' : 'bg-white'}`}>B: {q.optionB}</div>
                  <div className={`p-2.5 rounded-lg border ${q.correctOption === 'C' ? 'bg-emerald-100 border-emerald-400 font-bold' : 'bg-white'}`}>C: {q.optionC}</div>
                  <div className={`p-2.5 rounded-lg border ${q.correctOption === 'D' ? 'bg-emerald-100 border-emerald-400 font-bold' : 'bg-white'}`}>D: {q.optionD}</div>
                </div>

                {q.explanation && (
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border font-gurmukhi">
                    <span className="font-bold text-slate-800 font-sans">Explanation: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AIQuestionGenPage;
