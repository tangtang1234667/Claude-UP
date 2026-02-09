// localStorage utility module for IELTS learning app
// Each data domain uses a separate key prefixed with 'ielts_'

const KEYS = {
  ARTICLES: 'ielts_articles',
  FAVORITES: 'ielts_favorites',
  LEARNING_PROGRESS: 'ielts_learning_progress',
  WRONG_ANSWERS: 'ielts_wrong_answers',
  PRACTICE_HISTORY: 'ielts_practice_history',
  STREAK: 'ielts_streak',
  TODAY_LEARNED: 'ielts_today_learned',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable – silently ignore
  }
}

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export function getArticles() {
  return readStore(KEYS.ARTICLES, []);
}

export function saveArticle(article) {
  const articles = getArticles();
  const entry = {
    id: article.id || Date.now().toString(),
    title: article.title || '',
    content: article.content || '',
    createdAt: article.createdAt || new Date().toISOString(),
  };
  articles.push(entry);
  writeStore(KEYS.ARTICLES, articles);
  return entry;
}

export function deleteArticle(id) {
  const articles = getArticles().filter((a) => a.id !== id);
  writeStore(KEYS.ARTICLES, articles);
}

// ---------------------------------------------------------------------------
// Favorites (collected words – 生词本)
// ---------------------------------------------------------------------------

export function getFavorites() {
  return readStore(KEYS.FAVORITES, []);
}

export function addFavorite(wordObj) {
  const favorites = getFavorites();
  // Deduplicate by word string
  if (favorites.some((f) => f.word === wordObj.word)) return;
  favorites.push({
    word: wordObj.word,
    meaning: wordObj.meaning || '',
    phonetic: wordObj.phonetic || '',
    pos: wordObj.pos || '',
    addedAt: wordObj.addedAt || new Date().toISOString(),
  });
  writeStore(KEYS.FAVORITES, favorites);
}

export function removeFavorite(word) {
  const favorites = getFavorites().filter((f) => f.word !== word);
  writeStore(KEYS.FAVORITES, favorites);
}

export function isFavorite(word) {
  return getFavorites().some((f) => f.word === word);
}

// ---------------------------------------------------------------------------
// Learning progress
// ---------------------------------------------------------------------------

function defaultProgress() {
  return { basic: [], intermediate: [], advanced: [], mastered: [] };
}

export function getLearningProgress() {
  return readStore(KEYS.LEARNING_PROGRESS, defaultProgress());
}

export function markWordLearned(wordId, level) {
  const progress = getLearningProgress();
  const validLevels = ['basic', 'intermediate', 'advanced'];
  const key = validLevels.includes(level) ? level : 'basic';

  if (!progress[key]) progress[key] = [];
  if (!progress[key].includes(wordId)) {
    progress[key].push(wordId);
  }
  writeStore(KEYS.LEARNING_PROGRESS, progress);

  // Also track today's learned count
  const todayData = readStore(KEYS.TODAY_LEARNED, { date: '', ids: [] });
  const today = getTodayDateStr();
  if (todayData.date !== today) {
    todayData.date = today;
    todayData.ids = [];
  }
  if (!todayData.ids.includes(wordId)) {
    todayData.ids.push(wordId);
  }
  writeStore(KEYS.TODAY_LEARNED, todayData);
}

export function markWordMastered(wordId) {
  const progress = getLearningProgress();

  // Remove from level arrays if present
  for (const level of ['basic', 'intermediate', 'advanced']) {
    if (progress[level]) {
      progress[level] = progress[level].filter((id) => id !== wordId);
    }
  }

  if (!progress.mastered) progress.mastered = [];
  if (!progress.mastered.includes(wordId)) {
    progress.mastered.push(wordId);
  }
  writeStore(KEYS.LEARNING_PROGRESS, progress);
}

export function getTodayLearnedCount() {
  const todayData = readStore(KEYS.TODAY_LEARNED, { date: '', ids: [] });
  const today = getTodayDateStr();
  if (todayData.date !== today) return 0;
  return todayData.ids.length;
}

// ---------------------------------------------------------------------------
// Practice / Wrong answers
// ---------------------------------------------------------------------------

export function getWrongAnswers() {
  return readStore(KEYS.WRONG_ANSWERS, []);
}

export function addWrongAnswer(wordId, word, meaning) {
  const list = getWrongAnswers();
  const existing = list.find((item) => item.wordId === wordId);
  if (existing) {
    existing.wrongCount += 1;
    existing.lastWrong = new Date().toISOString();
  } else {
    list.push({
      wordId,
      word,
      meaning,
      wrongCount: 1,
      lastWrong: new Date().toISOString(),
    });
  }
  writeStore(KEYS.WRONG_ANSWERS, list);
}

export function removeWrongAnswer(wordId) {
  const list = getWrongAnswers().filter((item) => item.wordId !== wordId);
  writeStore(KEYS.WRONG_ANSWERS, list);
}

export function getPracticeHistory() {
  return readStore(KEYS.PRACTICE_HISTORY, []);
}

export function savePracticeResult(total, correct, wrong) {
  const history = getPracticeHistory();
  const today = getTodayDateStr();

  const existing = history.find((entry) => entry.date === today);
  if (existing) {
    // Accumulate into today's existing record
    existing.total += total;
    existing.correct += correct;
    existing.wrong += wrong;
  } else {
    history.push({ date: today, total, correct, wrong });
  }
  writeStore(KEYS.PRACTICE_HISTORY, history);
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

export function getStreak() {
  return readStore(KEYS.STREAK, { current: 0, lastDate: '' });
}

export function updateStreak() {
  const streak = getStreak();
  const today = getTodayDateStr();

  if (streak.lastDate === today) {
    // Already recorded today – no change
    return streak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (streak.lastDate === yesterdayStr) {
    // Consecutive day – increment
    streak.current += 1;
  } else {
    // Streak broken – reset to 1 (today counts)
    streak.current = 1;
  }

  streak.lastDate = today;
  writeStore(KEYS.STREAK, streak);
  return streak;
}

// ---------------------------------------------------------------------------
// Stats (aggregate)
// ---------------------------------------------------------------------------

export function getStats() {
  const progress = getLearningProgress();
  const totalWordsLearned =
    (progress.basic ? progress.basic.length : 0) +
    (progress.intermediate ? progress.intermediate.length : 0) +
    (progress.advanced ? progress.advanced.length : 0) +
    (progress.mastered ? progress.mastered.length : 0);

  const todayWordsLearned = getTodayLearnedCount();

  const streak = getStreak();

  // Calculate today's accuracy from practice history
  const history = getPracticeHistory();
  const today = getTodayDateStr();
  const todayRecord = history.find((entry) => entry.date === today);
  let todayAccuracy = null;
  if (todayRecord && todayRecord.total > 0) {
    todayAccuracy = Math.round((todayRecord.correct / todayRecord.total) * 100);
  }

  return {
    totalWordsLearned,
    todayWordsLearned,
    streak: streak.current,
    todayAccuracy,
  };
}
