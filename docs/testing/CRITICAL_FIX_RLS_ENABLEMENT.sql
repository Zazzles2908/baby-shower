-- ============================================================================
-- CRITICAL SECURITY FIX: Enable RLS on public.submissions
-- Run this SQL in Supabase SQL Editor to fix security vulnerability
-- Generated: 2026-01-02T00:49:00Z
-- ============================================================================

-- Step 1: Enable RLS on public.submissions table
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS allow_insert_submissions ON public.submissions;
DROP POLICY IF EXISTS allow_select_submissions ON public.submissions;
DROP POLICY IF EXISTS deny_update_submissions ON public.submissions;
DROP POLICY IF EXISTS deny_delete_submissions ON public.submissions;

-- Step 3: Create RLS policies
-- Allow INSERT for both authenticated and anonymous users (required for app)
CREATE POLICY "Allow public INSERT" ON public.submissions
    FOR INSERT
    WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- Allow SELECT for public read access (for viewing stats)
CREATE POLICY "Allow public SELECT" ON public.submissions
    FOR SELECT
    USING (true);

-- Deny UPDATE operations (immutable data)
CREATE POLICY "Deny UPDATE" ON public.submissions
    FOR UPDATE
    USING (false);

-- Deny DELETE operations (no deletions allowed)
CREATE POLICY "Deny DELETE" ON public.submissions
    FOR DELETE
    USING (false);

-- Step 4: Verify RLS is enabled
-- This query should return: 'true' for relrowsecurity column
SELECT 
    schemaname,
    tablename,
    relrowsecurity as rls_enabled,
    relpermissive as rls_policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'submissions';

-- Step 5: Test the policies
-- This INSERT should succeed (returns 1 row created)
-- INSERT INTO public.submissions (name, activity_type, activity_data)
-- VALUES ('RLS Test', 'guestbook', '{"test": true}'::jsonb);

-- This SELECT should succeed (returns rows)
-- SELECT COUNT(*) FROM public.submissions;

-- This UPDATE should fail (returns 0 rows affected)
-- UPDATE public.submissions SET name = 'Hacked' WHERE id = 1;

-- This DELETE should fail (returns 0 rows affected)  
-- DELETE FROM public.submissions WHERE id = 1;

-- ============================================================================
-- Verification: Run these queries to confirm RLS is working
-- ============================================================================

-- Query 1: Check RLS is enabled
-- Expected: rls_enabled = true
SELECT 'RLS Enabled: ' || CASE WHEN relrowsecurity THEN '✓ YES' ELSE '✗ NO' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'submissions';

-- Query 2: List all policies on submissions table
-- Expected: 4 policies (INSERT, SELECT, UPDATE, DELETE)
SELECT 
    policyname,
    op,
    CASE 
        WHEN forcmd = 'INSERT' THEN '✓ Allow'
        WHEN forcmd = 'SELECT' THEN '✓ Allow'
        ELSE '✗ Deny'
    END as access
FROM pg_policies 
WHERE tablename = 'submissions'
ORDER BY op;

-- ============================================================================
-- NOTE: After running this SQL, test the application:
-- 1. Submit a guestbook entry - should succeed
-- 2. Check that error dialog no longer appears
-- 3. Verify data appears in database
-- 4. Verify real-time updates work
-- ============================================================================
