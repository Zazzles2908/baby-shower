-- This SQL creates a stored procedure to update the vote function
-- Run this in Supabase SQL Editor

-- First, let's check what version of the function is currently deployed
SELECT 
  function_name, 
  version, 
  updated_at
FROM pg_proc 
WHERE proname = 'vote';

-- The actual update needs to be done via Supabase CLI or Dashboard
-- But we can verify the database connection is working
SELECT 
  'baby_shower.votes' as table_name,
  COUNT(*) as record_count
FROM baby_shower.votes;
