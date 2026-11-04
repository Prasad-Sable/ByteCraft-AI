'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;
  if (['/login', '/register', '/onboarding', '/'].includes(pathname) && !user?.has_onboarded) {
    if (['/login', '/register', '/onboarding'].includes(pathname)) return null;
  }

  const navItems = [
    { to: '/home', label: 'Play', icon: '🎮' },
    { to: '/dashboard', label: 'Stats', icon: '🏆' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-200 shadow-[0_4px_0_0_rgba(226,232,240,1)] px-4 mb-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-20">
        <Link href="/home" className="flex items-center gap-3 no-underline group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl text-white shadow-[0_4px_0_0_#2563eb] group-hover:translate-y-1 group-hover:shadow-[0_0px_0_0_#2563eb] transition-all">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-2xl hidden sm:block tracking-tight">
              ByteCraft <span className="text-blue-600">AI</span>
            </span>
          </div>
        </Link>

        {/* Center Nav tabs */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center px-4 md:px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
                  isActive
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <span className="text-xl md:mr-2">{item.icon}</span>
                <span className="hidden md:inline text-lg">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1 font-bold text-orange-500 text-lg group cursor-help" title="Streak">
                <span className="text-2xl pt-1">🔥</span> {user.streak || 0}
              </div>
              <div className="flex items-center gap-1 font-bold text-blue-500 text-lg group cursor-help" title="XP Points">
                <span className="text-xl">🌟</span> {user.xp || 0}
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center justify-center p-3 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold"
            title="Log out"
          >
            <span className="text-xl">🚪</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

