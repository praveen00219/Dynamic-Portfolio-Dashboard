'use client';
import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
      <p className="text-gray-400 text-sm">Fetching live portfolio data…</p>
    </div>
  );
}