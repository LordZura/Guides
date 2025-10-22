# TourGuideHub - Complete Tour Guide Marketplace Platform

> **🤖 Agent-Friendly Documentation**: This README is optimized for AI agents. See [SQL_REFERENCE.md](./SQL_REFERENCE.md) for comprehensive database documentation.

TourGuideHub is a production-ready web application connecting tourists with local tour guides. Built with modern technologies including React 18, TypeScript, and Supabase, it provides a complete marketplace platform for tour discovery, booking, and management.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Supabase       │    │   PostgreSQL    │
│   • TypeScript   │◄──►│   • Auth         │◄──►│   • RLS Policies│
│   • Chakra UI    │    │   • Real-time    │    │   • Functions   │
│   • Context API  │    │   • Storage      │    │   • Triggers    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start for Agents

### 1. Prerequisites Check
```bash
node --version    # Required: v16+
npm --version     # Required: v8+
```

### 2. Installation
```bash
git clone <repository>
cd Guides
npm install       # Installs 426+ packages
```

### 3. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 4. Database Setup - CRITICAL ⚠️
Execute SQL files from `src/db/migrations/` in **numerical order**. See [SQL_REFERENCE.md](./SQL_REFERENCE.md) for detailed migration guide.

**Essential files (will cause app failure if missing):**
- `011_create_languages_table.sql` - Language filtering system
- All review system functions (013-017) - Complex aggregation system

### 5. Development
```bash
npm run dev      # Starts dev server on http://localhost:5173
npm run build    # Production build (currently 1MB+ bundle)
npm run test     # Vitest test runner
npm run lint     # ESLint (currently 101 warnings)
```

## 📊 Current Project Status

### ✅ Working Features
- **Authentication**: Role-based (Guide/Tourist) with Supabase Auth
- **Tour Management**: CRUD operations with templates
- **Booking System**: Complete flow with status tracking
- **Review System**: Ratings with complex aggregation functions
- **Real-time**: Live notifications via Supabase subscriptions
- **Responsive UI**: Mobile-first with Chakra UI

### ⚠️ Known Issues
- **Linting**: 52 warnings (reduced from 160 - remaining in test helpers and contexts)
- **Bundle Size**: 1MB+ (needs code splitting)
- **SQL Migrations**: Conflicting versions of review functions (documented in SQL_REFERENCE.md)
- **Security Warnings**: 2 moderate npm audit issues

### 🔄 Recent Changes
- **Code Cleanup**: Removed 160+ ESLint warnings, cleaned up console.log statements and TypeScript 'any' types
- **Documentation**: Consolidated from 15+ markdown files to 4 core documentation files
- **Removed Files**: Deleted obsolete diagnostic scripts and components
- Complex review aggregation system (files 013-017)
- Booking policy fixes for tourist acceptance (file 018)
- Unique review constraints (file 020)

## 🗂️ Project Structure for Agents

```
/home/runner/work/Guides/Guides/
├── src/
│   ├── components/           # 29 React components
│   │   ├── AuthModal.tsx     # Auth with role selection
│   │   ├── BookingForm.tsx   # Booking creation/management  
│   │   ├── TourCard.tsx      # Tour display with reviews
│   │   ├── ReviewForm.tsx    # Review submission
│   │   ├── SettingsModal.tsx # Theme toggle & preferences
│   │   └── ...
│   ├── pages/               # 5 main pages
│   │   ├── Dashboard.tsx    # Role-specific dashboards
│   │   ├── Explore.tsx      # Tour discovery with filters
│   │   ├── TourDetails.tsx  # Individual tour booking
│   │   └── ...
│   ├── contexts/            # 8 React contexts
│   │   ├── AuthProvider.tsx    # User state management
│   │   ├── BookingContext.tsx  # Booking logic
│   │   ├── ToursContext.tsx    # Tour data management
│   │   └── ...
│   ├── db/migrations/       # 22 SQL files (see SQL_REFERENCE.md)
│   ├── lib/                 # Core utilities
│   │   ├── supabaseClient.ts  # Supabase configuration
│   │   ├── api.ts           # API helper functions
│   │   └── types.ts         # TypeScript definitions
│   └── hooks/               # Custom React hooks
├── scripts/
├── SQL_REFERENCE.md         # 📖 COMPREHENSIVE SQL GUIDE
├── CONTRIBUTING.md          # Development guidelines
└── package.json            # Dependencies and scripts
```

## 🔧 Technologies & Dependencies

### Core Stack
- **React 18.2.0**: Component library with hooks
- **TypeScript 5.0.2**: Type safety and development experience
- **Vite 4.4.5**: Build tool and dev server
- **Chakra UI 2.10.9**: Component library and theming
- **Supabase 2.38.4**: Backend-as-a-Service

