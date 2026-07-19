import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };
  return (
    <div className={`inline-block ${sizeMap[size]} border-slate-300 border-t-blue-600 rounded-full animate-spin ${className}`}></div>
  );
}
