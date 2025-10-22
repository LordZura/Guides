#!/bin/bash

# Color Detection Script
# Scans the codebase for hard-coded color values that should use theme tokens

echo "======================================"
echo "Dark Mode Color Token Scanner"
echo "======================================"
echo ""

# Colors to ignore (these are in theme files)
IGNORE_PATHS="src/theme"

echo "📍 Scanning for hard-coded hex color values..."
echo ""

# Find hex colors
HEX_RESULTS=$(find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/theme/*" \
  -exec grep -Hn "#[0-9a-fA-F]\{3,6\}" {} \; 2>/dev/null)

if [ -n "$HEX_RESULTS" ]; then
  echo "⚠️  Found hex color values:"
  echo "$HEX_RESULTS"
  HEX_COUNT=$(echo "$HEX_RESULTS" | wc -l)
  echo ""
  echo "Total hex colors found: $HEX_COUNT"
else
  echo "✅ No hard-coded hex colors found outside theme files"
fi

echo ""
echo "======================================"
echo ""
echo "📍 Scanning for legacy colorScheme usage..."
echo ""

# Find colorScheme="primary" (should be "secondary" for accents)
PRIMARY_SCHEME=$(grep -rn 'colorScheme="primary"' src --include="*.tsx" 2>/dev/null)

if [ -n "$PRIMARY_SCHEME" ]; then
  echo "⚠️  Found colorScheme=\"primary\" (consider changing to \"secondary\"):"
  echo "$PRIMARY_SCHEME"
  PRIMARY_COUNT=$(echo "$PRIMARY_SCHEME" | wc -l)
  echo ""
  echo "Total instances: $PRIMARY_COUNT"
else
  echo "✅ No legacy colorScheme=\"primary\" found"
fi

echo ""
echo "======================================"
echo ""
echo "📍 Scanning for gray.7XX/8XX backgrounds (should use primary.XXX)..."
echo ""

# Find gray.700, gray.800 which should use primary tokens
GRAY_BG=$(grep -rn 'bg=.*gray\.[78]' src --include="*.tsx" 2>/dev/null)

if [ -n "$GRAY_BG" ]; then
  echo "⚠️  Found gray.7XX/8XX backgrounds:"
  echo "$GRAY_BG"
  GRAY_COUNT=$(echo "$GRAY_BG" | wc -l)
  echo ""
  echo "Total instances: $GRAY_COUNT"
else
  echo "✅ No gray.7XX/8XX backgrounds found"
fi

echo ""
echo "======================================"
echo ""
echo "📍 Scanning for common color literals (white, black)..."
echo ""

# Find color="white" or color="black"
COLOR_LITERALS=$(grep -rn 'color=["'"'"']white\|black["'"'"']' src --include="*.tsx" 2>/dev/null)

if [ -n "$COLOR_LITERALS" ]; then
  echo "⚠️  Found color literals:"
  echo "$COLOR_LITERALS"
  LITERAL_COUNT=$(echo "$COLOR_LITERALS" | wc -l)
  echo ""
  echo "Total instances: $LITERAL_COUNT"
else
  echo "✅ No color literals (white/black) found"
fi

echo ""
echo "======================================"
echo "📊 Summary"
echo "======================================"
echo ""

TOTAL_ISSUES=0

if [ -n "$HEX_RESULTS" ]; then
  TOTAL_ISSUES=$((TOTAL_ISSUES + HEX_COUNT))
fi

if [ -n "$PRIMARY_SCHEME" ]; then
  TOTAL_ISSUES=$((TOTAL_ISSUES + PRIMARY_COUNT))
fi

if [ -n "$GRAY_BG" ]; then
  TOTAL_ISSUES=$((TOTAL_ISSUES + GRAY_COUNT))
fi

if [ -n "$COLOR_LITERALS" ]; then
  TOTAL_ISSUES=$((TOTAL_ISSUES + LITERAL_COUNT))
fi

if [ $TOTAL_ISSUES -eq 0 ]; then
  echo "✅ No issues found! All colors appear to use theme tokens."
else
  echo "⚠️  Total potential issues: $TOTAL_ISSUES"
  echo ""
  echo "Review the findings above and update to use theme tokens:"
  echo "  - Hex colors → CSS variables (--color-primary, --color-secondary, --color-highlight)"
  echo "  - colorScheme=\"primary\" → colorScheme=\"secondary\" (for accents)"
  echo "  - gray.7XX/8XX → primary.XXX (for dark mode backgrounds)"
  echo "  - color=\"white\" → color=\"highlight.50\" or color=\"textPrimary\""
  echo ""
  echo "See DARK_MODE_GUIDE.md and COLOR_MIGRATION.md for migration help."
fi

echo ""
echo "======================================"
