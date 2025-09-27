# 🤖 AI Agent Documentation Index

> **Start Here**: This index guides AI agents through the TourGuideHub codebase efficiently

## 📋 Documentation Quick Access

### Primary Documentation
| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[README.md](./README.md)** | Main project overview | First read, project understanding |
| **[SQL_REFERENCE.md](./SQL_REFERENCE.md)** | Complete database guide | **Before any DB changes** |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Development guidelines | Code changes, best practices |
| **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** | Quick troubleshooting | Debugging, common issues |

## 🚨 Critical Information for Agents

### Before Making ANY Changes
1. **Read SQL_REFERENCE.md completely** if touching database
2. **Check current status**: `npm run lint` (101 warnings), `npm run build` (passes)
3. **Understand user roles**: Guide vs Tourist (different permissions)

### Essential Files That Break the App
- `src/db/migrations/011_create_languages_table.sql` - **REQUIRED**
- Review system functions (files 013-017) - Use 017 as canonical
- Booking policies (files 012, 018, 019) - Complex RLS rules

## 🎯 Quick Start for Different Tasks

### Working on UI Components
```bash
# Read first
README.md → "Project Structure for Agents"
CONTRIBUTING.md → "Component Development"

# Key directories
src/components/     # 29 components
src/pages/         # 5 main pages
```

### Database/SQL Changes
```bash
# MUST READ FIRST
SQL_REFERENCE.md   # Complete migration guide

# Key points
- 21 migration files exist
- Execute in numerical order
- File conflicts exist in review functions
- Update SQL_REFERENCE.md immediately
```

### Debugging Issues
```bash
# Start here
DEVELOPMENT_GUIDE.md → "Quick Troubleshooting"

# Common issues
- App won't start: Check .env.local
- No tours showing: Missing languages table (011)
- Permission errors: RLS policies in Supabase
```

### Code Quality/Testing
```bash
# Current status
npm run lint    # 101 warnings (console.log, any types)
npm run test    # Limited coverage
npm run build   # Passes (1MB+ bundle)

# Fix patterns in CONTRIBUTING.md
```

## 📊 Project Status Overview

### ✅ What Works
- Authentication (role-based)
- Tour CRUD operations
- Booking system (complex flow)
- Review system (complex aggregation)
- Real-time notifications
- Responsive UI (Chakra UI)

### ⚠️ Current Issues
- **101 ESLint warnings** (high priority)
- **1MB+ bundle size** (needs code splitting)
- **SQL function conflicts** (use migration 017)
- **2 npm security issues** (moderate)

### 🔄 Recent Changes (files 018-020)
- Booking policy fixes for tourist acceptance
- Debug logging for booking updates
- Unique review constraints

## 🗂️ Codebase Architecture

### Frontend (React + TypeScript)
```
src/
├── components/    # UI components (29 files)
├── contexts/      # State management (8 contexts)
├── pages/         # Route components (5 pages)
├── hooks/         # Custom React hooks
├── lib/           # Utilities (types, API, Supabase)
```

### Database (PostgreSQL + Supabase)
```
src/db/migrations/
├── 001-010: Core tables
├── 011: Languages (REQUIRED)
├── 012: Booking policies
├── 013-017: Review functions (use 017)
├── 018-020: Recent fixes
```

### Technologies
- **React 18.2.0** + **TypeScript 5.0.2**
- **Chakra UI 2.10.9** (component library)
- **Supabase 2.38.4** (BaaS)
- **Vite 4.4.5** (build tool)

## 🚀 Common Agent Workflows

### 1. Adding New Feature
```bash
# Step 1: Understand existing patterns
README.md → "Project Structure"
src/components/ → Check similar components

# Step 2: Create component
touch src/components/NewFeature.tsx
touch src/components/NewFeature.test.tsx

# Step 3: Update types (if needed)
src/lib/types.ts

# Step 4: Test and lint
npm run test
npm run lint
```

### 2. Fixing Database Issue
```bash
# Step 1: REQUIRED reading
SQL_REFERENCE.md → Complete guide

# Step 2: Identify issue
- Check migration order
- Review function conflicts
- RLS policy problems

# Step 3: Create fix
touch src/db/migrations/021_fix_name.sql
# Include safety checks

# Step 4: Update documentation
SQL_REFERENCE.md → Add new migration
```

### 3. Debugging Runtime Issue
```bash
# Step 1: Quick troubleshooting
DEVELOPMENT_GUIDE.md → "Quick Troubleshooting"

# Step 2: Check common issues
- Browser console errors
- Network tab for API calls
- Supabase dashboard for RLS

# Step 3: Test fix
npm run dev
# Test with both guide and tourist roles
```

## 📋 Agent Checklist Template

### Before Starting Work
- [ ] Read relevant documentation section
- [ ] Check current build/lint status
- [ ] Understand user roles if relevant
- [ ] Review existing similar code

### During Development
- [ ] Follow TypeScript strictly (no 'any')
- [ ] Use Chakra UI components
- [ ] Add proper error handling
- [ ] Test with different user roles

### Before Committing
- [ ] Fix lint warnings in modified files
- [ ] Run tests and build
- [ ] Update documentation if needed
- [ ] Test critical user flows manually

## 🎯 Success Patterns

### High Success Rate Tasks
- UI component creation (clear patterns)
- Type definitions (well-structured)
- Basic CRUD operations (established patterns)

### Medium Complexity Tasks
- Booking system changes (complex state)
- Review system modifications (aggregation functions)
- RLS policy updates (security implications)

### High Risk Tasks
- SQL migration conflicts (requires careful planning)
- Bundle optimization (impacts performance)
- Authentication changes (security critical)

---

**🎯 Agent Success Strategy**:
1. Always start with the appropriate documentation
2. Understand before modifying (especially database)
3. Test with multiple user roles
4. Keep documentation updated
5. Focus on minimal, surgical changes