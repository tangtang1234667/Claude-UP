import { useState, useEffect, useCallback } from 'react';
import vocabularyData from '../data/vocabulary.js';
import { speak } from '../utils/tts.js';
import {
  getLearningProgress, markWordLearned, markWordMastered,
  addFavorite, removeFavorite, isFavorite, getFavorites,
  updateStreak,
} from '../utils/storage.js';

const levels = [
  { key: 'basic', label: '基础', color: 'green' },
  { key: 'intermediate', label: '进阶', color: 'blue' },
  { key: 'advanced', label: '高频', color: 'purple' },
];

export default function Vocabulary() {
  const [activeLevel, setActiveLevel] = useState('basic');
  const [view, setView] = useState('levels'); // levels | cards | favorites
  const [cardIndex, setCardIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [progress, setProgress] = useState(getLearningProgress());

  const words = vocabularyData.filter(w => w.level === activeLevel);
  const learnedSet = new Set(progress[activeLevel] || []);
  const currentWord = words[cardIndex];

  useEffect(() => {
    setProgress(getLearningProgress());
  }, [activeLevel, cardIndex]);

  const handleNext = useCallback(() => {
    if (currentWord) {
      markWordLearned(currentWord.id, activeLevel);
      updateStreak();
    }
    setShowMeaning(false);
    if (cardIndex < words.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      setCardIndex(0);
      setView('levels');
    }
    setProgress(getLearningProgress());
  }, [cardIndex, words.length, currentWord, activeLevel]);

  const handleMaster = useCallback(() => {
    if (currentWord) {
      markWordMastered(currentWord.id);
      markWordLearned(currentWord.id, activeLevel);
      updateStreak();
    }
    handleNext();
  }, [currentWord, activeLevel, handleNext]);

  const startLevel = (level) => {
    setActiveLevel(level);
    // Find first unlearned word
    const levelWords = vocabularyData.filter(w => w.level === level);
    const learned = new Set(getLearningProgress()[level] || []);
    const idx = levelWords.findIndex(w => !learned.has(w.id));
    setCardIndex(idx >= 0 ? idx : 0);
    setShowMeaning(false);
    setView('cards');
  };

  // Favorites view
  if (view === 'favorites') {
    return <FavoritesView onBack={() => setView('levels')} />;
  }

  // Card learning view
  if (view === 'cards' && currentWord) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { setView('levels'); setShowMeaning(false); }} className="text-indigo-600 text-sm font-medium">
            &larr; 返回
          </button>
          <span className="text-sm text-gray-500">
            {cardIndex + 1} / {words.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all"
            style={{ width: `${((cardIndex + 1) / words.length) * 100}%` }}
          />
        </div>

        {/* Word card */}
        <div
          className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm cursor-pointer min-h-[320px] flex flex-col justify-center"
          onClick={() => setShowMeaning(!showMeaning)}
        >
          <div className="text-3xl font-bold text-gray-800 mb-2">{currentWord.word}</div>
          <div className="text-gray-500 mb-1">{currentWord.phonetic}</div>
          <button
            onClick={(e) => { e.stopPropagation(); speak(currentWord.word, { rate: 0.8 }); }}
            className="text-indigo-500 hover:text-indigo-700 text-2xl mb-4 mx-auto"
          >
            🔊
          </button>

          {showMeaning ? (
            <div className="space-y-3 animate-[fadeIn_0.3s]">
              <div className="text-sm text-gray-400">{currentWord.pos}</div>
              <div className="text-xl text-gray-700 font-medium">{currentWord.meaning}</div>
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                {currentWord.examples.map((ex, i) => (
                  <div key={i} className="text-left text-sm">
                    <p
                      className="text-gray-700 cursor-pointer hover:text-indigo-600"
                      onClick={(e) => { e.stopPropagation(); speak(ex.en, { rate: 0.9 }); }}
                    >
                      🔊 {ex.en}
                    </p>
                    <p className="text-gray-400 ml-6">{ex.zh}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-4">点击卡片查看释义</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            下一个
          </button>
          <button
            onClick={handleMaster}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            已掌握 ✓
          </button>
        </div>
      </div>
    );
  }

  // Level selection view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">背单词</h2>
        <button
          onClick={() => setView('favorites')}
          className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
        >
          ★ 生词本
        </button>
      </div>

      <div className="grid gap-4">
        {levels.map(level => {
          const levelWords = vocabularyData.filter(w => w.level === level.key);
          const learned = (progress[level.key] || []).length;
          const total = levelWords.length;
          const pct = total ? Math.round((learned / total) * 100) : 0;
          const colors = {
            green: 'from-green-500 to-emerald-600',
            blue: 'from-blue-500 to-cyan-600',
            purple: 'from-purple-500 to-indigo-600',
          };
          return (
            <div
              key={level.key}
              onClick={() => startLevel(level.key)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-lg">{level.label}词汇</h3>
                <span className="text-sm text-gray-500">{learned}/{total} 已学</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full bg-gradient-to-r ${colors[level.color]} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">进度 {pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FavoritesView({ onBack }) {
  const [favorites, setFavorites] = useState(getFavorites());

  function handleRemove(word) {
    removeFavorite(word);
    setFavorites(getFavorites());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-indigo-600 text-sm font-medium">&larr; 返回</button>
        <h2 className="text-lg font-bold text-gray-800">★ 生词本 ({favorites.length})</h2>
        <div />
      </div>
      {favorites.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📒</p>
          <p>生词本为空，在文章阅读中点击单词收藏吧</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {favorites.map(fav => (
            <div key={fav.word} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => speak(fav.word, { rate: 0.8 })} className="text-indigo-500">🔊</button>
                <div>
                  <span className="font-medium text-gray-800">{fav.word}</span>
                  {fav.phonetic && <span className="text-gray-400 text-sm ml-2">{fav.phonetic}</span>}
                  <p className="text-sm text-gray-500">{fav.meaning}</p>
                </div>
              </div>
              <button onClick={() => handleRemove(fav.word)} className="text-gray-400 hover:text-red-500 text-sm">移除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
