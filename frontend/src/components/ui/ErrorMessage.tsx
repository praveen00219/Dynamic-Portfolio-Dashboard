'use client';
import React from 'react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-red-950/50 border border-red-700 rounded-2xl p-8 max-w-md text-center shadow-xl">
        <div className="text-red-400 text-4xl mb-3">⚠</div>
        <h2 className="text-red-300 font-semibold text-lg mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-5">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}