# Database Migration Instructions

## Critical Database Issues Fix

This project requires specific database tables to function properly. The following migrations must be executed in your Supabase database to resolve filter and functionality issues.

## Required Migrations

Execute these SQL files in your Supabase SQL Editor in the following order:

### Core Tables (if not already created)
1. `001_create_profiles.sql` - User profiles table
2. `002_create_tours_table.sql` - Tours table
3. `003_create_bookings_table.sql` - Bookings table
4. `004_create_reviews_table.sql` - Reviews table
5. `005_update_profiles_add_fields.sql` - Profile updates
6. `006_create_notifications_table.sql` - Notifications table
7. `007_add_tour_locations_array.sql` - Tour locations array
8. `008_create_tour_templates_table.sql` - **CRITICAL: Tour templates table**
9. `009_update_profiles_rls_for_notifications.sql` - Profile RLS updates
10. `010_add_offered_status_to_bookings.sql` - Booking status updates

### **NEW: Essential Missing Table**
11. `011_create_languages_table.sql` - **CRITICAL: Languages table with id, name, code columns**

## Verification

After running the migrations, verify the tables exist by running these queries in your Supabase SQL Editor:

```sql
-- Check languages table
SELECT * FROM public.languages LIMIT 5;

-- Check tour_templates table  
SELECT * FROM public.tour_templates LIMIT 5;

-- Verify table structure
\d public.languages
\d public.tour_templates
```

## Expected Results

After applying migrations, the following should work without errors:
- Language filter dropdown should populate
- Tour templates should load
- No more "table not found" errors
- Filter functionality should work correctly

## Troubleshooting

If you still see errors:
1. Verify all migrations ran successfully
2. Check RLS policies are enabled
3. Ensure your Supabase project has the correct tables
4. Check browser console for specific error messages