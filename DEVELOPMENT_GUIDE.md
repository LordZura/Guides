# Development Quick Reference Guide

> **🎯 Agent Quick Reference**: Essential commands and troubleshooting for rapid development

## 🚀 Essential Commands

```bash
# Setup (first time)
npm install
cp .env.example .env.local
# Configure Supabase credentials in .env.local

# Development workflow
npm run dev         # Start dev server (localhost:5173)
npm run build       # Build for production
npm run test        # Run tests
npm run lint        # Check code quality

# Database
# Execute SQL files from src/db/migrations/ in numerical order
# See SQL_REFERENCE.md for migration details
```

## 🔍 Current Project State

### Build Status: ✅ PASSING
- TypeScript compilation: ✅ Success
- Vite build: ✅ Success (1MB+ bundle)
- Tests: ⚠️ Limited coverage

### Code Quality: ✅ IMPROVED  
- ESLint warnings: **52 warnings** (down from 160)
- Remaining issues: console.log in test helpers, some TypeScript 'any' types
- Security: 2 moderate npm audit issues

### Database: ⚠️ COMPLEX
- **22 SQL migration files**
- **Multiple versions of review functions** (use 017 as canonical)
- **File 011 REQUIRED** for app functionality

## 🚨 Quick Troubleshooting

### App Won't Start
```bash
# Check environment
cat .env.local                    # Verify Supabase config
npm run dev                       # Check console for errors

# Common fixes
rm -rf node_modules package-lock.json
npm install                       # Reinstall dependencies
```

### Database Issues
```bash
# Most common: missing languages table
# Run: 011_create_languages_table.sql in Supabase

# Check migration order
ls -la src/db/migrations/         # All files 001-020 should exist
```

### Build Failures  
```bash
# Check TypeScript errors
npx tsc --noEmit                  # Type checking only

# Common issues
# - Missing imports
# - TypeScript 'any' types
# - Unused variables
```

### Authentication Issues
```bash
# Check Supabase connection
# Browser Console → Network tab
# Look for 401/403 errors

# Common fixes
# - Verify .env.local credentials
# - Check RLS policies in Supabase dashboard
```

## 📁 File Structure Quick Reference

### High-Impact Files
```
src/
├── components/
│   ├── BookingForm.tsx      # Complex booking logic
│   ├── ReviewForm.tsx       # Has many console.log warnings
│   ├── TourCard.tsx         # Main tour display component
│   └── AuthModal.tsx        # Role-based authentication
├── contexts/
│   ├── BookingContext.tsx   # Central booking state (has 'any' types)
│   ├── AuthProvider.tsx     # User authentication
│   └── ToursContext.tsx     # Tour data management
├── db/migrations/           # 21 SQL files - see SQL_REFERENCE.md
└── lib/
    ├── supabaseClient.ts    # Database configuration
    ├── types.ts             # TypeScript definitions
    └── api.ts               # API helper functions
```

### Documentation Files
```
├── README.md                # Main project documentation
├── SQL_REFERENCE.md         # Comprehensive SQL guide
├── CONTRIBUTING.md          # Development guidelines
├── DEVELOPMENT_GUIDE.md     # This file - quick reference
└── .env.example             # Environment template
```

## ⚡ Quick Development Patterns

### Adding a New Component
```bash
# Create component
touch src/components/NewComponent.tsx
touch src/components/NewComponent.test.tsx

# Basic component template
import { Box } from '@chakra-ui/react';
import { FC } from 'react';

interface NewComponentProps {
  // Define props with proper TypeScript
}

export const NewComponent: FC<NewComponentProps> = ({ /* props */ }) => {
  return (
    <Box>
      {/* Component JSX */}
    </Box>
  );
};
```

### Database Changes
```bash
# Create migration file
touch src/db/migrations/021_your_change.sql

# Update SQL_REFERENCE.md immediately
# Test in development before production
```

### Context Updates
```bash
# Follow existing patterns in src/contexts/
# Use TypeScript strictly
# Provide proper error handling
# Test with both user roles (guide/tourist)
```

## 🔧 Common Code Fixes

### ESLint Warnings
```bash
# Replace console.log with console.error/warn where appropriate
# Or remove debug logging

# Fix TypeScript 'any' types
# Use proper interface definitions from src/lib/types.ts
```

### Performance Issues
```bash
# Large bundle size (1MB+)
# Consider code splitting:
# import { lazy } from 'react';
# const Component = lazy(() => import('./Component'));
```

### Database Function Conflicts
```bash
# Use migration file 017 as canonical for review functions
# Avoid running multiple versions of same functions
# Check information_schema.routines for existing functions
```

## 📋 Testing Checklist

### Manual Testing Required
- [ ] Authentication (guide/tourist roles)
- [ ] Tour creation and editing
- [ ] Booking flow (request/offer/accept)
- [ ] Payment status tracking
- [ ] Review submission
- [ ] Real-time notifications

### Automated Testing
```bash
npm run test                 # Run existing tests
# Add tests following existing patterns in *.test.tsx files
```

## 🎯 Performance Notes

### Current Metrics
- **Bundle Size**: 1MB+ (needs optimization)
- **Dependencies**: 426+ packages
- **Build Time**: ~6 seconds
- **Dev Server**: Fast hot reload

### Optimization Opportunities
- Code splitting for large components
- Bundle analysis with `npm run build -- --analyze`
- Image optimization
- API response caching

---

**💡 Pro Tips for Agents**:
- Always check SQL_REFERENCE.md before database changes
- Test with both guide and tourist roles
- Use browser dev tools for debugging RLS issues
- Keep SQL_REFERENCE.md updated with any changes