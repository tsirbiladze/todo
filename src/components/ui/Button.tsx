import React, { memo, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// Define button variants using class-variance-authority for type-safe class composition
const buttonVariants = cva(
  // Base styles shared by all variants
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      // Different button variants (primary, secondary, etc.)
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 border border-gray-300",
        danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus-visible:ring-gray-500",
        link: "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 p-0 h-auto",
      },
      // Different button sizes
      size: {
        sm: "text-xs px-2.5 py-1.5 rounded",
        md: "text-sm px-3 py-2 rounded-md",
        lg: "text-base px-4 py-2 rounded-md",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Reusable button component with consistent styling and accessibility features
 * Supports different variants, sizes, icons, and loading state
 */
function ButtonComponent({
  className,
  variant,
  size,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const Button = memo(ButtonComponent); 