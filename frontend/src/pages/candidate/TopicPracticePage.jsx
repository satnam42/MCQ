import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import QuestionRepetitionSelector from '../../components/QuestionRepetitionSelector';
import { clearTestProgress } from '../../utils/testCache';
import { BookOpen, PlayCircle, Filter, CheckCircle } from 'lucide-react';

const TopicPracticePage = () => {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questionCount, setQuestionCount] = useState(50);
  const [difficulty, setDifficulty] = useState('all');
  const [repetitionMode, setRepetitionMode] = useState(() => {
    return localStorage.getItem('question_repetition_preference') || 'mix';
  });
  const [loading, setLoading] = useState(true);

  const settingsRef = useRef(null);

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);

    // Mobile-specific smooth scroll to Practice Settings container
    if (window.innerWidth < 1024 && settingsRef.current) {
      requestAnimationFrame(() => {
        settingsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
      setTimeout(() => {
        settingsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 80);
    }
  };

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/topics');
        if (res.data.success) {
          setTopics(res.data.data.topics || []);
          if (res.data.data.topics?.length > 0) {
            setSelectedTopic(res.data.data.topics[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const handleRepetitionModeChange = (mode) => {
    setRepetitionMode(mode);
    localStorage.setItem('question_repetition_preference', mode);
  };

  const handleStartPractice = async () => {
    if (!selectedTopic) return;

    try {
      // Clear any previous cached test to prevent interference with new session
      clearTestProgress();

      const diffQuery = difficulty !== 'all' ? `&difficulty=${difficulty}` : '';
      const res = await api.get(
        `/topics/${selectedTopic.id}/questions?limit=${questionCount}${diffQuery}&repetitionMode=${repetitionMode}`
      );

      if (res.data.success && res.data.data.questions.length > 0) {
        const questionsList = res.data.data.questions;
        
        const startRes = await api.post('/tests/start', {
          testType: 'topic',
          topicId: selectedTopic.id,
          difficulty: difficulty !== 'all' ? difficulty : null,
          totalQuestions: questionsList.length,
        });

        if (startRes.data.success) {
          navigate('/practice-session', {
            state: {
              attemptId: startRes.data.data.attemptId,
              title: `${selectedTopic.name} - Practice`,
              questions: questionsList,
              topicId: selectedTopic.id,
              difficulty,
              repetitionMode,
              questionCount,
            },
          });
        }
      } else {
        alert('No questions available for this selection.');
      }
    } catch (err) {
      console.error('Failed to start topic practice:', err);
      alert('Failed to start practice session.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-2">
        <div className="flex items-center space-x-3 text-amber-600">
          <BookOpen className="w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Topic-wise Practice
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Select a topic, difficulty level, and question repetition preference to customize your practice session
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Topics Selector Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Select Topic
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((t) => {
              const isSelected = selectedTopic?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleTopicSelect(t)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/60 shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base mb-1 font-gurmukhi">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {t.description || `Questions on ${t.name}`}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex justify-between">
                    <span>Available MCQs: {t.questionCount || 20}+</span>
                    <span className="text-amber-600">Practice →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Practice Configuration Panel */}
        <div ref={settingsRef} className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6 sticky top-20 scroll-mt-20 sm:scroll-mt-24">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Filter className="w-5 h-5 text-amber-500" />
            <span>Practice Settings</span>
          </h3>

          {/* Selected Topic Display */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <span className="text-xs font-semibold text-amber-800 block">Selected Topic:</span>
            <span className="text-base font-extrabold text-amber-950 font-gurmukhi block mt-0.5">
              {selectedTopic?.name || 'None'}
            </span>
          </div>

          {/* Question Count Radio selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              How many questions do you want to start?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 150].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    questionCount === cnt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cnt} Qs
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Difficulty Level:
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="tough">Tough</option>
            </select>
          </div>

          {/* Question Repetition Preference Selector */}
          <QuestionRepetitionSelector
            value={repetitionMode}
            onChange={handleRepetitionModeChange}
          />

          {/* Start CTA */}
          <button
            onClick={handleStartPractice}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-base shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Start Practice</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default TopicPracticePage;
