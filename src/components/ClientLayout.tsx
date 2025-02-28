'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AuthProvider } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useStore(state => state.preferences.theme);
  const [mounted, setMounted] = useState(false);
  
  // Effect for theme initialization - runs once on mount
  useEffect(() => {
    // Set mounted to true when component mounts on client side
    setMounted(true);
    
    // Get initial theme from localStorage (if available) for immediate application
    // to prevent flash of incorrect theme
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const systemPrefersDark = typeof window !== 'undefined' ? 
      window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    
    // Apply theme immediately on first render
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Update theme when it changes in the store
  useEffect(() => {
    if (!mounted) return;
    
    const isDark = 
      theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Save current theme to localStorage for persistence
    localStorage.setItem('theme', theme);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  // For the content, we'll use a skeleton approach to prevent layout shift
  const renderContent = () => (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <AuthProvider>
        <div className="min-h-screen">
          <Header />
          <main className="pt-16">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333',
              },
              duration: 4000,
            }}
          />
        </div>
      </AuthProvider>
    </div>
  );

  // Use a simple approach that prevents content flashing
  // Even if not mounted yet, render with a proper wrapper
  return (
    <div className={`min-h-screen transition-colors duration-300 ${mounted ? '' : 'invisible'}`}>
      {renderContent()}
    </div>
  );
} 