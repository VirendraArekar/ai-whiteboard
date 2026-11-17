import React from 'react';
import toast, { Toast } from 'react-hot-toast';
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  t: Toast;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'ai';
}

export const BrandedToast: React.FC<ToastProps> = ({ t, title, message, type = 'info' }) => {
  const getTypeBadge = () => {
    switch (type) {
      case 'success':
        return (
          <span className="p-1 rounded-full bg-emerald-100 text-[#2D6A4F] dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        );
      case 'error':
        return (
          <span className="p-1 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
        );
      case 'ai':
        return (
          <span className="p-1 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        );
      default:
        return (
          <span className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Info className="w-3.5 h-3.5" />
          </span>
        );
    }
  };

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-sm w-full bg-white dark:bg-gray-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 p-3.5 items-start gap-3 border border-gray-100 dark:border-gray-800 transition-all`}
    >
      {/* Brand Logo Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1B4332] to-[#40916C] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/20">
        <Sparkles className="w-4 h-4 text-emerald-200" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5">
          {getTypeBadge()}
          <p className="text-xs font-bold text-gray-900 dark:text-white tracking-tight font-heading">
            {title}
          </p>
        </div>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words">
          {message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const notify = {
  success: (message: string, title: string = 'Success') => {
    return toast.custom(
      (t) => <BrandedToast t={t} title={title} message={message} type="success" />,
      { duration: 4000 },
    );
  },
  error: (message: string, title: string = 'Notice') => {
    return toast.custom(
      (t) => <BrandedToast t={t} title={title} message={message} type="error" />,
      { duration: 5000 },
    );
  },
  ai: (message: string, title: string = 'AI Assistant') => {
    return toast.custom(
      (t) => <BrandedToast t={t} title={title} message={message} type="ai" />,
      { duration: 4500 },
    );
  },
  info: (message: string, title: string = 'AI Whiteboard') => {
    return toast.custom(
      (t) => <BrandedToast t={t} title={title} message={message} type="info" />,
      { duration: 4000 },
    );
  },
  dismiss: (id?: string) => toast.dismiss(id),
};
