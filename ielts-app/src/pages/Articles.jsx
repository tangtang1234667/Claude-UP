import { useState, useEffect } from 'react';
import { getArticles, saveArticle, deleteArticle } from '../utils/storage.js';
import { fetchArticleFromUrl, isValidUrl } from '../utils/fetchUrl.js';
import ArticleReader from '../components/ArticleReader.jsx';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState('url'); // url | text | file
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);

  useEffect(() => {
    setArticles(getArticles());
  }, []);

  function resetImport() {
    setImportText('');
    setImportTitle('');
    setImportUrl('');
    setUrlError('');
    setUrlLoading(false);
  }

  function handleImport() {
    if (!importText.trim()) return;
    const article = {
      id: Date.now(),
      title: importTitle.trim() || `文章 ${articles.length + 1}`,
      content: importText.trim(),
      createdAt: new Date().toISOString(),
    };
    saveArticle(article);
    setArticles(getArticles());
    resetImport();
    setShowImport(false);
  }

  async function handleUrlFetch() {
    const url = importUrl.trim();
    if (!url) return;
    if (!isValidUrl(url)) {
      setUrlError('请输入有效的网页链接（以 http:// 或 https:// 开头）');
      return;
    }
    setUrlLoading(true);
    setUrlError('');
    try {
      const { title, content } = await fetchArticleFromUrl(url);
      setImportTitle(title || '');
      setImportText(content);
      // Auto switch to text tab so user can preview and edit
      setImportTab('text');
    } catch (e) {
      setUrlError(e.message || '获取失败，请检查链接或稍后重试');
    } finally {
      setUrlLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText(ev.target.result);
      setImportTitle(file.name.replace(/\.\w+$/, ''));
    };
    reader.readAsText(file);
  }

  function handleDelete(id) {
    deleteArticle(id);
    setArticles(getArticles());
  }

  if (activeArticle) {
    return (
      <div className="animate-slide-right">
        <button
          onClick={() => setActiveArticle(null)}
          className="mb-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
        >
          &larr; 返回文章列表
        </button>
        <ArticleReader article={activeArticle} />
      </div>
    );
  }

  const tabs = [
    { key: 'url', label: '网页链接', icon: '🔗' },
    { key: 'text', label: '粘贴文本', icon: '📋' },
    { key: 'file', label: '上传文件', icon: '📁' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">文章阅读</h2>
        <button
          onClick={() => setShowImport(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5"
        >
          + 导入文章
        </button>
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="animate-scale-in bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto shadow-2xl border border-indigo-100">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">导入文章</h3>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setImportTab(tab.key)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                    importTab === tab.key
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* URL tab */}
            {importTab === 'url' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-gray-400">粘贴英文文章的网页链接，自动提取正文内容</p>
                <input
                  type="url"
                  placeholder="https://example.com/article..."
                  value={importUrl}
                  onChange={(e) => { setImportUrl(e.target.value); setUrlError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
                {urlError && (
                  <p className="text-xs text-red-500 animate-fade-in">{urlError}</p>
                )}
                <button
                  onClick={handleUrlFetch}
                  disabled={urlLoading || !importUrl.trim()}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {urlLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      正在提取内容...
                    </>
                  ) : (
                    '提取文章内容'
                  )}
                </button>
              </div>
            )}

            {/* Text tab */}
            {importTab === 'text' && (
              <div className="space-y-3 animate-fade-in">
                <input
                  type="text"
                  placeholder="文章标题（可选）"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
                <textarea
                  placeholder="粘贴英文文章内容..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
                />
                {importText && (
                  <p className="text-xs text-gray-400">已提取 {importText.length} 个字符，可编辑后导入</p>
                )}
              </div>
            )}

            {/* File tab */}
            {importTab === 'file' && (
              <div className="space-y-3 animate-fade-in">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
                  <p className="text-4xl mb-3">📄</p>
                  <p className="text-sm text-gray-500 mb-3">选择 .txt 文件上传</p>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="text-sm"
                  />
                </div>
                {importText && (
                  <p className="text-xs text-green-600 animate-fade-in">
                    已读取文件内容（{importText.length} 个字符），点击导入保存
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setShowImport(false); resetImport(); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
              >
                导入文章
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article list */}
      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400 animate-fade-in-up stagger-2">
          <p className="text-5xl mb-4 animate-float">📖</p>
          <p>还没有文章，点击上方按钮导入你感兴趣的英文文章</p>
          <p className="text-sm mt-2">支持粘贴网页链接、文本内容或上传文件</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {articles.map((article, idx) => (
            <div
              key={article.id}
              className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)} bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200/50 group`}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setActiveArticle(article)}
                >
                  <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{article.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {article.content.slice(0, 150)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="text-gray-300 hover:text-red-500 ml-3 text-sm transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
