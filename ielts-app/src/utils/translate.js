const CACHE_KEY = 'ielts_translate_cache';

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch { return {}; }
}

function setCache(key, value) {
  try {
    const cache = getCache();
    cache[key] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
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
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const result = data.responseData.translatedText;
      setCache(text, result);
      return result;
    }
  } catch {}

  // Fallback: return placeholder
  return `[翻译] ${text}`;
}

export async function translateSentences(sentences) {
  const results = [];
  for (const s of sentences) {
    results.push(await translateText(s));
  }
  return results;
}

export function lookupWord(word) {
  const w = word.toLowerCase().trim();
  if (miniDict[w]) return miniDict[w];
  return null;
}
