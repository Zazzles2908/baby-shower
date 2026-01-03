-- Security Fix: Remove SECURITY DEFINER from views
-- This migration drops and recreates all views to remove SECURITY DEFINER
-- Addressing Supabase linter errors for 14 Security Definer Views

-- Drop existing views in baby_shower schema (with CASCADE to handle dependencies)
DROP VIEW IF EXISTS baby_shower.quiz_entries CASCADE;
DROP VIEW IF EXISTS baby_shower.advice_entries CASCADE;
DROP VIEW IF EXISTS baby_shower.submissions_count CASCADE;
DROP VIEW IF EXISTS baby_shower.guestbook_entries CASCADE;
DROP VIEW IF EXISTS baby_shower.vote_counts CASCADE;
DROP VIEW IF EXISTS baby_shower.pool_entries CASCADE;

-- Drop existing views in public schema (with CASCADE to handle dependencies)
DROP VIEW IF EXISTS public.quiz_results_v CASCADE;
DROP VIEW IF EXISTS public.advice_v CASCADE;
DROP VIEW IF EXISTS public.guestbook_v CASCADE;
DROP VIEW IF EXISTS public.votes_v CASCADE;
DROP VIEW IF EXISTS public.votes CASCADE;
DROP VIEW IF EXISTS public.submissions_v CASCADE;
DROP VIEW IF EXISTS public.vote_counts_v CASCADE;
DROP VIEW IF EXISTS public.pool_predictions_v CASCADE;

-- Recreate baby_shower schema views (without SECURITY DEFINER)
CREATE OR REPLACE VIEW baby_shower.quiz_entries AS
SELECT id, created_at, name, activity_type, activity_data
FROM baby_shower.submissions
WHERE activity_type = 'quiz'::text
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW baby_shower.advice_entries AS
SELECT id, created_at, name, activity_type, activity_data
FROM baby_shower.submissions
WHERE activity_type = 'advice'::text
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW baby_shower.guestbook_entries AS
SELECT id, created_at, name, activity_type, activity_data
FROM baby_shower.submissions
WHERE activity_type = 'guestbook'::text
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW baby_shower.pool_entries AS
SELECT id, created_at, name, activity_type, activity_data
FROM baby_shower.submissions
WHERE activity_type = 'pool'::text
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW baby_shower.submissions_count AS
SELECT activity_type, count(*) AS total,
       min(created_at) AS first_submission,
       max(created_at) AS last_submission
FROM baby_shower.submissions
GROUP BY activity_type;

CREATE OR REPLACE VIEW baby_shower.vote_counts AS
SELECT jsonb_array_elements_text((activity_data -> 'names'::text)) AS baby_name,
       count(*) AS vote_count
FROM baby_shower.submissions
WHERE (activity_type = 'voting'::text)
GROUP BY (jsonb_array_elements_text((activity_data -> 'names'::text)))
ORDER BY (count(*)) DESC;

-- Recreate public schema views (without SECURITY DEFINER)
CREATE OR REPLACE VIEW public.quiz_results_v AS
SELECT id, participant_name, answers, score, total_questions, percentage,
       submitted_by, created_at
FROM baby_shower.quiz_results;

CREATE OR REPLACE VIEW public.advice_v AS
SELECT id, advice_giver, advice_text, delivery_option, is_approved,
       ai_generated, submitted_by, created_at
FROM baby_shower.advice;

CREATE OR REPLACE VIEW public.guestbook_v AS
SELECT id, guest_name, relationship, message, submitted_by, created_at
FROM baby_shower.guestbook;

CREATE OR REPLACE VIEW public.votes_v AS
SELECT id, voter_name, selected_names, submitted_by, created_at
FROM baby_shower.votes;

CREATE OR REPLACE VIEW public.votes AS
SELECT id, voter_name, selected_names, submitted_by, created_at
FROM baby_shower.votes;

CREATE OR REPLACE VIEW public.submissions_v AS
SELECT id, created_at, name, activity_type, activity_data, message,
       advice_type, date_guess, time_guess, weight_guess, length_guess,
       puzzle1, puzzle2, puzzle3, puzzle4, puzzle5, score, selected_names,
       photo_url, relationship
FROM baby_shower.submissions;

CREATE OR REPLACE VIEW public.vote_counts_v AS
SELECT baby_name, vote_count
FROM baby_shower.vote_counts;

CREATE OR REPLACE VIEW public.pool_predictions_v AS
SELECT id, predictor_name, gender, birth_date, weight_kg, length_cm,
       hair_color, eye_color, personality, submitted_by, created_at
FROM baby_shower.pool_predictions;

-- Verify the views were created successfully
SELECT 'baby_shower' AS schema_name, viewname FROM pg_views WHERE schemaname = 'baby_shower'
UNION ALL
SELECT 'public' AS schema_name, viewname FROM pg_views WHERE schemaname = 'public'
AND viewname IN ('quiz_results_v', 'advice_v', 'guestbook_v', 'votes_v', 'votes',
                 'submissions_v', 'vote_counts_v', 'pool_predictions_v')
ORDER BY schema_name, viewname;

COMMENT ON VIEW baby_shower.quiz_entries IS 'Quiz submissions from baby_shower.submissions';
COMMENT ON VIEW baby_shower.advice_entries IS 'Advice submissions from baby_shower.submissions';
COMMENT ON VIEW baby_shower.guestbook_entries IS 'Guestbook submissions from baby_shower.submissions';
COMMENT ON VIEW baby_shower.pool_entries IS 'Pool submissions from baby_shower.submissions';
COMMENT ON VIEW baby_shower.submissions_count IS 'Count of submissions by activity type';
COMMENT ON VIEW baby_shower.vote_counts IS 'Vote counts for baby names';
COMMENT ON VIEW public.quiz_results_v IS 'Quiz results from baby_shower schema';
COMMENT ON VIEW public.advice_v IS 'Advice entries from baby_shower schema';
COMMENT ON VIEW public.guestbook_v IS 'Guestbook entries from baby_shower schema';
COMMENT ON VIEW public.votes_v IS 'Votes from baby_shower schema';
COMMENT ON VIEW public.votes IS 'Votes from baby_shower schema';
COMMENT ON VIEW public.submissions_v IS 'All submissions from baby_shower schema';
COMMENT ON VIEW public.vote_counts_v IS 'Vote counts from baby_shower schema';
COMMENT ON VIEW public.pool_predictions_v IS 'Pool predictions from baby_shower schema';
