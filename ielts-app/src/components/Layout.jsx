import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/articles', label: '文章阅读', icon: '📖' },
  { to: '/vocabulary', label: '背单词', icon: '📝' },
  { to: '/practice', label: '每日练习', icon: '✏️' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col">
      {/* Animated header with gradient border */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-100/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent gradient-animated bg-[length:200%_200%]">
            IELTS Learning
          </h1>
          <nav className="hidden md:flex gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm shadow-indigo-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }`
                }
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {/* Animated gradient line at bottom of header */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-30 gradient-animated bg-[length:200%_200%]" />
      </header>

      {/* Main content with page transition */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav with glass effect */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-indigo-100/50 flex z-50">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-all duration-300 ${
                isActive
                  ? 'text-indigo-600 scale-105'
                  : 'text-gray-500'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="md:hidden h-16" />
    </div>
  );
}
