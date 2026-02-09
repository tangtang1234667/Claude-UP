import { useState, useEffect } from 'react';
import { generateQuiz } from '../utils/practice.js';
import {
  addWrongAnswer, removeWrongAnswer, getWrongAnswers,
  savePracticeResult, getPracticeHistory, updateStreak,
} from '../utils/storage.js';

export default function Practice() {
  const [view, setView] = useState('menu'); // menu | quiz | result | wrong | stats
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [spellInput, setSpellInput] = useState('');

  function startQuiz() {
    const q = generateQuiz(10);
    setQuestions(q);
    setCurrent(0);
    setAnswers({});
    setShowAnswer(false);
    setSpellInput('');
    setView('quiz');
  }

  function handleAnswer(answer) {
    const q = questions[current];
    const isCorrect = q.type === 'spell'
      ? answer.toLowerCase().trim() === q.answer.toLowerCase()
      : answer === q.answer;

    setAnswers(prev => ({ ...prev, [current]: { answer, isCorrect } }));
    setShowAnswer(true);

    if (isCorrect) {
      removeWrongAnswer(q.wordId);
    } else {
      addWrongAnswer(q.wordId, q.word, q.type === 'choice' ? q.answer : (q.meaning || q.answer));
    }
  }

  function nextQuestion() {
    setShowAnswer(false);
    setSpellInput('');
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      // Finish quiz
      const total = questions.length;
      const correct = Object.values(answers).filter(a => a.isCorrect).length;
      savePracticeResult(total, correct, total - correct);
      updateStreak();
      setView('result');
    }
  }

  const q = questions[current];
  const totalCorrect = Object.values(answers).filter(a => a.isCorrect).length;

  // Menu view
  if (view === 'menu') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">每日练习</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={startQuiz}
            className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">✏️</span>
            <h3 className="font-semibold text-gray-800 mt-3">开始练习</h3>
            <p className="text-sm text-gray-500 mt-1">根据学习记录生成 10 道练习题</p>
          </button>
          <button
            onClick={() => setView('wrong')}
            className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">📕</span>
            <h3 className="font-semibold text-gray-800 mt-3">错题本</h3>
            <p className="text-sm text-gray-500 mt-1">回顾做错的题目</p>
          </button>
          <button
            onClick={() => setView('stats')}
            className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
          >
            <span className="text-3xl">📊</span>
            <h3 className="font-semibold text-gray-800 mt-3">学习统计</h3>
            <p className="text-sm text-gray-500 mt-1">查看练习历史与正确率</p>
          </button>
        </div>
      </div>
    );
  }

  // Quiz view
  if (view === 'quiz' && q) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('menu')} className="text-indigo-600 text-sm font-medium">&larr; 退出</button>
          <span className="text-sm text-gray-500">{current + 1} / {questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[300px]">
          {/* Question type badge */}
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-4 ${
            q.type === 'spell' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {q.type === 'spell' ? '拼写题' : '选择题'}
          </span>

          <h3 className="text-lg font-semibold text-gray-800 mb-6">{q.question}</h3>

          {/* Choice questions */}
          {(q.type === 'choice' || q.type === 'choice_reverse') && (
            <div className="space-y-3">
              {q.choices.map((choice, idx) => {
                let style = 'bg-gray-50 hover:bg-indigo-50 border-gray-200';
                if (showAnswer) {
                  if (choice === q.answer) style = 'bg-green-50 border-green-400 text-green-800';
                  else if (answers[current]?.answer === choice && !answers[current]?.isCorrect)
                    style = 'bg-red-50 border-red-400 text-red-800';
                  else style = 'bg-gray-50 border-gray-200 opacity-50';
                }
                return (
                  <button
                    key={idx}
                    onClick={() => !showAnswer && handleAnswer(choice)}
                    disabled={showAnswer}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${style}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          )}

          {/* Spell question */}
          {q.type === 'spell' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">提示: {q.hint}</p>
              <input
                type="text"
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !showAnswer && handleAnswer(spellInput)}
                disabled={showAnswer}
                placeholder="输入英文单词..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              {!showAnswer && (
                <button
                  onClick={() => handleAnswer(spellInput)}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                >
                  提交
                </button>
              )}
              {showAnswer && (
                <div className={`px-4 py-3 rounded-xl text-sm ${
                  answers[current]?.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {answers[current]?.isCorrect ? '✓ 正确！' : `✗ 正确答案: ${q.answer}`}
                </div>
              )}
            </div>
          )}
        </div>

        {showAnswer && (
          <button
            onClick={nextQuestion}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            {current < questions.length - 1 ? '下一题' : '查看结果'}
          </button>
        )}
      </div>
    );
  }

  // Result view
  if (view === 'result') {
    const total = questions.length;
    const pct = Math.round((totalCorrect / total) * 100);
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className={`text-6xl font-bold mb-2 ${pct >= 60 ? 'text-green-600' : 'text-red-500'}`}>
            {pct}%
          </div>
          <p className="text-gray-500 mb-4">正确率</p>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
              <div className="text-gray-400">正确</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{total - totalCorrect}</div>
              <div className="text-gray-400">错误</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={startQuiz} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
            再来一组
          </button>
          <button onClick={() => setView('menu')} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
            返回
          </button>
        </div>
      </div>
    );
  }

  // Wrong answers view
  if (view === 'wrong') {
    return <WrongAnswersView onBack={() => setView('menu')} />;
  }

  // Stats view
  if (view === 'stats') {
    return <StatsView onBack={() => setView('menu')} />;
  }

  return null;
}

function WrongAnswersView({ onBack }) {
  const wrongs = getWrongAnswers();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-indigo-600 text-sm font-medium">&larr; 返回</button>
        <h2 className="text-lg font-bold text-gray-800">错题本 ({wrongs.length})</h2>
      </div>
      {wrongs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🎉</p>
          <p>没有错题，继续保持！</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {wrongs.map(w => (
            <div key={w.wordId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-800">{w.word}</span>
                <span className="text-sm text-gray-500 ml-3">{w.meaning}</span>
              </div>
              <span className="text-xs text-red-400">错 {w.wrongCount} 次</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsView({ onBack }) {
  const history = getPracticeHistory();
  const recent = history.slice(-7).reverse();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-indigo-600 text-sm font-medium">&larr; 返回</button>
        <h2 className="text-lg font-bold text-gray-800">学习统计</h2>
      </div>
      {recent.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📊</p>
          <p>还没有练习记录，去做一组练习吧</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {recent.map((r, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">{r.date}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600">正确 {r.correct}</span>
                <span className="text-red-500">错误 {r.wrong}</span>
                <span className="font-medium text-gray-700">
                  {r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
