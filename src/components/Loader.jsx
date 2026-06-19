import React from 'react';

export const Loader = ({ size = 'md', label }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
        style={{
          boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
        }}
      />
      {label && <p className="text-sm font-medium text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
};

export const PageLoader = ({ label = 'Loading analytics pipeline...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <Loader size="lg" label={label} />
    </div>
  );
};
