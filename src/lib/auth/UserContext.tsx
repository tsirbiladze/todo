"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Define the user context type
type UserContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  error: string | null;
};

// Create context with default values
const UserContext = createContext<UserContextType>({
  isAuthenticated: false,
  isLoading: true,
  userInfo: null,
  error: null,
});

// Provider props type
type UserProviderProps = {
  children: ReactNode;
};

// UserProvider component
export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  
  // Derive context values from session
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  
  // Create user info object from session data
  const userInfo = session?.user 
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;
  
  // Reset error when authentication status changes
  useEffect(() => {
    if (status !== 'loading') {
      setError(null);
    }
  }, [status]);
  
  const contextValue: UserContextType = {
    isAuthenticated,
    isLoading,
    userInfo,
    error,
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for using the user context
export function useUser() {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
}

// HOC for protecting routes that require authentication
export function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useUser();
    
    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>;
    }
    
    if (!isAuthenticated) {
      // You could redirect here with next/navigation or show a login prompt
      return <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
            Please sign in to access this content.
          </p>
          <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            Sign In
          </button>
        </div>
      </div>;
    }
    
    // User is authenticated, render the protected component
    return <Component {...props} />;
  };
} 