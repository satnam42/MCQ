import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Play,
  FileText,
  Sliders,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import mockTestService from '../../services/mockTestService';
import { clearTestProgress } from '../../utils/testCache';

const MockTestSetupPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);

  // Form State
  const [selectedSize, setSelectedSize] = useState(50);
  const [customSizeInput, setCustomSizeInput] = useState('50');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState('new');
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [topicAllocations, setTopicAllocations] = useState({});
  const [startingTest, setStartingTest] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mockTestService.getMockConfig();
      if (res && res.data) {
        const cfg = res.data;
        setConfig(cfg);

        // Pre-select default size
        const allowed = cfg.allowedQuestionCounts || [10, 25, 50, 100, 150];
        const initialSize = allowed.includes(50) ? 50 : allowed[0] || 50;
        setSelectedSize(initialSize);
        setCustomSizeInput(String(initialSize));
        setSelectionMode(cfg.defaultSelectionMode || 'new');

        // Pre-select first 3 available topics
        if (cfg.topics && cfg.topics.length > 0) {
          const defaultSelected = cfg.topics.slice(0, 3).map((t) => t.id);
          setSelectedTopicIds(defaultSelected);

          // Equal distribution for initial size
          const perTopic = Math.floor(initialSize / defaultSelected.length);
          const remainder = initialSize % defaultSelected.length;
          const initialAlloc = {};
          defaultSelected.forEach((id, idx) => {
            initialAlloc[id] = perTopic + (idx === 0 ? remainder : 0);
          });
          setTopicAllocations(initialAlloc);
        }
      }
    } catch (err) {
      console.error('Error fetching mock config:', err);
      setError(err.response?.data?.message || 'Failed to load Mock Test configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-600 font-semibold font-gurmukhi">ਮੋਕ ਟੈਸਟ ਸੈੱਟਅੱਪ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ... (Loading Mock Test Setup...)</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900 font-gurmukhi">ਮੋਕ ਟੈਸਟ ਪ੍ਰਾਪਤ ਨਹੀਂ ਹੋ ਸਕਿਆ</h2>
        <p className="text-sm text-rose-700">{error || 'Could not fetch Mock Test configuration.'}</p>
        <button
          onClick={fetchConfig}
          className="px-5 py-2.5 bg-rose-700 text-white font-bold text-xs rounded-xl hover:bg-rose-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    enabled,
    canAccess,
    reason,
    allowedQuestionCounts = [],
    allowCustom,
    maxQuestions = 150,
    topics = [],
    usage = {},
  } = config;

  // Blocked / Disabled Banner
  if (!enabled || !canAccess) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-4 shadow-sm">
        <ShieldAlert className="w-14 h-14 text-amber-600 mx-auto" />
        <h2 className="text-2xl font-extrabold text-amber-950 font-gurmukhi">
          ਮੋਕ ਟੈਸਟ ਫਿਲਹਾਲ ਉਪਲਬਧ ਨਹੀਂ ਹੈ
        </h2>
        <p className="text-base text-amber-800 font-gurmukhi max-w-lg mx-auto">
          {reason || 'Mock Test is currently unavailable for your account. Please contact the administrator.'}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Calculate target total questions
  const requestedTotal = isCustomMode
    ? parseInt(customSizeInput, 10) || 0
    : selectedSize;

  // Calculate allocated total questions (only summing positive allocations)
  const allocatedTotal = selectedTopicIds.reduce((sum, id) => {
    const val = parseInt(topicAllocations[id], 10);
    return sum + (!isNaN(val) && val > 0 ? val : 0);
  }, 0);

  // Validate topic counts (only active topics with allocation > 0)
  const positiveTopics = selectedTopicIds.filter((id) => {
    const val = parseInt(topicAllocations[id], 10);
    return !isNaN(val) && val > 0;
  });
  const hasSelectedTopic = positiveTopics.length > 0;
  const isAllocationMatch = allocatedTotal === requestedTotal && requestedTotal > 0;
  const isWithinMaxQuestions = requestedTotal <= maxQuestions;
  const isQuotaAvailable = usage.isUnlimited || (usage.remainingToday !== null && usage.remainingToday > 0);

  let allocationDiff = requestedTotal - allocatedTotal;

  const handleSelectSizeOption = (sz) => {
    if (sz === 'custom') {
      setIsCustomMode(true);
      const val = parseInt(customSizeInput, 10) || 50;
      rebalanceAllocation(val, selectedTopicIds);
    } else {
      setIsCustomMode(false);
      setSelectedSize(sz);
      setCustomSizeInput(String(sz));
      rebalanceAllocation(sz, selectedTopicIds);
    }
  };

  const handleCustomSizeChange = (e) => {
    const valStr = e.target.value;
    setCustomSizeInput(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val > 0) {
      rebalanceAllocation(val, selectedTopicIds);
    }
  };

  const handleToggleTopic = (topicId) => {
    let nextSelected = [];
    if (selectedTopicIds.includes(topicId)) {
      nextSelected = selectedTopicIds.filter((id) => id !== topicId);
    } else {
      nextSelected = [...selectedTopicIds, topicId];
    }
    setSelectedTopicIds(nextSelected);
    rebalanceAllocation(requestedTotal, nextSelected);
  };

  const handleAllocationChange = (topicId, valueStr) => {
    const val = valueStr === '' ? '' : Math.max(0, parseInt(valueStr, 10) || 0);
    setTopicAllocations((prev) => ({
      ...prev,
      [topicId]: val,
    }));
  };

  function rebalanceAllocation(total, activeTopics) {
    if (!activeTopics || activeTopics.length === 0) {
      setTopicAllocations({});
      return;
    }
    const perTopic = Math.floor(total / activeTopics.length);
    const remainder = total % activeTopics.length;
    const nextAlloc = {};
    activeTopics.forEach((id, idx) => {
      nextAlloc[id] = perTopic + (idx === 0 ? remainder : 0);
    });
    setTopicAllocations(nextAlloc);
  }

  const handleStartMockTest = async () => {
    if (!hasSelectedTopic) {
      setError('Cannot start Mock Test. Please select at least one question.');
      return;
    }

    if (!isAllocationMatch || !isQuotaAvailable || !isWithinMaxQuestions) {
      return;
    }

    setStartingTest(true);
    setError('');

    // Filter topics to exclude zero question counts
    const payloadTopics = selectedTopicIds
      .map((id) => ({
        topicId: id,
        questionCount: parseInt(topicAllocations[id], 10) || 0,
      }))
      .filter((t) => t.questionCount > 0);

    console.log('Mock setup requested:', requestedTotal);
    console.log('Topic allocation:', payloadTopics);

    try {
      const res = await mockTestService.generateMockTest({
        totalQuestions: requestedTotal,
        selectionMode,
        topics: payloadTopics,
      });

      if (res && res.data) {
        const { attemptId, questions, totalQuestions } = res.data;

        const generatedCount = questions ? questions.length : 0;
        console.log('Generated mock questions:', generatedCount);
        console.log('Questions passed to practice:', generatedCount);

        // Final question count validation
        if (generatedCount !== requestedTotal) {
          console.error(`Count mismatch: requested ${requestedTotal}, generated ${generatedCount}`);
          setError(`Unable to start Mock Test because the generated question count (${generatedCount}) does not match your selected count (${requestedTotal}).`);
          setStartingTest(false);
          return;
        }

        // Clear stale local storage progress before navigating
        clearTestProgress();

        navigate('/practice-session', {
          state: {
            attemptId,
            title: `ਮੋਕ ਟੈਸਟ (${totalQuestions} ਪ੍ਰਸ਼ਨ)`,
            questions,
            questionCount: totalQuestions,
            testType: 'mock',
          },
        });
      }
    } catch (err) {
      console.error('Failed to start mock test:', err);
      setError(err.response?.data?.message || err.message || 'Failed to start Mock Test.');
      setStartingTest(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-orange-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-amber-900/60 backdrop-blur-md px-3.5 py-1 rounded-full text-amber-200 text-xs font-bold border border-amber-500/30 font-gurmukhi">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ਕਸਟਮ ਮੋਕ ਟੈਸਟ ਸੈੱਟਅੱਪ (Mock Test Setup)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-gurmukhi tracking-tight">
            ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ - ਮੋਕ ਟੈਸਟ (Custom Mock Test)
          </h1>
          <p className="text-amber-100 text-sm sm:text-base font-gurmukhi leading-relaxed opacity-95">
            Select question size, choose multiple exam topics, allocate desired question distribution, and begin full-length practice.
          </p>
        </div>
      </div>

      {/* Quota Information Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 font-gurmukhi">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>ਮੋਕ ਟੈਸਟ ਵਰਤੋਂ ਕੋਟਾ (Mock Test Usage Quota)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Quota is deducted only when a mock test is successfully started.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {usage.isUnlimited ? (
            <div className="px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold rounded-2xl text-xs">
              Today's Mock Tests: Unlimited (ਅਸੀਮਤ)
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="px-3.5 py-1.5 bg-amber-100 border border-amber-300 text-amber-950 font-bold rounded-xl text-xs">
                Used Today: {usage.usedToday} / {usage.effectiveLimit}
              </div>
              <div className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl text-xs">
                Remaining: {usage.remainingToday} Mock Test(s)
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center space-x-3 text-sm font-semibold font-gurmukhi">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: TOTAL QUESTIONS ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-slate-900 font-gurmukhi flex items-center space-x-2">
            <span className="w-7 h-7 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>ਕੁੱਲ ਪ੍ਰਸ਼ਨਾਂ ਦੀ ਗਿਣਤੀ ਚੁਣੋ (Total Questions Count)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-gurmukhi">
            How many questions do you want in this mock test? (Maximum allowed: {maxQuestions})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {allowedQuestionCounts.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => handleSelectSizeOption(sz)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer font-mono ${
                !isCustomMode && selectedSize === sz
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              {sz} Questions
            </button>
          ))}

          {allowCustom && (
            <button
              type="button"
              onClick={() => handleSelectSizeOption('custom')}
              className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer font-gurmukhi ${
                isCustomMode
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              ਕਸਟਮ (Custom Size)
            </button>
          )}
        </div>

        {isCustomMode && (
          <div className="pt-2 flex items-center space-x-3 max-w-xs">
            <label className="text-xs font-bold text-slate-700 font-gurmukhi shrink-0">
              Enter Custom Count:
            </label>
            <input
              type="number"
              min={1}
              max={maxQuestions}
              value={customSizeInput}
              onChange={handleCustomSizeChange}
              className="w-full px-3.5 py-2 border border-amber-300 rounded-xl font-mono font-bold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* ── STEP 2: MULTIPLE TOPIC SELECTION ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-gurmukhi flex items-center space-x-2">
              <span className="w-7 h-7 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>ਵਿਸ਼ੇ ਚੁਣੋ (Select Multiple Topics)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-gurmukhi">
              Select one or multiple exam topics for your custom mock test.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-gurmukhi">
            {selectedTopicIds.length} Selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map((topic) => {
            const isChecked = selectedTopicIds.includes(topic.id);
            return (
              <div
                key={topic.id}
                onClick={() => handleToggleTopic(topic.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer font-gurmukhi flex items-center justify-between ${
                  isChecked
                    ? 'bg-amber-50/90 border-amber-400 shadow-xs ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3 pr-2 min-w-0">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {topic.name}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0 font-mono">
                  {topic.availableQuestions} Qs
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 3: QUESTIONS PER TOPIC ALLOCATION ── */}
      {hasSelectedTopic && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 font-gurmukhi flex items-center space-x-2">
              <span className="w-7 h-7 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>ਪ੍ਰਸ਼ਨ ਵੰਡ (Allocate Questions per Topic)</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-xs">
                  <th className="py-3 px-4">Topic Name</th>
                  <th className="py-3 px-4 text-center">Available Questions</th>
                  <th className="py-3 px-4 text-right">Allocated Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-gurmukhi">
                {selectedTopicIds.map((id) => {
                  const topicObj = topics.find((t) => t.id === id);
                  if (!topicObj) return null;
                  const allocVal = topicAllocations[id] !== undefined ? topicAllocations[id] : 0;
                  return (
                    <tr key={id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {topicObj.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-600">
                        {topicObj.availableQuestions}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          max={topicObj.availableQuestions}
                          value={allocVal}
                          onChange={(e) => handleAllocationChange(id, e.target.value)}
                          className="w-24 px-3 py-1.5 border border-amber-300 rounded-xl font-mono font-bold text-sm text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Allocation Summary & Validation Banner */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 font-gurmukhi">
            <div className="flex flex-wrap items-center justify-between text-sm font-bold gap-4">
              <div>
                Required Questions: <span className="font-mono text-amber-900 text-base">{requestedTotal}</span>
              </div>
              <div>
                Allocated Questions: <span className="font-mono text-amber-900 text-base">{allocatedTotal}</span>
              </div>
            </div>

            {/* Validation Feedback message */}
            {allocationDiff > 0 && (
              <div className="p-3 bg-amber-100 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Required: {requestedTotal} | Allocated: {allocatedTotal} — Please allocate {allocationDiff} more question(s).</span>
              </div>
            )}

            {allocationDiff < 0 && (
              <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Required: {requestedTotal} | Allocated: {allocatedTotal} — Allocated questions exceed required by {Math.abs(allocationDiff)}.</span>
              </div>
            )}

            {isAllocationMatch && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✅ Perfect allocation! Ready to start mock test.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 4: QUESTION SELECTION MODE ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 font-gurmukhi">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-amber-600" />
          <span>ਪ੍ਰਸ਼ਨ ਚੋਣ ਪ੍ਰਣਾਲੀ (Question Selection Rule)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 ${selectionMode === 'new' ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'}`}>
            <input
              type="radio"
              name="selectionMode"
              value="new"
              checked={selectionMode === 'new'}
              onChange={(e) => setSelectionMode(e.target.value)}
              className="accent-amber-600"
            />
            <span className="font-bold text-sm text-slate-900">Only New Questions (ਕੇਵਲ ਨਵੇਂ ਪ੍ਰਸ਼ਨ)</span>
          </label>

          <label className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 ${selectionMode === 'all' ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'}`}>
            <input
              type="radio"
              name="selectionMode"
              value="all"
              checked={selectionMode === 'all'}
              onChange={(e) => setSelectionMode(e.target.value)}
              className="accent-amber-600"
            />
            <span className="font-bold text-sm text-slate-900">Allow All Questions (ਸਾਰੇ ਪ੍ਰਸ਼ਨ)</span>
          </label>

          <label className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 ${selectionMode === 'include_attempted' ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'}`}>
            <input
              type="radio"
              name="selectionMode"
              value="include_attempted"
              checked={selectionMode === 'include_attempted'}
              onChange={(e) => setSelectionMode(e.target.value)}
              className="accent-amber-600"
            />
            <span className="font-bold text-sm text-slate-900">Include Attempted Questions</span>
          </label>
        </div>
      </div>

      {/* START MOCK TEST ACTION BUTTON */}
      <div className="flex justify-end pt-4 font-gurmukhi">
        <button
          type="button"
          onClick={handleStartMockTest}
          disabled={!isAllocationMatch || !hasSelectedTopic || !isQuotaAvailable || !isWithinMaxQuestions || startingTest}
          className="inline-flex items-center space-x-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-base shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{startingTest ? 'ਮੋਕ ਟੈਸਟ ਬਣ ਰਿਹਾ ਹੈ...' : 'Start Mock Test (ਮੋਕ ਟੈਸਟ ਸ਼ੁਰੂ ਕਰੋ)'}</span>
        </button>
      </div>
    </div>
  );
};

export default MockTestSetupPage;
