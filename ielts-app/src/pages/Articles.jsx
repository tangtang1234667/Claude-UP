import { useState, useEffect } from 'react';
import { getArticles, saveArticle, deleteArticle } from '../utils/storage.js';
import ArticleReader from '../components/ArticleReader.jsx';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);

  useEffect(() => {
    setArticles(getArticles());
  }, []);

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
    setImportText('');
    setImportTitle('');
    setShowImport(false);
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

      {/* Import modal with scale animation */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="animate-scale-in bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto shadow-2xl border border-indigo-100">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">导入文章</h3>
            <input
              type="text"
              placeholder="文章标题（可选）"
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
            <textarea
              placeholder="粘贴英文文章内容..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
            />
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-1">或上传文件（.txt）</label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="text-sm"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowImport(false); setImportText(''); setImportTitle(''); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article list with staggered entrance */}
      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400 animate-fade-in-up stagger-2">
          <p className="text-5xl mb-4 animate-float">📖</p>
          <p>还没有文章，点击上方按钮导入你感兴趣的英文文章</p>
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
