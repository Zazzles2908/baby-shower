-- ============================================================================
-- BABY SHOWER APP - DATA MIGRATION SCRIPT
-- Migration: Migrate data from baby_shower.submissions to baby_shower multi-table schema
-- Project: bkszmvfsfgvdwzacgmfz
-- Date: 2025-01-02
-- ============================================================================

-- IMPORTANT: Run this AFTER creating the multi-table schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- ============================================
-- STEP 1: BACKFILL EXISTING DATA
-- ============================================

-- Migrate guestbook entries
INSERT INTO baby_shower.guestbook (
    id, guest_name, relationship, message, submitted_by, created_at
)
SELECT 
    s.id,
    COALESCE(s.activity_data->>'name', s.name),
    COALESCE(s.relationship, 'other'),
    COALESCE(s.activity_data->>'message', s.message, ''),
    s.name,
    s.created_at
FROM baby_shower.submissions s
WHERE s.activity_type = 'guestbook'
ON CONFLICT (id) DO NOTHING;

-- Migrate voting entries (handles both 'vote' and 'voting' activity types)
INSERT INTO baby_shower.votes (
    id, voter_name, selected_names, submitted_by, created_at
)
SELECT 
    s.id,
    s.name,
    COALESCE(s.activity_data->'names', s.selected_names::JSONB, '[]'::JSONB),
    s.name,
    s.created_at
FROM baby_shower.submissions s
WHERE s.activity_type IN ('vote', 'voting')
ON CONFLICT (id) DO NOTHING;

-- Migrate pool predictions (handles both 'pool' and 'baby_pool' activity types)
INSERT INTO baby_shower.pool_predictions (
    id, predictor_name, gender, birth_date, weight_kg, length_cm,
    hair_color, eye_color, personality, submitted_by, created_at
)
SELECT 
    s.id,
    s.name,
    COALESCE(s.activity_data->>'gender', 'surprise'),
    COALESCE(s.date_guess::TEXT, s.activity_data->>'dueDate', CURRENT_DATE::TEXT)::DATE,
    COALESCE(s.weight_guess, (s.activity_data->>'weight')::NUMERIC, 3.5),
    COALESCE(s.length_guess, (s.activity_data->>'length')::INTEGER, 50),
    s.activity_data->>'hairColor',
    s.activity_data->>'eyeColor',
    s.activity_data->>'personality',
    s.name,
    s.created_at
FROM baby_shower.submissions s
WHERE s.activity_type IN ('baby_pool', 'pool')
ON CONFLICT (id) DO NOTHING;

-- Migrate quiz results
INSERT INTO baby_shower.quiz_results (
    id, participant_name, answers, score, total_questions, percentage, submitted_by, created_at
)
SELECT 
    s.id,
    s.name,
    COALESCE(s.activity_data->'answers', 
        JSONB_BUILD_OBJECT(
            'puzzle1', s.puzzle1,
            'puzzle2', s.puzzle2,
            'puzzle3', s.puzzle3,
            'puzzle4', s.puzzle4,
            'puzzle5', s.puzzle5
        )),
    COALESCE(s.score, (s.activity_data->>'score')::INTEGER, 0),
    5,
    CASE 
        WHEN s.score IS NOT NULL THEN (s.score::NUMERIC / 5 * 100)::INTEGER
        ELSE NULL
    END,
    s.name,
    s.created_at
FROM baby_shower.submissions s
WHERE s.activity_type = 'quiz'
ON CONFLICT (id) DO NOTHING;

-- Migrate advice entries
INSERT INTO baby_shower.advice (
    id, advice_giver, advice_text, delivery_option, is_approved, ai_generated, submitted_by, created_at
)
SELECT 
    s.id,
    s.name,
    COALESCE(s.activity_data->>'advice', s.message, ''),
    CASE 
        WHEN s.advice_type ILIKE '%baby%' THEN 'time_capsule'
        ELSE 'immediate'
    END,
    false,
    false,
    s.name,
    s.created_at
