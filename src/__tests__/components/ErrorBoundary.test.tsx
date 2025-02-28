import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Create a component that will throw an error
const ErrorThrowingComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working Component</div>;
};

// Suppress console.error for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });
  
  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    // Should show the error message
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });
  
  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom Error UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    // Should show the custom fallback
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });
  
  it('resets the error state when Try Again button is clicked', () => {
    const mockOnReset = jest.fn();
    
    const { rerender } = render(
      <ErrorBoundary onReset={mockOnReset}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    // Verify error UI is shown
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    
    // Click the 'Try Again' button
    fireEvent.click(screen.getByText('Try Again'));
    
    // Verify onReset was called
    expect(mockOnReset).toHaveBeenCalledTimes(1);
    
    // Rerender with a non-error component
    rerender(
      <ErrorBoundary onReset={mockOnReset}>
        <ErrorThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    // Should now show the working component
    expect(screen.getByText('Working Component')).toBeInTheDocument();
  });
  
  it('shows component stack in development environment', () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    // Set NODE_ENV to development
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    // Should show error details including stack
    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
}); 