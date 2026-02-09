import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getStreak, updateStreak } from '../utils/storage.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalWordsLearned: 0, todayWordsLearned: 0, streak: 0, todayAccuracy: null });

  useEffect(() => {
    updateStreak();
    setStats(getStats());
  }, []);

  const streak = getStreak();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
        <p className="text-gray-500 mt-1">继续你的雅思学习之旅</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="累计学习单词" value={stats.totalWordsLearned} color="indigo" />
        <StatCard label="今日已学" value={stats.todayWordsLearned} color="green" />
        <StatCard label="连续打卡" value={`${streak.current} 天`} color="orange" />
        <StatCard
          label="今日正确率"
          value={stats.todayAccuracy !== null ? `${stats.todayAccuracy}%` : '--'}
          color="blue"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          to="/vocabulary"
          title="继续背单词"
          desc="基于雅思核心词汇，系统化记忆"
          icon="📝"
          color="indigo"
        />
        <QuickAction
          to="/practice"
          title="开始练习"
          desc="根据学习记录生成每日练习题"
          icon="✏️"
          color="green"
        />
        <QuickAction
          to="/articles"
          title="阅读文章"
          desc="导入英文文章，跟读、翻译、收藏"
          icon="📖"
          color="blue"
        />
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">学习小贴士</h3>
        <p className="text-indigo-100 text-sm leading-relaxed">
          每天坚持学习 20 个新单词，配合文章阅读和每日练习，
          能有效提升你的雅思词汇量。点击任意文章中的单词即可收藏到生词本，
          错题会自动加入下次练习中。加油！
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-75">{label}</div>
    </div>
  );
}

function QuickAction({ to, title, desc, icon, color }) {
  const borderColors = {
    indigo: 'hover:border-indigo-300',
    green: 'hover:border-green-300',
    blue: 'hover:border-blue-300',
  };
  return (
    <Link
      to={to}
      className={`block bg-white rounded-xl border border-gray-200 p-5 transition-all hover:shadow-md ${borderColors[color]}`}
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-semibold text-gray-800 mt-3">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}
