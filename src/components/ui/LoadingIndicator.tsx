import React from 'react';

type LoadingIndicatorSize = 'xs' | 'sm' | 'md' | 'lg';
type LoadingIndicatorVariant = 'spinner' | 'dots' | 'bar';
type LoadingIndicatorType = 'inline' | 'overlay' | 'skeleton';

interface LoadingIndicatorProps {
  size?: LoadingIndicatorSize;
  variant?: LoadingIndicatorVariant;
  type?: LoadingIndicatorType;
  text?: string;
  className?: string;
  fullPage?: boolean;
  transparent?: boolean;
}

export function LoadingIndicator({
  size = 'md',
  variant = 'spinner',
  type = 'inline',
  text = 'Loading...',
  className = '',
  fullPage = false,
  transparent = false,
}: LoadingIndicatorProps) {
  
  // Size maps to pixel dimensions
  const sizeMap = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Get the appropriate size class
  const sizeClass = sizeMap[size];
  
  // Render a spinner
  const renderSpinner = () => (
    <div className={`${sizeClass} ${className} rounded-full border-b-2 border-blue-600 dark:border-blue-400 animate-spin`}></div>
  );
  
  // Render dots
  const renderDots = () => (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce ${size === 'xs' ? 'h-1 w-1' : size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'}`} style={{ animationDelay: '0ms' }}></div>
      <div className={`bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce ${size === 'xs' ? 'h-1 w-1' : size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'}`} style={{ animationDelay: '150ms' }}></div>
      <div className={`bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce ${size === 'xs' ? 'h-1 w-1' : size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'}`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
  
  // Render loading bar
  const renderBar = () => (
    <div className={`w-full h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-full ${className}`}>
      <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-progress"></div>
    </div>
  );
  
  // Render the appropriate loading indicator variant
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return renderSpinner();
      case 'dots':
        return renderDots();
      case 'bar':
        return renderBar();
      default:
        return renderSpinner();
    }
  };
  
  // Inline loading indicator (default)
  if (type === 'inline') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {renderLoadingIndicator()}
        {text && <p className="ml-2 text-gray-600 dark:text-gray-400">{text}</p>}
      </div>
    );
  }
  
  // Full page overlay
  if (type === 'overlay' || fullPage) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 ${transparent ? 'bg-white/50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'}`}>
        <div className="text-center">
          {renderLoadingIndicator()}
          {text && <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">{text}</p>}
        </div>
      </div>
    );
  }
  
  // Skeleton loading
  if (type === 'skeleton') {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2.5"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2.5"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2.5"></div>
      </div>
    );
  }
  
  return null;
}

// Add animation keyframes to global styles
// Add this to your global CSS:
/*
@keyframes progress {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  50% {
    width: 30%;
    margin-left: 70%;
  }
  100% {
    width: 0%;
    margin-left: 100%;
  }
}

.animate-progress {
  animation: progress 1.5s ease-in-out infinite;
}
*/ 