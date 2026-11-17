import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { notify } from '../utils/toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your email and password');
      notify.error('Please enter both your email address and password.', 'Sign In');
      return;
    }

    try {
      await login(email, password);
      notify.success('Signed in successfully! Opening your whiteboards.', 'Welcome Back');
      navigate(from, { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message[0]
          : 'Invalid email or password');
      setError(message);
      notify.error(message, 'Sign In Failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors">
      {/* Top right Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1B4332] to-[#40916C] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <span className="font-heading font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
            AI Whiteboard
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-heading">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Or{' '}
          <Link to="/register" className="font-medium text-[#2D6A4F] dark:text-emerald-400 hover:underline">
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-xl shadow-gray-200/50 dark:shadow-black/40 rounded-3xl border border-gray-100 dark:border-gray-800 sm:px-10 transition-colors">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#2D6A4F] dark:text-emerald-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Demo Credentials:{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">demo@example.com</span> /{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">password123</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('demo@example.com');
                setPassword('password123');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1B4332] dark:text-emerald-300 bg-[#E8F5E9] dark:bg-emerald-950/60 hover:bg-[#C8E6C9] dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-emerald-400" />
              Auto-fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
