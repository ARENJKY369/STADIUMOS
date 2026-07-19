/**
 * Design System - FIFA World Cup 2026 Stadium Operations
 * Complete design tokens for consistent UI/UX
 * Tailwind extension + custom utilities
 */

export const colors = {
  primary: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  neutral: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
  semantic: {
    success: { light: '#d1fae5', main: '#10b981', dark: '#059669' },
    warning: { light: '#fef3c7', main: '#f59e0b', dark: '#d97706' },
    error: { light: '#fee2e2', main: '#ef4444', dark: '#dc2626' },
    info: { light: '#dbeafe', main: '#3b82f6', dark: '#2563eb' },
  },
  stadium: {
    grass: '#16a34a', sky: '#0ea5e9', clay: '#a16207', concrete: '#71717a',
  },
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
    xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem',
  },
  fontWeight: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 },
  lineHeight: { tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625 },
};

export const spacing = {
  scale: { 0: '0', 1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem', 5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem', 12: '3rem', 16: '4rem', 20: '5rem' },
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  stadium: '0 20px 25px -5px rgba(37,99,235,0.15), 0 8px 10px -6px rgba(37,99,235,0.1)',
};

export const animations = {
  duration: { fast: '150ms', normal: '250ms', slow: '350ms' },
  easing: { easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', easeOut: 'cubic-bezier(0, 0, 0.2, 1)' },
  keyframes: {
    pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(59,130,246,0)' } },
    slideIn: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
  },
};

export const breakpoints = {
  sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
};

export const accessibility = {
  contrastRatios: { normal: 4.5, largeText: 3, graphical: 3 },
  focusRing: '0 0 0 2px #fff, 0 0 0 4px #2563eb',
  minTouchTarget: '44px',
};

export default { colors, typography, spacing, shadows, animations, breakpoints, accessibility };
