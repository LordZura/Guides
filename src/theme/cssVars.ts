/**
 * CSS Variables synchronization utility
 * 
 * This module exports theme colors as CSS custom properties so non-Chakra
 * code (charts, raw CSS, third-party embeds) can use the same tokens.
 */

import { useColorMode } from '@chakra-ui/react';
import { useEffect } from 'react';

// Token values matching theme/index.ts
const DARK_PRIMARY = '#0b0b0b';
const DARK_SECONDARY = '#2195eb';
const DARK_HIGHLIGHT = '#ffffff';

const LIGHT_PRIMARY = '#ffffff';
const LIGHT_SECONDARY = '#2195eb';
const LIGHT_HIGHLIGHT = '#1a202c';

/**
 * Hook to sync Chakra color mode with CSS variables
 * Use this in your root App component
 */
export const useCSSVariables = () => {
  const { colorMode } = useColorMode();

  useEffect(() => {
    const root = document.documentElement;
    
    if (colorMode === 'dark') {
      root.style.setProperty('--color-primary', DARK_PRIMARY);
      root.style.setProperty('--color-secondary', DARK_SECONDARY);
      root.style.setProperty('--color-highlight', DARK_HIGHLIGHT);
      
      // Semantic tokens for convenience
      root.style.setProperty('--color-bg-primary', DARK_PRIMARY);
      root.style.setProperty('--color-bg-secondary', '#1a1a1a');
      root.style.setProperty('--color-bg-tertiary', '#2a2a2a');
      root.style.setProperty('--color-text-primary', DARK_HIGHLIGHT);
      root.style.setProperty('--color-text-secondary', '#a0aec0');
      root.style.setProperty('--color-text-muted', '#718096');
      root.style.setProperty('--color-border-primary', '#2d3748');
      root.style.setProperty('--color-border-secondary', '#4a5568');
    } else {
      root.style.setProperty('--color-primary', LIGHT_PRIMARY);
      root.style.setProperty('--color-secondary', LIGHT_SECONDARY);
      root.style.setProperty('--color-highlight', LIGHT_HIGHLIGHT);
      
      // Semantic tokens for light mode
      root.style.setProperty('--color-bg-primary', LIGHT_PRIMARY);
      root.style.setProperty('--color-bg-secondary', '#f7fafc');
      root.style.setProperty('--color-bg-tertiary', '#edf2f7');
      root.style.setProperty('--color-text-primary', LIGHT_HIGHLIGHT);
      root.style.setProperty('--color-text-secondary', '#718096');
      root.style.setProperty('--color-text-muted', '#a0aec0');
      root.style.setProperty('--color-border-primary', '#e2e8f0');
      root.style.setProperty('--color-border-secondary', '#cbd5e0');
    }
    
    // Add color mode class to root for CSS selectors
    root.setAttribute('data-theme', colorMode);
  }, [colorMode]);
};

/**
 * Utility to get current theme colors programmatically
 * Useful for chart libraries, canvas, or any JS that needs color values
 */
export const getThemeColors = (colorMode: 'light' | 'dark') => {
  return {
    primary: colorMode === 'dark' ? DARK_PRIMARY : LIGHT_PRIMARY,
    secondary: colorMode === 'dark' ? DARK_SECONDARY : LIGHT_SECONDARY,
    highlight: colorMode === 'dark' ? DARK_HIGHLIGHT : LIGHT_HIGHLIGHT,
    // Semantic colors
    bg: {
      primary: colorMode === 'dark' ? DARK_PRIMARY : LIGHT_PRIMARY,
      secondary: colorMode === 'dark' ? '#1a1a1a' : '#f7fafc',
      tertiary: colorMode === 'dark' ? '#2a2a2a' : '#edf2f7',
    },
    text: {
      primary: colorMode === 'dark' ? DARK_HIGHLIGHT : LIGHT_HIGHLIGHT,
      secondary: colorMode === 'dark' ? '#a0aec0' : '#718096',
      muted: colorMode === 'dark' ? '#718096' : '#a0aec0',
    },
    border: {
      primary: colorMode === 'dark' ? '#2d3748' : '#e2e8f0',
      secondary: colorMode === 'dark' ? '#4a5568' : '#cbd5e0',
    },
  };
};

/**
 * Get CSS variables as an object for inline styles
 */
export const getCSSVars = () => {
  return {
    '--color-primary': 'var(--color-primary)',
    '--color-secondary': 'var(--color-secondary)',
    '--color-highlight': 'var(--color-highlight)',
  };
};