### Key Dependencies
- **@supabase/supabase-js**: Database and auth client
- **react-router-dom 6.18.0**: Client-side routing
- **framer-motion 12.23.12**: Animations for Chakra UI
- **react-select 5.10.2**: Enhanced select components
- **react-icons 5.5.0**: Icon library

### Development Tools
- **Vitest 0.34.6**: Testing framework
- **ESLint 9.34.0**: Code linting
- **TypeScript ESLint**: TypeScript-specific linting
- **@testing-library/react**: React component testing

## 🎯 User Roles & Features

### Tourist Role
- **Browse Tours**: Filter by location, language, price, rating
- **Booking Management**: Request tours, accept guide offers
- **Payment Tracking**: Monitor booking payments and status
- **Review System**: Rate tours and guides after completion
- **Profile**: Basic profile with preferences

### Guide Role  
- **Tour Creation**: Create tours with templates or from scratch
- **Booking Management**: Accept requests, create offers
- **Earnings Tracking**: Monitor payments and tour performance
- **Review Analytics**: View ratings aggregated from all tours
- **Profile**: Detailed profile with experience, specialties, bio

## 🗄️ Database Schema Summary

### Core Tables (8 main tables)
```sql
profiles        -- User profiles extending Supabase auth
tours           -- Tour listings with locations (JSONB)
bookings        -- Reservations with status tracking
reviews         -- Ratings for tours AND guides
notifications   -- Real-time user notifications  
languages       -- Language filtering (REQUIRED)
tour_templates  -- Reusable tour configurations
```

### Complex Functions (see SQL_REFERENCE.md)
- `get_review_summary()` - Aggregates ratings with distribution
- `get_guide_rating_from_tours()` - Guide-specific calculations
- **Version conflicts exist** - use migration 017 as canonical

## 🚨 Critical Information for Agents

### Before Making Changes
1. **Read SQL_REFERENCE.md completely** - Complex migration dependencies
2. **Check current linting status** - 101 warnings need attention
3. **Understand RLS policies** - Complex security rules in Supabase
4. **Review booking system** - Multiple conflicting policy migrations

### Common Development Tasks

#### Adding New Features
```bash
# 1. Create component in src/components/
# 2. Add to appropriate context if needed
# 3. Update types in src/lib/types.ts
# 4. Add tests (existing pattern: *.test.tsx)
# 5. Run linting and fix warnings
```

#### Database Changes
```bash
# 1. Create new migration file (next number: 021_*.sql)
# 2. Include safety checks for existing objects
# 3. Update SQL_REFERENCE.md immediately
# 4. Test migration in development first
```

#### Debugging Common Issues
- **"Table not found"**: Check migration order, especially languages table
- **"Tourist not allowed"**: Check RLS policies, likely booking permissions
- **Function signature errors**: Review function conflicts in migrations 013-017
- **Build failures**: Check TypeScript types, avoid 'any'

### Testing Strategy
- **Component Tests**: Use @testing-library/react pattern
- **Integration Tests**: Available but limited coverage  
- **Manual Testing**: Required for booking flows and payments
- **Database Testing**: SQL functions need manual verification

## 🔄 Development Workflow

### For New Contributors
1. **Setup**: Follow Quick Start guide completely
2. **Database**: Execute ALL migrations in order (critical)
3. **Code Review**: Check existing component patterns
4. **Testing**: Add tests following existing patterns
5. **Documentation**: Update SQL_REFERENCE.md for DB changes

### For Code Changes
```bash
git checkout -b feature/your-feature
# Make changes
npm run lint    # Fix warnings before commit
npm run test    # Ensure tests pass
npm run build   # Verify production build
# Commit with descriptive messages
```

## 📞 Support & Troubleshooting

### Common Issues
1. **App won't start**: Check .env.local configuration
2. **Login fails**: Verify Supabase URL and keys
3. **No tours showing**: Run migration 011 (languages table)
4. **Booking errors**: Check migrations 018-019 for policies
5. **Review system broken**: Use migration 017 (latest version)

### Debug Resources
- **Browser Console**: Shows Supabase errors and RLS violations
- **Supabase Dashboard**: Check RLS policies and table data
- **SQL_REFERENCE.md**: Comprehensive migration guide
- **CONTRIBUTING.md**: Development guidelines

### Performance Notes
- **Bundle Size**: 1MB+ (consider code splitting)
- **Database**: GIN indexes on JSONB fields for performance
- **Real-time**: Supabase subscriptions for live updates
- **Caching**: Limited client-side caching implemented

---

**📋 Agent Checklist**: 
- [ ] Read SQL_REFERENCE.md before DB changes
- [ ] Run all migrations in order for setup
- [ ] Address linting warnings in modified files
- [ ] Test booking and review flows manually
- [ ] Update documentation for significant changes
