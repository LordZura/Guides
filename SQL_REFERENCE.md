# SQL Migration Reference Guide

> **⚠️ Important for Agents**: This file must be updated whenever SQL migrations are modified or added. Always review this document before making database-related changes.

## 🗂️ Migration Overview

This project contains **21 SQL migration files** that must be executed in numerical order. Each migration builds upon the previous ones, creating the complete database schema for the TourGuideHub application.

## 📋 Migration Execution Order

### Core Tables (001-010)
**Execute these first - they create the foundational data structures**

| File | Purpose | Key Features | Dependencies | Issues/Notes |
|------|---------|--------------|--------------|--------------|
| `001_create_profiles.sql` | User profiles extending Supabase auth | RLS policies, role-based access (guide/tourist) | Supabase auth.users | ✅ Stable |
| `002_create_tours_table.sql` | Tours with locations, pricing, scheduling | Complex RLS, location arrays, triggers | profiles table | ✅ Stable |
| `003_create_bookings_table.sql` | Booking system with status tracking | Status constraints, payment tracking | tours, profiles | ⚠️ Status enum updated in 010 |
| `004_create_reviews_table.sql` | Review system for tours and guides | Target-based reviews, rating constraints | tours, profiles | ⚠️ Functions added in later migrations |
| `005_update_profiles_add_fields.sql` | Additional profile fields | Bio, interests, languages, experience | profiles table | ✅ Safe to run multiple times |
| `006_create_notifications_table.sql` | Real-time notification system | Actor/recipient pattern, action URLs | profiles table | ✅ Stable |
| `007_add_tour_locations_array.sql` | Multiple ordered locations per tour | JSONB locations array, GIN indexing | tours table | ✅ Backward compatible |
| `008_create_tour_templates_table.sql` | Template system with defaults | System templates, Svaneti tour defaults | profiles table | ✅ Includes sample data |
| `009_update_profiles_rls_for_notifications.sql` | RLS for notification actors | Profile visibility for notifications | profiles, notifications | ✅ Stable |
| `010_add_offered_status_to_bookings.sql` | Adds 'offered' booking status | Status constraint update | bookings table | ⚠️ May conflict with 018 |

### Critical Tables (011-012)
**Required for application functionality**

| File | Purpose | Key Features | Dependencies | Issues/Notes |
|------|---------|--------------|--------------|--------------|
| `011_create_languages_table.sql` | Language filtering system | ISO codes, predefined languages | None | 🚨 **REQUIRED** - App fails without this |
| `012_fix_bookings_update_policy.sql` | Fixes tourist update permissions | RLS policy fixes | bookings table | ⚠️ May be superseded by 018 |

### Review System Functions (013-017)
**Complex aggregation functions - execute with caution**

| File | Purpose | Key Features | Dependencies | Issues/Notes |
|------|---------|--------------|--------------|--------------|
| `013_create_get_review_summary_function.sql` | Basic review aggregation | Average rating, review count | reviews table | ⚠️ **SUPERSEDED** by later versions |
| `014_create_get_guide_rating_from_tours_function.sql` | Guide rating from tour reviews | Guide-specific aggregation | reviews, tours | ⚠️ **SUPERSEDED** by 015 |
| `015_safe_review_fixes_migration.sql` | Safe function replacement | Existence checks, function updates | 013, 014 files | ✅ **RECOMMENDED** version |
| `016_add_rating_counts_to_summary.sql` | Adds rating distribution | JSONB rating counts | 015 or previous | ⚠️ **DUPLICATE** - see 016_fix |
| `016_fix_review_summary_rating_counts.sql` | Fixed rating counts function | Corrected rating distribution | review functions | ⚠️ **CONFLICT** with 016 |
| `017_fix_empty_tour_reviews.sql` | Handles empty review cases | Better error handling, NULL safety | All review functions | ✅ **LATEST** review function |

### Bug Fixes & Enhancements (018-020)
**Recent fixes and constraints**

| File | Purpose | Key Features | Dependencies | Issues/Notes |
|------|---------|--------------|--------------|--------------|
| `018_fix_offered_booking_updates.sql` | Tourist acceptance of offers | Comprehensive RLS policies | bookings table | ⚠️ **CONFLICTS** with 012, 019 |
| `019_debug_booking_policies.sql` | Debug booking updates | Logging triggers, policy verification | 018 or bookings | ⚠️ **DEBUG ONLY** - remove in prod |
| `020_add_unique_review_constraint.sql` | Prevents duplicate reviews | Unique constraint on reviewer/target | reviews table | ✅ **RECOMMENDED** |

