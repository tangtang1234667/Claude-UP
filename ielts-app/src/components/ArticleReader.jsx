import { useState, useCallback } from 'react';
import { speak, stop, isSpeaking } from '../utils/tts.js';
import { translateText } from '../utils/translate.js';
import { addFavorite, removeFavorite, isFavorite } from '../utils/storage.js';

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) || [text];
}

export default function ArticleReader({ article }) {
  const [sentences] = useState(() => splitSentences(article.content));
  const [activeSentence, setActiveSentence] = useState(-1);
  const [translations, setTranslations] = useState({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [playingAll, setPlayingAll] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordTranslation, setWordTranslation] = useState('');
  const [favorited, setFavorited] = useState({});

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
      setShowTranslation(false);
      return;
    }
    setShowTranslation(true);
    // Translate sentences that aren't cached yet
    for (let i = 0; i < sentences.length; i++) {
      if (!translations[i]) {
        const t = await translateText(sentences[i]);
        setTranslations(prev => ({ ...prev, [i]: t }));
      }
    }
  }, [showTranslation, sentences, translations]);

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
      <h2 className="text-xl font-bold text-gray-800">{article.title}</h2>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
        <button
          onClick={playAll}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            playingAll
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
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
              className={`px-2 py-1 rounded text-xs ${
                speed === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <button
          onClick={toggleTranslation}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showTranslation
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {showTranslation ? '隐藏翻译' : '显示翻译'}
        </button>
      </div>

      {/* Sentences */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        {sentences.map((sentence, idx) => (
          <div key={idx} className="group">
            <div
              className={`leading-relaxed cursor-pointer rounded-lg px-2 py-1 transition-colors ${
                activeSentence === idx
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => playSentence(idx)}
            >
              {sentence.split(/(\s+)/).map((word, wIdx) => (
                <span
                  key={wIdx}
                  className={word.trim() ? 'hover:text-indigo-600 hover:underline cursor-pointer' : ''}
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
              <span className="invisible group-hover:visible text-indigo-400 ml-2 text-xs">
                🔊 点击播放
              </span>
            </div>
            {showTranslation && translations[idx] && (
              <div className="text-sm text-gray-500 px-2 mt-1 border-l-2 border-indigo-200 ml-2 pl-2">
                {translations[idx]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Word popup */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelectedWord(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-800">{selectedWord}</h3>
              <button
                onClick={() => speak(selectedWord, { rate: 0.8 })}
                className="text-indigo-600 hover:text-indigo-800"
              >
                🔊
              </button>
            </div>
            <p className="text-gray-600 mb-4">{wordTranslation}</p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleFavorite(selectedWord)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  favorited[selectedWord]
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {favorited[selectedWord] ? '★ 已收藏' : '☆ 收藏'}
              </button>
              <button
                onClick={() => setSelectedWord(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
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
