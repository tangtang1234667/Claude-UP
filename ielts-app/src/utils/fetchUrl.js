// Fetch and extract readable text content from a web page URL
// Uses a CORS proxy to bypass cross-origin restrictions in the browser

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

export async function fetchArticleFromUrl(url) {
  let html = '';
  let lastError = null;

  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      html = await res.text();
      if (html.length > 100) break;
    } catch (e) {
      lastError = e;
    }
  }

  if (!html) {
    throw new Error(lastError?.message || '无法获取网页内容，请检查链接是否正确');
  }

  const { title, content } = extractContent(html);
  if (!content || content.length < 20) {
    throw new Error('未能从网页中提取到足够的文本内容');
  }

  return { title, content };
}

function extractContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract title
  const title =
    doc.querySelector('meta[property="og:title"]')?.content ||
    doc.querySelector('title')?.textContent?.trim() ||
    '';

  // Remove unwanted elements
  const removeSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 'aside',
    'iframe', 'noscript', 'svg', 'form', 'button', 'input',
    '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
    '.nav', '.menu', '.sidebar', '.footer', '.header', '.ad',
    '.advertisement', '.social', '.share', '.comment', '.comments',
  ];
  removeSelectors.forEach(sel => {
    doc.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Try to find main content area
  const contentEl =
    doc.querySelector('article') ||
    doc.querySelector('[role="main"]') ||
    doc.querySelector('main') ||
    doc.querySelector('.post-content') ||
    doc.querySelector('.article-content') ||
    doc.querySelector('.entry-content') ||
    doc.querySelector('.content') ||
    doc.querySelector('#content') ||
    doc.body;

  if (!contentEl) return { title, content: '' };

  // Extract text from paragraphs and headings
  const blocks = contentEl.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th, figcaption');
  const textParts = [];

  blocks.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 10) {
      textParts.push(text);
    }
  });

  // If paragraphs didn't yield enough, fallback to full text
  let content = textParts.join('\n\n');
  if (content.length < 100) {
    content = contentEl.textContent
      ?.replace(/\s+/g, ' ')
      ?.trim() || '';
  }

  // Clean up excessive whitespace
  content = content
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, content };
}

export function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
