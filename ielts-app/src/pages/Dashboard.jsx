import { useEffect, useState, useRef } from 'react';
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
      {/* Hero section with particles */}
      <div className="animate-fade-in-up particles-bg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-indigo-800 to-gray-800 bg-clip-text text-transparent">
          Welcome Back!
        </h2>
        <p className="text-gray-500 mt-1">继续你的雅思学习之旅</p>
      </div>

      {/* Stats cards with staggered animation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="累计学习单词" value={stats.totalWordsLearned} color="indigo" delay={0} />
        <StatCard label="今日已学" value={stats.todayWordsLearned} color="green" delay={1} />
        <StatCard label="连续打卡" value={`${streak.current} 天`} color="orange" delay={2} />
        <StatCard
          label="今日正确率"
          value={stats.todayAccuracy !== null ? `${stats.todayAccuracy}%` : '--'}
          color="blue"
          delay={3}
        />
      </div>

      {/* Quick actions with hover effects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          to="/vocabulary"
          title="继续背单词"
          desc="基于雅思核心词汇，系统化记忆"
          icon="📝"
          gradient="from-indigo-500 to-purple-500"
          delay={4}
        />
        <QuickAction
          to="/practice"
          title="开始练习"
          desc="根据学习记录生成每日练习题"
          icon="✏️"
          gradient="from-green-500 to-emerald-500"
          delay={5}
        />
        <QuickAction
          to="/articles"
          title="阅读文章"
          desc="导入英文文章，跟读、翻译、收藏"
          icon="📖"
          gradient="from-blue-500 to-cyan-500"
          delay={6}
        />
      </div>

      {/* Tips card with animated gradient */}
      <div className="animate-fade-in-up stagger-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 gradient-animated bg-[length:200%_200%] rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Floating decorative circles */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-float" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
        <h3 className="text-lg font-semibold mb-2 relative z-10">学习小贴士</h3>
        <p className="text-indigo-100 text-sm leading-relaxed relative z-10">
          每天坚持学习 20 个新单词，配合文章阅读和每日练习，
          能有效提升你的雅思词汇量。点击任意文章中的单词即可收藏到生词本，
          错题会自动加入下次练习中。加油！
        </p>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0;
    if (num === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * num));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display}</span>;
}

function StatCard({ label, value, color, delay }) {
  const colors = {
    indigo: 'from-indigo-50 to-indigo-100/50 text-indigo-700 border-indigo-200/50',
    green: 'from-green-50 to-emerald-100/50 text-green-700 border-green-200/50',
    orange: 'from-orange-50 to-amber-100/50 text-orange-700 border-orange-200/50',
    blue: 'from-blue-50 to-cyan-100/50 text-blue-700 border-blue-200/50',
  };
  const glowColors = {
    indigo: 'hover:shadow-indigo-200/50',
    green: 'hover:shadow-green-200/50',
    orange: 'hover:shadow-orange-200/50',
    blue: 'hover:shadow-blue-200/50',
  };

  const isNumber = typeof value === 'number';

  return (
    <div className={`animate-fade-in-up stagger-${delay + 1} rounded-xl p-4 bg-gradient-to-br ${colors[color]} border transition-all duration-300 hover:shadow-lg ${glowColors[color]} hover:-translate-y-1`}>
      <div className="text-2xl font-bold">
        {isNumber ? <AnimatedNumber value={value} /> : value}
      </div>
      <div className="text-sm mt-1 opacity-75">{label}</div>
    </div>
  );
}

function QuickAction({ to, title, desc, icon, gradient, delay }) {
  return (
    <Link
      to={to}
      className={`animate-fade-in-up stagger-${delay + 1} group block bg-white rounded-xl border border-gray-200/80 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 tilt-card relative overflow-hidden`}
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <span className="text-3xl block transition-transform duration-300 group-hover:scale-110 group-hover:animate-float relative z-10">{icon}</span>
      <h3 className="font-semibold text-gray-800 mt-3 relative z-10">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 relative z-10">{desc}</p>
      {/* Arrow indicator */}
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
        →
      </span>
    </Link>
  );
}
