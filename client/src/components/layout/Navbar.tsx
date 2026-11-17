import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutDashboard, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../common/Avatar';
import { ThemeToggle } from '../common/ThemeToggle';
import { notify } from '../../utils/toast';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    notify.success('You have been signed out successfully.', 'Signed Out');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1B4332] to-[#40916C] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg text-gray-900 dark:text-white tracking-tight leading-none">
              AI Whiteboard
            </span>
            <span className="text-[10px] text-[#2D6A4F] dark:text-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
              Infinite Canvas
            </span>
          </div>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle size="sm" />

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" />
                Dashboard
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none cursor-pointer"
                >
                  <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                  <span className="hidden md:inline-block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {user.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setIsMenuOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      My Whiteboards
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Profile Settings
                    </Link>

                    <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-[#2D6A4F] text-white hover:bg-[#1B4332] rounded-xl transition-all shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
