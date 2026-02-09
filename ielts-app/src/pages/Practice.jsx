import { useState } from 'react';
import { generateQuiz } from '../utils/practice.js';
import {
  addWrongAnswer, removeWrongAnswer, getWrongAnswers,
  savePracticeResult, getPracticeHistory, updateStreak,
} from '../utils/storage.js';

export default function Practice() {
  const [view, setView] = useState('menu');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [spellInput, setSpellInput] = useState('');
  const [answerAnim, setAnswerAnim] = useState('');

  function startQuiz() {
    const q = generateQuiz(10);
    setQuestions(q);
    setCurrent(0);
    setAnswers({});
    setShowAnswer(false);
    setSpellInput('');
    setAnswerAnim('');
    setView('quiz');
  }

  function handleAnswer(answer) {
    const q = questions[current];
    const isCorrect = q.type === 'spell'
      ? answer.toLowerCase().trim() === q.answer.toLowerCase()
      : answer === q.answer;

    setAnswers(prev => ({ ...prev, [current]: { answer, isCorrect } }));
    setShowAnswer(true);
    setAnswerAnim(isCorrect ? 'animate-correct' : 'animate-shake');
    setTimeout(() => setAnswerAnim(''), 500);

    if (isCorrect) {
      removeWrongAnswer(q.wordId);
    } else {
      addWrongAnswer(q.wordId, q.word, q.type === 'choice' ? q.answer : (q.meaning || q.answer));
    }
  }

  function nextQuestion() {
    setShowAnswer(false);
    setSpellInput('');
    setAnswerAnim('');
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent animate-fade-in-up">每日练习</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { onClick: startQuiz, icon: '✏️', title: '开始练习', desc: '根据学习记录生成 10 道练习题', gradient: 'from-indigo-500 to-purple-500' },
            { onClick: () => setView('wrong'), icon: '📕', title: '错题本', desc: '回顾做错的题目', gradient: 'from-red-500 to-pink-500' },
            { onClick: () => setView('stats'), icon: '📊', title: '学习统计', desc: '查看练习历史与正确率', gradient: 'from-blue-500 to-cyan-500' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`animate-fade-in-up stagger-${idx + 1} group bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-6 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <span className="text-3xl block transition-transform duration-300 group-hover:scale-110 relative z-10">{item.icon}</span>
              <h3 className="font-semibold text-gray-800 mt-3 group-hover:text-indigo-700 transition-colors relative z-10">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1 relative z-10">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Quiz view
  if (view === 'quiz' && q) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('menu')} className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors">&larr; 退出</button>
          <span className="text-sm text-gray-500">{current + 1} / {questions.length}</span>
        </div>

        {/* Shimmer progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 relative"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          >
            <div className="absolute inset-0 shimmer-bar rounded-full" />
          </div>
        </div>

        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/80 p-6 min-h-[300px] shadow-lg ${answerAnim}`} key={current}>
          {/* Question type badge */}
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            q.type === 'spell'
              ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700'
              : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
          }`}>
            {q.type === 'spell' ? '拼写题' : '选择题'}
          </span>

          <h3 className="text-lg font-semibold text-gray-800 mb-6 animate-fade-in">{q.question}</h3>

          {/* Choice questions */}
          {(q.type === 'choice' || q.type === 'choice_reverse') && (
            <div className="space-y-3">
              {q.choices.map((choice, idx) => {
                let style = 'bg-gray-50/80 hover:bg-indigo-50 border-gray-200 hover:border-indigo-200';
                if (showAnswer) {
                  if (choice === q.answer) style = 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-800 shadow-sm shadow-green-100';
                  else if (answers[current]?.answer === choice && !answers[current]?.isCorrect)
                    style = 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400 text-red-800';
                  else style = 'bg-gray-50 border-gray-200 opacity-40';
                }
                return (
                  <button
                    key={idx}
                    onClick={() => !showAnswer && handleAnswer(choice)}
                    disabled={showAnswer}
                    className={`animate-fade-in-up stagger-${idx + 1} w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-300 ${style}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          )}

          {/* Spell question */}
          {q.type === 'spell' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-gray-400 font-mono">提示: {q.hint}</p>
              <input
                type="text"
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !showAnswer && handleAnswer(spellInput)}
                disabled={showAnswer}
                placeholder="输入英文单词..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                autoFocus
              />
              {!showAnswer && (
                <button
                  onClick={() => handleAnswer(spellInput)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300"
                >
                  提交
                </button>
              )}
              {showAnswer && (
                <div className={`animate-scale-in px-4 py-3 rounded-xl text-sm font-medium ${
                  answers[current]?.isCorrect
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200'
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
            className="animate-fade-in-up w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5"
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
      <div className="max-w-lg mx-auto text-center space-y-6 animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/80 p-8 shadow-lg relative overflow-hidden">
          {/* Background decoration */}
          <div className={`absolute inset-0 bg-gradient-to-br ${pct >= 60 ? 'from-green-50 to-emerald-50' : 'from-red-50 to-pink-50'} opacity-50`} />
          <div className="relative z-10">
            <div className={`text-7xl font-bold mb-2 animate-count-pop bg-gradient-to-r bg-clip-text text-transparent ${
              pct >= 60 ? 'from-green-600 to-emerald-600' : 'from-red-500 to-pink-500'
            }`}>
              {pct}%
            </div>
            <p className="text-gray-500 mb-6">正确率</p>
            <div className="flex justify-center gap-10 text-sm">
              <div className="animate-fade-in-up stagger-1">
                <div className="text-3xl font-bold text-green-600">{totalCorrect}</div>
                <div className="text-gray-400 mt-1">正确</div>
              </div>
              <div className="animate-fade-in-up stagger-2">
                <div className="text-3xl font-bold text-red-500">{total - totalCorrect}</div>
                <div className="text-gray-400 mt-1">错误</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={startQuiz} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5">
            再来一组
          </button>
          <button onClick={() => setView('menu')} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-300">
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
      <div className="flex items-center gap-3 animate-fade-in-up">
        <button onClick={onBack} className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors">&larr; 返回</button>
        <h2 className="text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">错题本 ({wrongs.length})</h2>
      </div>
      {wrongs.length === 0 ? (
        <div className="text-center py-20 text-gray-400 animate-fade-in-up stagger-2">
          <p className="text-5xl mb-4 animate-float">🎉</p>
          <p>没有错题，继续保持！</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {wrongs.map((w, idx) => (
            <div key={w.wordId} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)} bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-4 flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <div>
                <span className="font-medium text-gray-800">{w.word}</span>
                <span className="text-sm text-gray-500 ml-3">{w.meaning}</span>
              </div>
              <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-full font-medium">错 {w.wrongCount} 次</span>
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
      <div className="flex items-center gap-3 animate-fade-in-up">
        <button onClick={onBack} className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors">&larr; 返回</button>
        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">学习统计</h2>
      </div>
      {recent.length === 0 ? (
        <div className="text-center py-20 text-gray-400 animate-fade-in-up stagger-2">
          <p className="text-5xl mb-4 animate-float">📊</p>
          <p>还没有练习记录，去做一组练习吧</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {recent.map((r, idx) => {
            const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
            return (
              <div key={idx} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)} bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{r.date}</span>
                  <span className={`text-sm font-bold ${pct >= 60 ? 'text-green-600' : 'text-red-500'}`}>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${pct >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs mt-2 text-gray-400">
                  <span>正确 {r.correct}</span>
                  <span>错误 {r.wrong}</span>
                  <span>共 {r.total} 题</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