## 🔍 Critical Functions

### Review System Functions
The review system has evolved through multiple iterations. **Use only the latest versions:**

#### `get_review_summary(target_id UUID, target_type TEXT)`
**Current Version**: File 017 (Latest)
- **Returns**: `(average_rating NUMERIC, total_reviews INTEGER, rating_counts JSONB)`
- **Purpose**: Aggregates reviews for tours OR guides
- **Special Logic**: For guides, combines direct guide reviews + reviews from all their tours
- **Issues**: Previous versions had empty result bugs, missing rating_counts

#### `get_guide_rating_from_tours(guide_id UUID)` 
**Current Version**: File 015 (Safe migration)
- **Returns**: `(average_rating NUMERIC, total_reviews INTEGER)`
- **Purpose**: Guide-specific rating from tour reviews only
- **Issues**: May be redundant with get_review_summary guide logic

## ⚠️ Common Issues & Conflicts

### 1. **Booking Status Conflicts**
- Files 010, 012, 018, 019 all modify booking policies
- **Solution**: Execute 018 last, skip 019 in production
- **Status Values**: `requested`, `offered`, `accepted`, `declined`, `paid`, `completed`, `cancelled`

### 2. **Review Function Conflicts**
- Files 013-017 contain multiple versions of same functions
- **Solution**: Use 017 as the canonical version
- **Risk**: Running multiple versions may cause signature conflicts

### 3. **Duplicate Files**
- `016_add_rating_counts_to_summary.sql` vs `016_fix_review_summary_rating_counts.sql`
- **Solution**: Choose one based on your needs, prefer the "fix" version

## 🛠️ Recommended Execution Strategy

### For New Installations:
```sql
-- Core tables (required)
001_create_profiles.sql
002_create_tours_table.sql
003_create_bookings_table.sql
004_create_reviews_table.sql
005_update_profiles_add_fields.sql
006_create_notifications_table.sql
007_add_tour_locations_array.sql
008_create_tour_templates_table.sql
009_update_profiles_rls_for_notifications.sql

-- Critical functionality
011_create_languages_table.sql

-- Latest booking policies (skip 010, 012)
018_fix_offered_booking_updates.sql

-- Latest review system (skip 013, 014, 016)
015_safe_review_fixes_migration.sql
017_fix_empty_tour_reviews.sql

-- Constraints
020_add_unique_review_constraint.sql
```

### For Existing Installations:
1. **Check existing functions**: Query `information_schema.routines` to see what exists
2. **Review file conflicts**: Especially booking policies and review functions
3. **Test in development**: Always test migration sequences in dev first
4. **Use safe migrations**: Files like 015 include existence checks

## 🔄 Maintenance Notes for Agents

### Before Modifying SQL:
1. **Read this file completely**
2. **Check for function conflicts**
3. **Test with sample data**
4. **Update this documentation**

### When Adding New Migrations:
1. **Use sequential numbering**: Next available number (021+)
2. **Include rollback instructions** if possible
3. **Add safety checks** for existing objects
4. **Update this reference immediately**

### When Debugging SQL Issues:
1. **Check migration order** was followed
2. **Verify RLS policies** are correctly applied
3. **Test function signatures** match expected calls
4. **Review logs** for constraint violations

## 📊 Database Schema Summary

### Core Tables:
- **profiles**: User authentication and profile data
- **tours**: Tour listings with locations and pricing
- **bookings**: Reservation and payment tracking
- **reviews**: Rating and feedback system
- **notifications**: Real-time user notifications
- **languages**: Supported languages for filtering
- **tour_templates**: Reusable tour configurations

### Key Relationships:
- `profiles` ↔ `tours` (creator relationship)
- `profiles` ↔ `bookings` (tourist/guide relationship)  
- `tours` ↔ `bookings` (booking target)
- `reviews` → `profiles|tours` (polymorphic reviews)

### Critical Indexes:
- GIN index on `tours.locations` for location queries
- Unique index on `reviews(reviewer_id, target_id, target_type)`
- Performance indexes on foreign keys and frequently queried fields

---

**🚨 Remember**: Always update this file when making SQL changes. Future agents depend on this documentation being accurate and current.