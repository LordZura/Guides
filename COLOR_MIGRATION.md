# Color Migration Guide

This document provides a mapping of old hard-coded colors to new theme tokens for the dark mode rework.

## Quick Reference Table

| Old Value | New Token (Chakra) | CSS Variable | Usage Context |
|-----------|-------------------|--------------|---------------|
| `#000000` | `primary.900` | `var(--color-primary)` | Dark backgrounds |
| `#0b0b0b` | `primary.900` | `var(--color-primary)` | Dark backgrounds (preferred) |
| `#ffffff` | `highlight.50` | `var(--color-highlight)` | White text, icons |
| `#2195eb` | `secondary.500` | `var(--color-secondary)` | Brand blue, accents |
| `#3182CE` | `secondary.500` | `var(--color-secondary)` | Legacy blue → new blue |
| `gray.700` | `primary.600` | - | Dark mode backgrounds |
| `gray.800` | `primary.700` | - | Darker surfaces |
| `gray.900` | `primary.800` | - | Darkest surfaces |
| `gray.100` | `whiteAlpha.100` | - | Light borders (dark mode) |
| `gray.200` | `whiteAlpha.200` | - | Borders |
| `gray.600` | `whiteAlpha.600` | - | Muted text |

## Semantic Token Mapping

Use these semantic tokens for common patterns:

| Semantic Token | Dark Mode Value | Light Mode Value | Usage |
|----------------|-----------------|------------------|-------|
| `surface` | `primary.700` | `white` | Card/modal backgrounds |
| `surfaceHover` | `primary.600` | `gray.50` | Hover state |
| `textPrimary` | `highlight.50` | `gray.800` | Main text |
| `textSecondary` | `whiteAlpha.800` | `gray.600` | Subtitles, captions |
| `accentText` | `secondary.400` | `secondary.600` | Links, emphasis |
| `borderColor` | `whiteAlpha.200` | `gray.200` | Borders, dividers |

## ColorScheme Migration

For Chakra UI components with `colorScheme` prop:

```tsx
// OLD
<Button colorScheme="primary">Click me</Button>

// NEW
<Button colorScheme="secondary">Click me</Button>
```

**Rule**: Replace `colorScheme="primary"` with `colorScheme="secondary"` for accent colors.

## Common Patterns

### Backgrounds

```tsx
// OLD
bg="gray.700"

// NEW (dark mode)
bg="primary.600"

// OR use semantic token
bg="surface"
```

### Text

```tsx
// OLD
color="white"

// NEW
color="highlight.50"

// OR use semantic token
color="textPrimary"
```

### Borders

```tsx
// OLD
borderColor="gray.200"

// NEW
borderColor="whiteAlpha.200"

// OR use semantic token
borderColor="borderColor"
```

### Icons

```tsx
// OLD
<Icon color="blue.500" />

// NEW
<Icon color="secondary.500" />

// OR for text-matching icons
<Icon color="currentColor" />
```

## SVG Updates

### Before
```tsx
<svg>
  <path fill="#3182CE" d="..." />
</svg>
```

### After
```tsx
<svg>
  <path fill="currentColor" d="..." />
</svg>

// And in the component
<Icon color="secondary.500">
  <svg>...</svg>
</Icon>
```

## Third-Party Components

For react-select, charts, and other third-party libraries:

```javascript
// Read CSS variables
const primary = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary').trim();

const secondary = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-secondary').trim();

const highlight = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-highlight').trim();

// Use in config
const config = {
  backgroundColor: primary,
  borderColor: secondary,
  textColor: highlight,
};
```

## Search & Replace Patterns

Use these patterns to find and replace hard-coded colors:

### Find hex colors
```bash
grep -r "#[0-9a-fA-F]\{6\}" src/ --include="*.tsx" --include="*.ts"
```

### Find colorScheme="primary"
```bash
grep -r 'colorScheme="primary"' src/ --include="*.tsx"
```

### Find gray color references
```bash
grep -r "gray\\.7" src/ --include="*.tsx"
```

## Component-Specific Migrations

### NavBar
- ✅ Updated to use `secondary` colorScheme
- ✅ Search input uses soft focus ring
- ✅ Icons use semantic colors

### Cards (GuideCard, TourCard)
- ✅ Backgrounds use `primary.600` (dark mode)
- ✅ Text uses `highlight.50`
- ✅ Borders use `whiteAlpha.200`
- ✅ Buttons use `secondary` colorScheme

### Modals (SettingsModal, AuthModal)
- ✅ Overlays use `blackAlpha.700`
- ✅ Content backgrounds use `surface` semantic token
- ✅ Buttons use `secondary` colorScheme

### Forms (Inputs, Selects)
- ✅ Focus rings use `secondary.500`
- ✅ Borders use `borderColor` semantic token
- ✅ Backgrounds use `surface`

## Testing Checklist

After migrating a component:

- [ ] Check in dark mode
- [ ] Check in light mode
- [ ] Verify text contrast (use DevTools)
- [ ] Test focus states
- [ ] Test hover states
- [ ] Verify icons inherit color properly
- [ ] Check responsive behavior

## Automated Detection

Run this script to find remaining hard-coded colors:

```bash
# Find hex color codes
find src -type f \( -name "*.tsx" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/theme/*" \
  -exec grep -H "#[0-9a-fA-F]\{3,6\}" {} \;

# Find old colorScheme usage
grep -r 'colorScheme="primary"' src --include="*.tsx"
```

## Notes

- The theme system is backward compatible with standard Chakra colors
- CSS variables are synced automatically when theme changes
- All tokens work in both light and dark mode
- Semantic tokens adapt to the current color mode
