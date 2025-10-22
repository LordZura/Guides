/**
 * Theme configuration with three-token dark mode system
 * 
 * Tokens:
 * - primary: Dark/blackish (main backgrounds, surfaces)
 * - secondary: Blue (accent color for interactive elements)
 * - highlight: White (primary text, icons, emphasis)
 */

import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Near-black for better eye comfort than pure black
const DARK_PRIMARY = '#0b0b0b';
const DARK_SECONDARY = '#2195eb'; // Existing brand blue
const DARK_HIGHLIGHT = '#ffffff';

// Light mode colors (keeping existing behavior)
const LIGHT_PRIMARY = '#ffffff';
const LIGHT_SECONDARY = '#2195eb';
const LIGHT_HIGHLIGHT = '#1a202c';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    // Dark mode tokens - these are the three global tokens
    primary: {
      50: '#f5f5f5',    // very light (for light mode)
      100: '#e6e6e6',
      200: '#cccccc',
      300: '#999999',
      400: '#666666',
      500: DARK_PRIMARY,  // main dark token
      600: '#090909',
      700: '#070707',
      800: '#050505',
      900: '#030303',
    },
    secondary: {
      50: '#e6f6ff',
      100: '#bae3ff',
      200: '#8dcfff',
      300: '#5fbcff',
      400: '#38a9ff',
      500: DARK_SECONDARY, // main blue accent
      600: '#1677c7',
      700: '#0d5aa4',
      800: '#043c80',
      900: '#01254d',
    },
    highlight: {
      50: DARK_HIGHLIGHT,  // pure white for dark mode
      100: '#f7fafc',
      200: '#edf2f7',
      300: '#e2e8f0',
      400: '#cbd5e0',
      500: '#a0aec0',
      600: '#718096',
      700: '#4a5568',
      800: '#2d3748',
      900: LIGHT_HIGHLIGHT, // dark text for light mode
    },
  },
  semanticTokens: {
    colors: {
      // Background tokens
      'bg.primary': {
        default: LIGHT_PRIMARY,
        _dark: DARK_PRIMARY,
      },
      'bg.secondary': {
        default: '#f7fafc',
        _dark: '#1a1a1a',
      },
      'bg.tertiary': {
        default: '#edf2f7',
        _dark: '#2a2a2a',
      },
      // Text tokens
      'text.primary': {
        default: LIGHT_HIGHLIGHT,
        _dark: DARK_HIGHLIGHT,
      },
      'text.secondary': {
        default: '#718096',
        _dark: '#a0aec0',
      },
      'text.muted': {
        default: '#a0aec0',
        _dark: '#718096',
      },
      // Border tokens
      'border.primary': {
        default: '#e2e8f0',
        _dark: '#2d3748',
      },
      'border.secondary': {
        default: '#cbd5e0',
        _dark: '#4a5568',
      },
      // Accent/Interactive
      'accent.primary': {
        default: LIGHT_SECONDARY,
        _dark: DARK_SECONDARY,
      },
      'accent.hover': {
        default: '#1677c7',
        _dark: '#38a9ff',
      },
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? DARK_PRIMARY : LIGHT_PRIMARY,
        color: props.colorMode === 'dark' ? DARK_HIGHLIGHT : LIGHT_HIGHLIGHT,
      },
      // Remove harsh focus outlines - we'll add soft ones in components
      '*:focus': {
        outline: 'none',
        boxShadow: 'none',
      },
    }),
  },
  // Enhanced breakpoints for better mobile experience
  breakpoints: {
    base: '0px',
    sm: '480px',
    md: '768px',
    lg: '992px',
    xl: '1280px',
    '2xl': '1536px',
  },
  // Mobile-first font sizes
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  // Better mobile spacing
  space: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },
  // Component overrides with theme tokens
  components: {
    Button: {
      baseStyle: (props: any) => ({
        borderRadius: 'lg',
        fontWeight: 'semibold',
        _focus: {
          boxShadow: props.colorMode === 'dark' 
            ? '0 0 0 3px rgba(33, 149, 235, 0.15)' 
            : '0 0 0 3px rgba(33, 149, 235, 0.12)',
        },
      }),
      sizes: {
        lg: {
          h: '48px',
          fontSize: 'md',
          px: 8,
        },
        md: {
          h: '44px',
          fontSize: 'sm',
          px: 6,
        },
        sm: {
          h: '40px',
          fontSize: 'sm',
          px: 4,
        },
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'secondary' ? 'secondary.500' : undefined,
          color: props.colorMode === 'dark' ? 'highlight.50' : 'white',
          _hover: {
            bg: props.colorScheme === 'secondary' ? 'secondary.600' : undefined,
          },
        }),
      },
    },
    Input: {
      baseStyle: (props: any) => ({
        field: {
          bg: props.colorMode === 'dark' ? 'primary.500' : 'white',
          color: props.colorMode === 'dark' ? 'highlight.50' : 'gray.800',
          borderColor: props.colorMode === 'dark' ? 'border.primary' : 'gray.200',
          _focus: {
            borderColor: 'secondary.500',
            boxShadow: props.colorMode === 'dark'
              ? '0 0 0 3px rgba(33, 149, 235, 0.15)'
              : '0 0 0 3px rgba(33, 149, 235, 0.12)',
          },
          _hover: {
            borderColor: props.colorMode === 'dark' ? 'border.secondary' : 'gray.300',
          },
        },
      }),
      sizes: {
        lg: {
          field: {
            h: '48px',
            fontSize: 'md',
          },
        },
        md: {
          field: {
            h: '44px',
            fontSize: 'sm',
          },
        },
      },
    },
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          mx: { base: 0, md: 4 },
          my: { base: 0, md: 4 },
          borderRadius: { base: 0, md: 'xl' },
          bg: props.colorMode === 'dark' ? 'primary.600' : 'white',
          color: props.colorMode === 'dark' ? 'highlight.50' : 'gray.800',
        },
        header: {
          color: props.colorMode === 'dark' ? 'highlight.50' : 'gray.800',
        },
        body: {
          color: props.colorMode === 'dark' ? 'highlight.100' : 'gray.700',
        },
      }),
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'primary.600' : 'white',
          color: props.colorMode === 'dark' ? 'highlight.50' : 'gray.800',
        },
      }),
    },
    Badge: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? 'highlight.50' : undefined,
      }),
    },
    Tooltip: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'primary.700' : 'gray.700',
        color: props.colorMode === 'dark' ? 'highlight.50' : 'white',
      }),
    },
  },
});

export default theme;
