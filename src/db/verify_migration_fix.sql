-- Database Migration Verification Script
-- Run this after applying all migrations to verify the fix

-- 1. Check if languages table exists and has data
SELECT 'Languages table verification:' as test;
SELECT COUNT(*) as language_count, 
       'Expected: 12 languages' as expected 
FROM public.languages;

-- 2. Show sample languages data
SELECT 'Sample languages:' as test;
SELECT id, name, code 
FROM public.languages 
ORDER BY name 
LIMIT 5;

-- 3. Check if tour_templates table exists and has data  
SELECT 'Tour templates table verification:' as test;
SELECT COUNT(*) as template_count,
       'Expected: 4+ system templates' as expected
FROM public.tour_templates 
WHERE is_system_template = true;

-- 4. Show sample tour templates
SELECT 'Sample tour templates:' as test;
SELECT name, category, is_system_template 
FROM public.tour_templates 
WHERE is_system_template = true
ORDER BY name
LIMIT 3;

-- 5. Verify table structure matches code expectations
SELECT 'Languages table structure:' as test;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'languages'
ORDER BY ordinal_position;

-- 6. Check RLS policies are active
SELECT 'RLS policies verification:' as test;
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('languages', 'tour_templates');

-- Expected Results:
-- ✅ languages table: 12 rows
-- ✅ tour_templates table: 4+ rows  
-- ✅ languages columns: id (uuid), name (text), code (text)
-- ✅ RLS policies: SELECT policies for both tables