import { useState, useEffect, useCallback } from 'react';
import vocabularyData from '../data/vocabulary.js';
import { speak } from '../utils/tts.js';
import {
  getLearningProgress, markWordLearned, markWordMastered,
  addFavorite, removeFavorite, isFavorite, getFavorites,
  updateStreak,
} from '../utils/storage.js';

const levels = [
  { key: 'basic', label: '基础', color: 'green', gradient: 'from-green-500 to-emerald-600' },
  { key: 'intermediate', label: '进阶', color: 'blue', gradient: 'from-blue-500 to-cyan-600' },
  { key: 'advanced', label: '高频', color: 'purple', gradient: 'from-purple-500 to-indigo-600' },
];

export default function Vocabulary() {
  const [activeLevel, setActiveLevel] = useState('basic');
  const [view, setView] = useState('levels');
  const [cardIndex, setCardIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [progress, setProgress] = useState(getLearningProgress());
  const [cardFlip, setCardFlip] = useState(false);

  const words = vocabularyData.filter(w => w.level === activeLevel);
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
    setCardFlip(false);
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

  const toggleCard = () => {
    setCardFlip(!cardFlip);
    setShowMeaning(!showMeaning);
  };

  const startLevel = (level) => {
    setActiveLevel(level);
    const levelWords = vocabularyData.filter(w => w.level === level);
    const learned = new Set(getLearningProgress()[level] || []);
    const idx = levelWords.findIndex(w => !learned.has(w.id));
    setCardIndex(idx >= 0 ? idx : 0);
    setShowMeaning(false);
    setCardFlip(false);
    setView('cards');
  };

  if (view === 'favorites') {
    return <FavoritesView onBack={() => setView('levels')} />;
  }

  // Card learning view
  if (view === 'cards' && currentWord) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <button onClick={() => { setView('levels'); setShowMeaning(false); setCardFlip(false); }} className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors">
            &larr; 返回
          </button>
          <span className="text-sm text-gray-500">
            {cardIndex + 1} / {words.length}
          </span>
        </div>

        {/* Shimmer progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 relative"
            style={{ width: `${((cardIndex + 1) / words.length) * 100}%` }}
          >
            <div className="absolute inset-0 shimmer-bar rounded-full" />
          </div>
        </div>

        {/* Flip card */}
        <div
          className="cursor-pointer perspective-[1000px] min-h-[360px]"
          onClick={toggleCard}
        >
          <div className={`relative w-full min-h-[360px] transition-transform duration-500 [transform-style:preserve-3d] ${cardFlip ? '[transform:rotateY(180deg)]' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border border-indigo-100 p-8 text-center shadow-lg flex flex-col justify-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-3">{currentWord.word}</div>
              <div className="text-gray-400 mb-2">{currentWord.phonetic}</div>
              <button
                onClick={(e) => { e.stopPropagation(); speak(currentWord.word, { rate: 0.8 }); }}
                className="text-indigo-500 hover:text-indigo-700 text-3xl mb-4 mx-auto transition-transform hover:scale-110"
              >
                🔊
              </button>
              <p className="text-gray-400 text-sm mt-4 animate-pulse">点击卡片查看释义</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-100 p-8 text-center shadow-lg flex flex-col justify-center overflow-auto">
              <div className="text-2xl font-bold text-gray-800 mb-1">{currentWord.word}</div>
              <div className="text-sm text-gray-400 mb-2">{currentWord.pos}</div>
              <div className="text-xl text-indigo-700 font-medium mb-4">{currentWord.meaning}</div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {currentWord.examples.map((ex, i) => (
                  <div key={i} className="text-left text-sm">
                    <p
                      className="text-gray-700 cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); speak(ex.en, { rate: 0.9 }); }}
                    >
                      🔊 {ex.en}
                    </p>
                    <p className="text-gray-400 ml-6">{ex.zh}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5"
          >
            下一个
          </button>
          <button
            onClick={handleMaster}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:shadow-lg hover:shadow-green-200 transition-all duration-300 hover:-translate-y-0.5"
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
      <div className="flex items-center justify-between animate-fade-in-up">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">背单词</h2>
        <button
          onClick={() => setView('favorites')}
          className="text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors"
        >
          ★ 生词本
        </button>
      </div>

      <div className="grid gap-4">
        {levels.map((level, idx) => {
          const levelWords = vocabularyData.filter(w => w.level === level.key);
          const learned = (progress[level.key] || []).length;
          const total = levelWords.length;
          const pct = total ? Math.round((learned / total) * 100) : 0;
          return (
            <div
              key={level.key}
              onClick={() => startLevel(level.key)}
              className={`animate-fade-in-up stagger-${idx + 1} bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group relative overflow-hidden`}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${level.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <h3 className="font-semibold text-gray-800 text-lg group-hover:text-indigo-700 transition-colors">{level.label}词汇</h3>
                <span className="text-sm text-gray-500">{learned}/{total} 已学</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative z-10">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${level.gradient} transition-all duration-700 relative`}
                  style={{ width: `${pct}%` }}
                >
                  {pct > 0 && <div className="absolute inset-0 shimmer-bar rounded-full" />}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 relative z-10">进度 {pct}%</p>
              {/* Arrow */}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300 z-10">→</span>
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
      <div className="flex items-center justify-between animate-fade-in-up">
        <button onClick={onBack} className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors">&larr; 返回</button>
        <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">★ 生词本 ({favorites.length})</h2>
        <div />
      </div>
      {favorites.length === 0 ? (
        <div className="text-center py-20 text-gray-400 animate-fade-in-up stagger-2">
          <p className="text-5xl mb-4 animate-float">📒</p>
          <p>生词本为空，在文章阅读中点击单词收藏吧</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {favorites.map((fav, idx) => (
            <div key={fav.word} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)} bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-4 flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <div className="flex items-center gap-3">
                <button onClick={() => speak(fav.word, { rate: 0.8 })} className="text-indigo-500 transition-transform hover:scale-110">🔊</button>
                <div>
                  <span className="font-medium text-gray-800">{fav.word}</span>
                  {fav.phonetic && <span className="text-gray-400 text-sm ml-2">{fav.phonetic}</span>}
                  <p className="text-sm text-gray-500">{fav.meaning}</p>
                </div>
              </div>
              <button onClick={() => handleRemove(fav.word)} className="text-gray-300 hover:text-red-500 text-sm transition-colors">移除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
