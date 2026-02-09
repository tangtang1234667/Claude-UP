import vocabularyData from '../data/vocabulary.js';
import { getLearningProgress, getWrongAnswers } from './storage.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

function generateChoices(correctMeaning, allWords) {
  const wrongs = allWords
    .filter(w => w.meaning !== correctMeaning)
    .map(w => w.meaning);
  const picked = pickRandom(wrongs, 3);
  const choices = shuffle([correctMeaning, ...picked]);
  return choices;
}

export function generateQuiz(count = 10) {
  const progress = getLearningProgress();
  const wrongAnswers = getWrongAnswers();

  // Collect learned word IDs
  const learnedIds = new Set([
    ...progress.basic,
    ...progress.intermediate,
    ...progress.advanced,
  ]);

  // Get learned words from vocabulary
  let learnedWords = vocabularyData.filter(w => learnedIds.has(w.id));

  // If not enough learned words, supplement with random vocab
  if (learnedWords.length < count) {
    const extra = vocabularyData.filter(w => !learnedIds.has(w.id));
    learnedWords = [...learnedWords, ...pickRandom(extra, count - learnedWords.length)];
  }

  // Priority: wrong answers first
  const wrongIds = new Set(wrongAnswers.map(w => w.wordId));
  const wrongWords = learnedWords.filter(w => wrongIds.has(w.id));
  const normalWords = learnedWords.filter(w => !wrongIds.has(w.id));

  // Take wrong answers first (up to half), then fill with normal
  const wrongPortion = Math.min(wrongWords.length, Math.ceil(count / 2));
  const normalPortion = count - wrongPortion;
  const selected = [
    ...pickRandom(wrongWords, wrongPortion),
    ...pickRandom(normalWords, normalPortion),
  ].slice(0, count);

  // Generate different question types
  const questions = selected.map((word, idx) => {
    const type = idx % 3; // rotate: choice, fill-in, spell
    if (type === 0) {
      return {
        id: idx,
        type: 'choice',
        wordId: word.id,
        question: `"${word.word}" 的中文意思是？`,
        answer: word.meaning,
        choices: generateChoices(word.meaning, vocabularyData),
        word: word.word,
      };
    } else if (type === 1) {
      return {
        id: idx,
        type: 'choice_reverse',
        wordId: word.id,
        question: `"${word.meaning}" 对应的英文单词是？`,
        answer: word.word,
        choices: shuffle([word.word, ...pickRandom(vocabularyData.filter(w => w.word !== word.word), 3).map(w => w.word)]),
        word: word.word,
      };
    } else {
      return {
        id: idx,
        type: 'spell',
        wordId: word.id,
        question: `请拼写出中文含义为 "${word.meaning}" 的英文单词`,
        answer: word.word.toLowerCase(),
        hint: word.word[0] + '_'.repeat(word.word.length - 1),
        word: word.word,
        meaning: word.meaning,
      };
    }
  });

  return shuffle(questions);
}
