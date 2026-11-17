import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetTokenPreview, setResetTokenPreview] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      if (data.resetToken) {
        setResetTokenPreview(data.resetToken);
      }
      toast.success('Password reset instructions generated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error requesting reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1B4332] to-[#40916C] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <span className="font-heading font-bold text-2xl text-gray-900 tracking-tight">
            AI Whiteboard
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">
          Reset your password
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your registered email and we will generate reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-10">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-[#2D6A4F] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Reset instructions issued</h3>
              <p className="text-xs text-gray-600">
                If <span className="font-semibold text-gray-800">{email}</span> is registered, your
                token is ready.
              </p>

              {resetTokenPreview && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-left">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Dev Token Preview:
                  </p>
                  <code className="text-xs text-[#2D6A4F] break-all select-all font-mono">
                    {resetTokenPreview}
                  </code>
                </div>
              )}

              <Button
                onClick={() =>
                  navigate(`/reset-password${resetTokenPreview ? `?token=${resetTokenPreview}` : ''}`)
                }
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Reset Password
              </Button>
            </div>
          ) : (
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

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
