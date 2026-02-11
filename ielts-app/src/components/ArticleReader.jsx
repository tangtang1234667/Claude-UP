import { useState, useCallback, useRef } from 'react';
import { speak, stop } from '../utils/tts.js';
import { translateText, translateBatch } from '../utils/translate.js';
import { addFavorite, removeFavorite, isFavorite } from '../utils/storage.js';

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) || [text];
}

export default function ArticleReader({ article }) {
  const [sentences] = useState(() => splitSentences(article.content));
  const [activeSentence, setActiveSentence] = useState(-1);
  const [translations, setTranslations] = useState({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(0);
  const [playingAll, setPlayingAll] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordTranslation, setWordTranslation] = useState('');
  const [favorited, setFavorited] = useState({});
  const abortRef = useRef(null);

  const speeds = [0.5, 0.75, 1, 1.5];

  const playSentence = useCallback((index) => {
    setActiveSentence(index);
    speak(sentences[index], {
      rate: speed,
      onEnd: () => setActiveSentence(-1),
    });
  }, [sentences, speed]);

  const playAll = useCallback(() => {
    if (playingAll) {
      stop();
      setPlayingAll(false);
      setActiveSentence(-1);
      return;
    }
    setPlayingAll(true);
    let i = 0;
    function playNext() {
      if (i >= sentences.length) {
        setPlayingAll(false);
        setActiveSentence(-1);
        return;
      }
      setActiveSentence(i);
      speak(sentences[i], {
        rate: speed,
        onEnd: () => { i++; playNext(); },
      });
    }
    playNext();
  }, [sentences, speed, playingAll]);

  const toggleTranslation = useCallback(async () => {
    if (showTranslation) {
      // Cancel ongoing translation if any
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setShowTranslation(false);
      setTranslating(false);
      return;
    }

    setShowTranslation(true);
    setTranslating(true);
    setTranslateProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    let done = 0;
    await translateBatch(sentences, {
      concurrency: 3,
      signal: controller.signal,
      onProgress: (idx, text) => {
        done++;
        setTranslateProgress(Math.round((done / sentences.length) * 100));
        setTranslations(prev => ({ ...prev, [idx]: text }));
      },
    });

    if (!controller.signal.aborted) {
      setTranslating(false);
    }
    abortRef.current = null;
  }, [showTranslation, sentences]);

  const handleWordClick = useCallback(async (word) => {
    const clean = word.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
    if (!clean) return;
    setSelectedWord(clean);
    setWordTranslation('查询中...');
    const t = await translateText(clean);
    setWordTranslation(t);
    setFavorited(prev => ({ ...prev, [clean]: isFavorite(clean) }));
  }, []);

  const toggleFavorite = useCallback((word) => {
    if (isFavorite(word)) {
      removeFavorite(word);
      setFavorited(prev => ({ ...prev, [word]: false }));
    } else {
      addFavorite({ word, meaning: wordTranslation, phonetic: '', pos: '' });
      setFavorited(prev => ({ ...prev, [word]: true }));
    }
  }, [wordTranslation]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent animate-fade-in-up">
        {article.title}
      </h2>

      {/* Controls */}
      <div className="animate-fade-in-up stagger-1 flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-3 shadow-sm">
        <button
          onClick={playAll}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            playingAll
              ? 'bg-red-100 text-red-700 hover:bg-red-200 animate-pulse-glow'
              : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 hover:shadow-md hover:shadow-indigo-100'
          }`}
        >
          {playingAll ? '⏹ 停止' : '▶ 播放全文'}
        </button>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <span>语速:</span>
          {speeds.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                speed === s
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <button
          onClick={toggleTranslation}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            showTranslation
              ? 'bg-green-100 text-green-700 shadow-sm shadow-green-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {translating ? `翻译中 ${translateProgress}%` : showTranslation ? '隐藏翻译' : '显示翻译'}
        </button>
        <span className="text-xs text-gray-400">共 {sentences.length} 句</span>
      </div>

      {/* Translation progress bar */}
      {translating && (
        <div className="animate-fade-in w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 relative"
            style={{ width: `${translateProgress}%` }}
          >
            <div className="absolute inset-0 shimmer-bar rounded-full" />
          </div>
        </div>
      )}

      {/* Sentences */}
      <div className="animate-fade-in-up stagger-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-5 space-y-3 shadow-sm">
        {sentences.map((sentence, idx) => (
          <div key={idx} className="group">
            <div
              className={`leading-relaxed cursor-pointer rounded-lg px-2 py-1.5 transition-all duration-300 ${
                activeSentence === idx
                  ? 'reading-highlight text-indigo-800 scale-[1.01] shadow-sm'
                  : 'hover:bg-indigo-50/50'
              }`}
              onClick={() => playSentence(idx)}
            >
              {sentence.split(/(\s+)/).map((word, wIdx) => (
                <span
                  key={wIdx}
                  className={word.trim() ? 'word-hover cursor-pointer rounded px-0.5' : ''}
                  onClick={(e) => {
                    if (word.trim()) {
                      e.stopPropagation();
                      handleWordClick(word);
                    }
                  }}
                >
                  {word}
                </span>
              ))}
              <span className="invisible group-hover:visible text-indigo-400 ml-2 text-xs transition-opacity">
                🔊 点击播放
              </span>
            </div>
            {showTranslation && translations[idx] && (
              <div className="animate-fade-in text-sm text-gray-500 px-2 mt-1 border-l-2 border-indigo-300 ml-2 pl-2">
                {translations[idx]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Word popup */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedWord(null)}>
          <div className="animate-scale-in bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-indigo-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">{selectedWord}</h3>
              <button
                onClick={() => speak(selectedWord, { rate: 0.8 })}
                className="text-indigo-600 hover:text-indigo-800 text-xl transition-transform hover:scale-110"
              >
                🔊
              </button>
            </div>
            <p className="text-gray-600 mb-4">{wordTranslation}</p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleFavorite(selectedWord)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  favorited[selectedWord]
                    ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {favorited[selectedWord] ? '★ 已收藏' : '☆ 收藏'}
              </button>
              <button
                onClick={() => setSelectedWord(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
