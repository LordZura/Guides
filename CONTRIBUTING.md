# Contributing to TourGuideHub

> **🤖 Agent Guide**: This document provides development guidelines optimized for AI agents working on this codebase.

## 🚀 Quick Development Setup

### Essential Prerequisites
```bash
node --version  # Requires v16+
npm --version   # Requires v8+
```

### Environment Configuration
```bash
# 1. Clone and setup
git clone <repository>
cd Guides
npm install

# 2. Environment setup
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# 3. Database setup (CRITICAL)
# Execute ALL SQL files in src/db/migrations/ in numerical order
# See SQL_REFERENCE.md for detailed migration guide

# 4. Development
npm run dev     # http://localhost:5173
```

## 📁 Code Architecture for Agents

### Component Structure
```
src/components/         # 29 reusable UI components
├── AuthModal.tsx      # Role-based authentication
├── BookingForm.tsx    # Booking creation (complex state)
├── TourCard.tsx       # Tour display (has console warnings)
├── ReviewForm.tsx     # Review submission (needs cleanup)
└── ...
```

### State Management
```
src/contexts/          # 8 React contexts
├── AuthProvider.tsx   # User state (critical)
├── BookingContext.tsx # Booking logic (has any types)
├── ToursContext.tsx   # Tour data management
└── ...
```

### Database Layer
```
src/db/migrations/     # 21 SQL files
├── 001-010_*.sql     # Core tables
├── 011_*.sql         # Languages (REQUIRED)
├── 013-017_*.sql     # Review functions (complex)
└── 018-020_*.sql     # Recent fixes
```

## 🔧 Development Workflow for Agents

### Before Making Changes
1. **Read Documentation First**
   - README.md for overview
   - SQL_REFERENCE.md for database changes
   - Check current lint/build status

2. **Understand Current State**
   ```bash
   npm run lint    # 101 warnings currently
   npm run build   # Should pass (1MB+ bundle)
   npm run test    # Limited coverage
   ```

### Making Code Changes

#### 1. Component Development
```bash
# Pattern for new components
src/components/NewComponent.tsx
src/components/NewComponent.test.tsx  # Following existing patterns

# Key patterns to follow:
- Use TypeScript strictly (avoid 'any')
- Use Chakra UI components
- Follow existing hook patterns
- Add proper error handling
```

#### 2. Database Changes
```bash
# Create new migration file
touch src/db/migrations/021_your_change.sql

# Include safety checks
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM ...) THEN
        -- Your changes here
    END IF;
END $$;

# Update SQL_REFERENCE.md immediately
```

#### 3. Testing Strategy
```bash
# Component tests (use existing patterns)
npm run test

# Manual testing required for:
- Authentication flows
- Booking system
- Payment tracking
- Review submission
```

## ⚠️ Current Known Issues

### High Priority
- **101 ESLint Warnings**: Console.log statements and TypeScript any types
- **Bundle Size**: 1MB+ needs code splitting
- **SQL Conflicts**: Multiple versions of review functions (use 017)

### Medium Priority  
- **Security Audit**: 2 moderate npm vulnerabilities
- **Test Coverage**: Limited component test coverage
- **Performance**: No caching implementation

## 🚨 Critical Areas for Agents

### Database Migrations
- **NEVER skip migration order**
- **Use SQL_REFERENCE.md as truth source**
- **Test migrations in development first**
- **File 011 is REQUIRED** (languages table)

### Booking System
- **Complex RLS policies** in files 012, 018, 019
- **Status flow**: requested → offered → accepted → paid → completed
- **Tourist/Guide permissions** often cause issues

### Review System
- **Complex aggregation functions** in files 013-017
- **Use file 017 as canonical version**
- **Guide ratings aggregate from tour reviews**

## 🛠️ Common Development Tasks

### Adding New Features
```bash
# 1. Component creation
mkdir -p src/components
touch src/components/NewFeature.tsx
touch src/components/NewFeature.test.tsx

# 2. Type definitions
# Add to src/lib/types.ts

# 3. Context integration (if needed)
# Add to appropriate context in src/contexts/

# 4. Route setup (if needed)
# Update src/App.tsx or router configuration
```

### Debugging Issues
```bash
# Common debugging commands
npm run lint                    # Check code issues
npm run build                  # Verify build
npm run dev                    # Start dev server
npm run test                   # Run tests

# Database debugging
# Use Supabase dashboard to check:
# - RLS policies
# - Function definitions
# - Table data
```

### Code Quality
- **TypeScript**: Strict mode enabled, avoid 'any'
- **ESLint**: Fix warnings in files you modify
- **Testing**: Add tests for new functionality
- **Performance**: Consider bundle size impact

## 📋 Agent Checklist for Changes

### Before Starting
- [ ] Read SQL_REFERENCE.md if touching database
- [ ] Check current lint/build status
- [ ] Understand existing patterns in similar components
- [ ] Review RLS policies if touching auth/permissions

### During Development
- [ ] Follow existing TypeScript patterns
- [ ] Use Chakra UI components consistently
- [ ] Add proper error handling
- [ ] Test with different user roles (guide/tourist)

### Before Committing
- [ ] Run `npm run lint` and fix warnings in modified files
- [ ] Run `npm run build` to verify production build
- [ ] Run `npm run test` to ensure tests pass
- [ ] Update SQL_REFERENCE.md if database changes made
- [ ] Test booking and review flows manually

### Security Considerations
- **Never commit credentials** or API keys
- **Review RLS policies** for data access
- **Validate user inputs** in components
- **Test authentication flows** thoroughly

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make incremental commits
git add .
git commit -m "feat: descriptive commit message"

# Before PR
npm run lint    # Fix warnings
npm run test    # Ensure tests pass
npm run build   # Verify build

# Push and create PR
git push origin feature/your-feature-name
```

## 📞 Getting Help

### Debug Resources
1. **Browser Console**: Shows Supabase errors and RLS violations
2. **Supabase Dashboard**: Check policies, functions, data
3. **SQL_REFERENCE.md**: Comprehensive database guide
4. **Network Tab**: Check API calls and responses

### Common Error Solutions
- **"Table not found"**: Run migration 011 (languages)
- **"Tourist not allowed"**: Check booking RLS policies
- **Function signature errors**: Use migration 017 for reviews
- **Build failures**: Check TypeScript types, imports

---

**🎯 Remember**: This codebase is complex but well-structured. Take time to understand existing patterns before making changes, and always prioritize data integrity when working with the database layer.