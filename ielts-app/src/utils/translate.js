const CACHE_KEY = 'ielts_translate_cache';

// Keep cache in memory to avoid repeated JSON.parse on every call
let memoryCache = null;

function getCache() {
  if (memoryCache) return memoryCache;
  try {
    memoryCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    return memoryCache;
  } catch {
    memoryCache = {};
    return memoryCache;
  }
}

function setCache(key, value) {
  const cache = getCache();
  cache[key] = value;
  // Debounced persist — don't write to localStorage on every single call
  schedulePersist();
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      if (memoryCache) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
      }
    } catch {}
  }, 1000);
}

// Simple dictionary for common words - offline fallback
const miniDict = {
  "the": "这个", "a": "一个", "is": "是", "are": "是", "was": "是",
  "have": "有", "has": "有", "do": "做", "does": "做", "will": "将",
  "can": "能", "could": "能", "would": "会", "should": "应该",
  "and": "和", "or": "或", "but": "但是", "not": "不", "no": "没有",
};

export async function translateText(text) {
  if (!text.trim()) return '';
  const cached = getCache()[text];
  if (cached) return cached;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const result = data.responseData.translatedText;
      setCache(text, result);
      return result;
    }
  } catch {}

  return `[翻译] ${text}`;
}

// Translate sentences in batches with concurrency control
// onProgress(index, translation) is called as each sentence is translated
export async function translateBatch(sentences, { concurrency = 3, signal, onProgress } = {}) {
  const results = new Array(sentences.length).fill(null);
  const cache = getCache();

  // Fill cached results first
  const pending = [];
  for (let i = 0; i < sentences.length; i++) {
    const cached = cache[sentences[i]];
    if (cached) {
      results[i] = cached;
      if (onProgress) onProgress(i, cached);
    } else {
      pending.push(i);
    }
  }

  // Translate uncached sentences in parallel batches
  let cursor = 0;
  while (cursor < pending.length) {
    if (signal?.aborted) break;

    const batch = pending.slice(cursor, cursor + concurrency);
    cursor += concurrency;

    const promises = batch.map(async (idx) => {
      if (signal?.aborted) return;
      const t = await translateText(sentences[idx]);
      results[idx] = t;
      if (onProgress) onProgress(idx, t);
    });

    await Promise.all(promises);
  }

  return results;
}

export function lookupWord(word) {
  const w = word.toLowerCase().trim();
  if (miniDict[w]) return miniDict[w];
  return null;
}
