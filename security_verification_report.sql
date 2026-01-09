-- Security Verification Script for Baby Shower Database
-- This script verifies that the critical security issues have been resolved

-- ============================================
-- SECURITY VERIFICATION REPORT
-- ============================================

-- 1. Check that advice table no longer has permissive public insert policy
SELECT 'ADVICE TABLE SECURITY' as check_type,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_policies 
                      WHERE schemaname = 'baby_shower' 
                      AND tablename = 'advice' 
                      AND cmd = 'INSERT' 
                      AND roles @> '{public}') 
         THEN 'FAIL - Still has public insert policy'
         ELSE 'PASS - No public insert policy found'
       END as status,
       'Advice table should only allow authenticated users to insert' as description;

-- 2. Check that who_would_rather_sessions requires authentication
SELECT 'WHO_WOULD_RATHER_SESSIONS SECURITY' as check_type,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_policies 
                      WHERE schemaname = 'baby_shower' 
                      AND tablename = 'who_would_rather_sessions' 
                      AND cmd = 'INSERT' 
                      AND roles @> '{authenticated}') 
         THEN 'PASS - Requires authentication'
         ELSE 'FAIL - Does not require authentication'
       END as status,
       'Who would rather sessions should require authentication' as description;

-- 3. Check that who_would_rather_votes requires authentication
SELECT 'WHO_WOULD_RATHER_VOTES SECURITY' as check_type,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_policies 
                      WHERE schemaname = 'baby_shower' 
                      AND tablename = 'who_would_rather_votes' 
                      AND cmd = 'INSERT' 
                      AND roles @> '{authenticated}') 
         THEN 'PASS - Requires authentication'
         ELSE 'FAIL - Does not require authentication'
       END as status,
       'Who would rather votes should require authentication' as description;

-- 4. Check view permissions are properly restricted
SELECT 'VIEW PERMISSIONS SECURITY' as check_type,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_class c
                      JOIN pg_namespace n ON n.oid = c.relnamespace
                      WHERE n.nspname = 'public'
                      AND c.relkind = 'v'
                      AND c.relacl::text LIKE '%anon=arwdDxtm%') 
         THEN 'FAIL - Views have excessive anon permissions'
         ELSE 'PASS - Views properly restricted'
       END as status,
       'Public views should not have excessive permissions' as description;

-- 5. Check for rate limiting policies
SELECT 'RATE LIMITING SECURITY' as check_type,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_policies 
                      WHERE schemaname = 'baby_shower' 
                      AND tablename = 'advice' 
                      AND policyname LIKE '%Rate limit%') 
         THEN 'PASS - Rate limiting in place'
         ELSE 'FAIL - No rate limiting found'
       END as status,
       'Advice table should have rate limiting' as description;

-- 6. Summary of security policies by table
SELECT schemaname, tablename, policyname, roles, cmd,
       CASE 
         WHEN roles @> '{public}' AND cmd = 'INSERT' AND with_check = 'true' 
         THEN 'CRITICAL - Permissive public insert'
         WHEN roles @> '{authenticated}' AND cmd = 'INSERT' 
         THEN 'SECURE - Authenticated insert'
         WHEN roles @> '{public}' AND cmd = 'SELECT' 
         THEN 'READ - Public read access'
         ELSE 'OTHER'
       END as security_level
FROM pg_policies 
WHERE schemaname = 'baby_shower'
  AND tablename IN ('advice', 'who_would_rather_sessions', 'who_would_rather_votes')
ORDER BY tablename, policyname;

-- 7. Check view permissions summary
SELECT n.nspname as schema_name, 
       c.relname as view_name,
       CASE 
         WHEN c.relacl::text LIKE '%anon=r%' THEN 'Anon can read'
         WHEN c.relacl::text LIKE '%authenticated=r%' THEN 'Auth can read'
         ELSE 'Restricted access'
       END as access_level
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
ORDER BY c.relname;

-- ============================================
-- FINAL SECURITY STATUS
-- ============================================

SELECT 
  CASE 
    WHEN (
      -- Check advice table security
      NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE schemaname = 'baby_shower' 
                  AND tablename = 'advice' 
                  AND cmd = 'INSERT' 
                  AND roles @> '{public}'
                  AND with_check = 'true')
      AND
      -- Check who_would_rather_sessions security  
      EXISTS (SELECT 1 FROM pg_policies 
              WHERE schemaname = 'baby_shower' 
              AND tablename = 'who_would_rather_sessions' 
              AND cmd = 'INSERT' 
              AND roles @> '{authenticated}')
      AND
      -- Check who_would_rather_votes security
      EXISTS (SELECT 1 FROM pg_policies 
              WHERE schemaname = 'baby_shower' 
              AND tablename = 'who_would_rather_votes' 
              AND cmd = 'INSERT' 
              AND roles @> '{authenticated}')
      AND
      -- Check view permissions are restricted
      NOT EXISTS (SELECT 1 FROM pg_class c
                  JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE n.nspname = 'public'
                  AND c.relkind = 'v'
                  AND c.relacl::text LIKE '%anon=arwdDxtm%')
    ) THEN 'ALL CRITICAL SECURITY ISSUES RESOLVED'
    ELSE 'SECURITY ISSUES STILL EXIST'
  END as final_security_status;