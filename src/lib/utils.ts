/**
 * Collection of general utility functions used throughout the application
 */

/**
 * Returns a greeting based on the current time of day
 * @returns A greeting string like "Good morning", "Good afternoon", etc.
 */
export function formatGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 5) {
    return "Good night";
  } else if (hour < 12) {
    return "Good morning";
  } else if (hour < 17) {
    return "Good afternoon";
  } else if (hour < 22) {
    return "Good evening";
  } else {
    return "Good night";
  }
}

/**
 * Truncates a string if it exceeds the specified length
 * @param str The string to truncate
 * @param maxLength Maximum allowed length
 * @param suffix The suffix to add to truncated strings (default: "...")
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number, suffix: string = "..."): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Generates a random ID string
 * @param length The length of the ID (default: 8)
 * @returns A random alphanumeric ID string
 */
export function generateId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Debounces a function call
 * @param func The function to debounce
 * @param wait The debounce delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formats a number with commas as thousands separators
 * @param num The number to format
 * @returns A formatted number string
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Capitalizes the first letter of each word in a string
 * @param str The string to transform
 * @returns The transformed string
 */
export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
} 