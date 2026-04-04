import { type ClassValue, clsx } from 'clsx'

/**
 * Merge Tailwind classes with clsx
 * Install: npm install clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
