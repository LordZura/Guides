# Dark Mode Rework - Implementation Guide

## Overview

The TourGuideHub site now features a streamlined dark theme system built on exactly **three global tokens** that control all visible colors across the entire application.

## The Three Tokens

### 1. **Primary** (`--color-primary`)
- **Color**: `#0b0b0b` (near-black)
- **Usage**: Main backgrounds, surfaces, cards, modals
- **Chakra**: `colors.primary.*` (50-900 scale)

### 2. **Secondary** (`--color-secondary`)
- **Color**: `#2195eb` (brand blue)
- **Usage**: Accents, buttons, links, interactive elements, charts
- **Chakra**: `colors.secondary.*` (50-900 scale)

### 3. **Highlight** (`--color-highlight`)
- **Color**: `#ffffff` (white)
- **Usage**: Primary text, icons, emphasis, headings
- **Chakra**: `colors.highlight.*` (50-900 scale)

## How to Use

### In Chakra UI Components

```tsx
import { Box, Button, Text } from '@chakra-ui/react';

// Use semantic tokens (recommended)
<Box bg="surface" color="textPrimary" borderColor="borderColor">
  <Text color="textSecondary">Subtitle</Text>
  <Button colorScheme="secondary">Action</Button>
</Box>

// Or use color scales directly
<Box bg="primary.700" color="highlight.50">
  <Button colorScheme="secondary">Click me</Button>
</Box>
```

### In CSS/SCSS

```css
.custom-component {
  background-color: var(--color-primary);
  color: var(--color-highlight);
  border-color: var(--chakra-colors-whiteAlpha-200);
}

.accent-element {
  color: var(--color-secondary);
}
```

### In Charts (Chart.js, Recharts, etc.)

The CSS variables are available globally and update automatically:

```javascript
const chartConfig = {
  backgroundColor: getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary'),
  borderColor: getComputedStyle(document.documentElement)
    .getPropertyValue('--color-secondary'),
  color: getComputedStyle(document.documentElement)
    .getPropertyValue('--color-highlight'),
};
```

## Semantic Tokens

For convenience, semantic tokens are available:

- `surface` → Primary background color
- `surfaceHover` → Hover state for surfaces
- `textPrimary` → Main text color (highlight)
- `textSecondary` → Secondary text (muted highlight)
- `accentText` → Accent text (secondary color)
- `borderColor` → Standard border color

## Light/Dark Mode Toggle

### Access Settings

1. Click the **Settings** icon in the navbar
2. Toggle between Light/Dark mode
3. Changes apply instantly and persist in localStorage

### Programmatic Control

```typescript
import { useColorMode } from '@chakra-ui/react';

function MyComponent() {
  const { colorMode, toggleColorMode } = useColorMode();
  
  return (
    <Button onClick={toggleColorMode}>
      Switch to {colorMode === 'dark' ? 'light' : 'dark'} mode
    </Button>
  );
}
```

## Accessibility Features

- **WCAG AA Compliance**: All text meets 4.5:1 contrast ratio
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Soft Focus Rings**: No harsh browser defaults

## Reverting to Old Theme

Check out the commit before the dark mode rework or update `/src/theme/index.ts` with your preferred colors.

## File Structure

```
src/
├── theme/
│   ├── index.ts          # Main theme configuration
│   └── cssVars.ts        # CSS variable sync
├── components/
│   └── SettingsModal.tsx # Theme toggle UI
├── App.tsx               # Theme initialization
└── main.tsx              # ChakraProvider setup
```
