// src/themes/corporate/tita.ts
import type { Theme } from '../base/types';

export const titaCorporateTheme: Theme = {
  name: 'tita-corporate',
  colors: {
    // Rojo corporativo TITA (color principal del logo)
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626', // Color principal del logo
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Negro/Gris para texto y elementos secundarios
    secondary: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937', // Negro del logo
      900: '#111827',
    },
    // Dorado/Amarillo de la corona (color de acento)
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Dorado de la corona
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Grises neutros
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },
    // Verde para éxito (mantener estándar)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Amarillo para advertencias
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Rojo para errores (usar el mismo rojo corporativo pero más intenso)
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(220 38 38 / 0.05)', // Sombra con tinte rojo
    md: '0 4px 6px -1px rgb(220 38 38 / 0.1), 0 2px 4px -2px rgb(220 38 38 / 0.05)',
    lg: '0 10px 15px -3px rgb(220 38 38 / 0.1), 0 4px 6px -4px rgb(220 38 38 / 0.05)',
    xl: '0 20px 25px -5px rgb(220 38 38 / 0.1), 0 8px 10px -6px rgb(220 38 38 / 0.05)',
  },
};