FROM baby_shower.submissions s
WHERE s.activity_type = 'advice'
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: TRIGGER FOR FUTURE DATA
-- ============================================

CREATE OR REPLACE FUNCTION internal.handle_submission_migration()
RETURNS TRIGGER AS $$
DECLARE
    v_activity_type TEXT;
    v_activity_data JSONB;
BEGIN
    v_activity_type := NEW.activity_type;
    v_activity_data := NEW.activity_data::JSONB;
    
    CASE v_activity_type
        WHEN 'guestbook' THEN
            INSERT INTO baby_shower.guestbook (id, guest_name, relationship, message, submitted_by, created_at)
            VALUES (NEW.id, COALESCE(v_activity_data->>'name', NEW.name), COALESCE(NEW.relationship, 'other'), COALESCE(v_activity_data->>'message', NEW.message, ''), NEW.name, NEW.created_at);
        WHEN 'vote', 'voting' THEN
            INSERT INTO baby_shower.votes (id, voter_name, selected_names, submitted_by, created_at)
            VALUES (NEW.id, NEW.name, COALESCE(v_activity_data->'names', NEW.selected_names::JSONB, '[]'::JSONB), NEW.name, NEW.created_at);
        WHEN 'baby_pool', 'pool' THEN
            INSERT INTO baby_shower.pool_predictions (id, predictor_name, gender, birth_date, weight_kg, length_cm, hair_color, eye_color, personality, submitted_by, created_at)
            VALUES (NEW.id, NEW.name, COALESCE(v_activity_data->>'gender', 'surprise'), COALESCE(NEW.date_guess::TEXT, v_activity_data->>'dueDate', CURRENT_DATE::TEXT)::DATE, COALESCE(NEW.weight_guess, (v_activity_data->>'weight')::NUMERIC, 3.5), COALESCE(NEW.length_guess, (v_activity_data->>'length')::INTEGER, 50), v_activity_data->>'hairColor', v_activity_data->>'eyeColor', v_activity_data->>'personality', NEW.name, NEW.created_at);
        WHEN 'quiz' THEN
            INSERT INTO baby_shower.quiz_results (id, participant_name, answers, score, total_questions, percentage, submitted_by, created_at)
            VALUES (NEW.id, NEW.name, COALESCE(v_activity_data->'answers', JSONB_BUILD_OBJECT('puzzle1', NEW.puzzle1, 'puzzle2', NEW.puzzle2, 'puzzle3', NEW.puzzle3, 'puzzle4', NEW.puzzle4, 'puzzle5', NEW.puzzle5)), COALESCE(NEW.score, (v_activity_data->>'score')::INTEGER, 0), 5, CASE WHEN NEW.score IS NOT NULL THEN (NEW.score::NUMERIC / 5 * 100)::INTEGER ELSE NULL END, NEW.name, NEW.created_at);
        WHEN 'advice' THEN
            INSERT INTO baby_shower.advice (id, advice_giver, advice_text, delivery_option, is_approved, ai_generated, submitted_by, created_at)
            VALUES (NEW.id, NEW.name, COALESCE(v_activity_data->>'advice', NEW.message, ''), CASE WHEN NEW.advice_type ILIKE '%baby%' THEN 'time_capsule' ELSE 'immediate' END, false, false, NEW.name, NEW.created_at);
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: VERIFICATION QUERY
-- ============================================

SELECT 'Guestbook' as table_name, COUNT(*) as record_count FROM baby_shower.guestbook
UNION ALL SELECT 'Votes', COUNT(*) FROM baby_shower.votes
UNION ALL SELECT 'Pool Predictions', COUNT(*) FROM baby_shower.pool_predictions
UNION ALL SELECT 'Quiz Results', COUNT(*) FROM baby_shower.quiz_results
UNION ALL SELECT 'Advice', COUNT(*) FROM baby_shower.advice;

SELECT 'Data migration completed successfully' as result;
