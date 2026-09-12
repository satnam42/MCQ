const CACHE_KEY = 'punjabi_lecturer_test_progress';
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Saves test progress into localStorage
 * @param {Object} data
 */
export const saveTestProgress = (data) => {
  if (!data || !data.testId) return;

  try {
    const existing = restoreTestProgress() || {};
    const payload = {
      testId: data.testId,
      testType: data.testType || existing.testType || 'daily',
      title: data.title || existing.title || '',
      topicId: data.topicId ?? existing.topicId ?? null,
      difficulty: data.difficulty || existing.difficulty || null,
      repetitionMode: data.repetitionMode || existing.repetitionMode || null,
      totalQuestions: typeof data.totalQuestions === 'number' ? data.totalQuestions : (data.questions?.length || existing.totalQuestions || 50),
      dailyQuizId: data.dailyQuizId ?? existing.dailyQuizId ?? null,
      quizDate: data.quizDate || existing.quizDate || null,
      questions: data.questions || existing.questions || [],
      currentQuestionIndex: typeof data.currentQuestionIndex === 'number' ? data.currentQuestionIndex : 0,
      selectedAnswers: data.selectedAnswers || existing.selectedAnswers || {},
      markedForReview: data.markedForReview || existing.markedForReview || {},
      elapsedTime: typeof data.elapsedTime === 'number' ? data.elapsedTime : (existing.elapsedTime || 0),
      status: data.status || 'in-progress',
      createdAt: existing.createdAt || data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save test progress to localStorage:', err);
  }
};

/**
 * Restores unfinished test progress from localStorage
 * Returns null if no valid/fresh progress exists
 */
export const restoreTestProgress = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);

    // Basic structure validation
    if (
      !data ||
      typeof data !== 'object' ||
      !data.testId ||
      !Array.isArray(data.questions) ||
      data.questions.length === 0 ||
      data.status !== 'in-progress'
    ) {
      clearTestProgress();
      return null;
    }

    // Expiry check (stale if updated > 24 hours ago)
    if (data.updatedAt) {
      const lastUpdated = new Date(data.updatedAt).getTime();
      if (isNaN(lastUpdated) || Date.now() - lastUpdated > STALE_THRESHOLD_MS) {
        clearTestProgress();
        return null;
      }
    }

    return data;
  } catch (err) {
    console.error('Failed to restore test progress from localStorage:', err);
    clearTestProgress();
    return null;
  }
};

/**
 * Clears saved test progress from localStorage
 */
export const clearTestProgress = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.error('Failed to clear test progress from localStorage:', err);
  }
};

/**
 * Resets test progress and invokes optional callback
 */
export const resetTest = async (onNewTestCallback) => {
  clearTestProgress();
  if (typeof onNewTestCallback === 'function') {
    await onNewTestCallback();
  }
};
