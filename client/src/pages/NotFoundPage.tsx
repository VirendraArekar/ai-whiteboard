import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#2D6A4F] mb-6 shadow-sm">
        <Sparkles className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 font-heading">404 - Canvas Not Found</h1>
      <p className="mt-2 text-sm text-gray-600 max-w-md">
        The whiteboard page you are looking for does not exist or may have been moved.
      </p>
      <Link to="/" className="mt-6">
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Back to Home</Button>
      </Link>
    </div>
  );
};
