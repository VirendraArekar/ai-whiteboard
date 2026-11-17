import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { useThemeStore, applyTheme } from './store/themeStore';

const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const WhiteboardPage = React.lazy(() =>
  import('./pages/WhiteboardPage').then((m) => ({ default: m.WhiteboardPage })),
);

export default function App() {
  const { checkAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    applyTheme(theme);
  }, [checkAuth, theme]);

  return (
    <BrowserRouter>
      {/* Toast Notification Container in Top-Right with custom branding & dark/light theme */}
      <Toaster
        position="top-right"
        containerClassName="top-4 right-4 z-50"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#111827' : '#ffffff',
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            border: theme === 'dark' ? '1px solid #1f2937' : '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            fontSize: '13px',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#2D6A4F',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <React.Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0B0F19]">
            <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/whiteboard/:boardId" element={<WhiteboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
