import React, { useState } from 'react';
import { User, Lock, Save, ArrowLeft, Sun, Moon, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Avatar } from '../components/common/Avatar';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';
import { notify } from '../utils/toast';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: any = {};
      if (name.trim() !== user?.name) payload.name = name.trim();
      if (avatarUrl.trim() !== (user?.avatarUrl || '')) payload.avatarUrl = avatarUrl.trim();

      if (newPassword) {
        if (!currentPassword) {
          notify.error('Current password is required to change password', 'Security');
          setIsLoading(false);
          return;
        }
        if (newPassword.length < 8) {
          notify.error('New password must be at least 8 characters', 'Validation');
          setIsLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          notify.error('New passwords do not match', 'Validation');
          setIsLoading(false);
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      if (Object.keys(payload).length === 0) {
        notify.info('No changes detected to update.', 'Settings');
        setIsLoading(false);
        return;
      }

      const { data } = await api.patch('/users/me', payload);
      updateUser(data);
      notify.success('Profile preferences successfully updated!', 'Saved');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to update profile', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F19] text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] dark:text-emerald-400 hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Whiteboards
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white font-heading">
              Account Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your display identity, theme preferences, and security credentials
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 transition-colors">
          {/* Avatar preview */}
          <div className="flex items-center gap-5 pb-8 border-b border-gray-100 dark:border-gray-800">
            <Avatar name={name || 'User'} avatarUrl={avatarUrl} size="lg" />
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          {/* Theme Preference Selection */}
          <div className="py-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" />
              Appearance & Theme
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Select your interface color theme for whiteboard canvas, dashboard, and toolbars.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  notify.info('Switched to Light Mode', 'Theme Changed');
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#2D6A4F] bg-[#E8F5E9] text-[#1B4332] shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-amber-500 shadow-xs">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Light Theme</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Crisp daytime palette</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  notify.info('Switched to Dark Mode', 'Theme Changed');
                }}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-gray-800 text-emerald-400 shadow-xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Dark Theme</p>
                  <p className="text-[10px] text-gray-400">Night & focus palette</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
                <Input
                  label="Email (Read-only)"
                  value={user?.email || ''}
                  disabled
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Avatar Image URL (Optional)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" />
                Change Password
              </h3>
              <div className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="New Password (min 8 chars)"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <Button
                type="submit"
                size="md"
                isLoading={isLoading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
