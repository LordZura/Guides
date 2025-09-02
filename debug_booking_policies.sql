-- Test script to reproduce and verify the booking update issue fix
-- Run this in your Supabase SQL Editor to test the payment status update

-- First, let's check the current state
SELECT 'Current RLS policies for bookings table:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'bookings';

-- Check current bookings table structure
SELECT 'Current status constraint:' as info;
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'bookings' 
  AND contype = 'c'
  AND conname LIKE '%status%';

-- Test query to simulate the failing update
-- This should help identify if the issue is with RLS or something else
SELECT 'Testing policy conditions (simulated):' as info;

-- This would be the actual update that fails:
-- UPDATE public.bookings SET status = 'paid' WHERE id = 'some-booking-id';
-- We can't test this without actual data, but we can check the policy conditions

-- Check if there are any triggers that might cause P0001 errors
SELECT 'Triggers on bookings table:' as info;
SELECT 
  trigger_name,
  action_timing,
  event_manipulation,
  trigger_schema,
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bookings'
ORDER BY trigger_name;