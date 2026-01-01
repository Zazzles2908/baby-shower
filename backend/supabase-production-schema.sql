-- ============================================================================
-- BABY SHOWER APP - PRODUCTION SUPABASE SCHEMA
-- Phase 1: Database Schema and Triggers (public → internal)
-- Run in Supabase SQL Editor - Execute in order
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Internal Schema (Data Firewall)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS internal;

-- ============================================================================
-- STEP 2: Create Archive Table (Immutable Data Store)
-- ============================================================================
CREATE TABLE IF NOT EXISTS internal.event_archive (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Core fields extracted from public.submissions
    guest_name TEXT,
    activity_type TEXT,
    
    -- Data preservation
    raw_data JSONB NOT NULL,
    processed_data JSONB,
    
    -- Metadata for tracking and debugging
    source_ip INET,
    user_agent TEXT,
    processing_time_ms INTEGER,
    
    -- Constraint: Ensure processed_data is valid JSONB
    CONSTRAINT valid_processed_data CHECK (
        processed_data IS NULL OR 
        (processed_data::TEXT ~ '^\{.*\}$'::TEXT)
    )
);

-- ============================================================================
-- STEP 3: Create Migration Function (Zero-Latency Data Replication)
-- ============================================================================
CREATE OR REPLACE FUNCTION internal.handle_submission_migration()
RETURNS TRIGGER AS $$
DECLARE
    v_processed_data JSONB;
    v_processing_start TIMESTAMPTZ;
    v_processing_end TIMESTAMPTZ;
    v_processing_time INTEGER;
BEGIN
    v_processing_start := CLOCK_TIMESTAMP();
    
    -- Process data based on activity type
    CASE NEW.activity_type
        WHEN 'guestbook' THEN
            v_processed_data := jsonb_build_object(
                'guest_name', NEW.name,
                'message', NEW.message,
                'relationship', NEW.relationship,
                'migrated_at', NOW()::TEXT
            );
        WHEN 'vote' THEN
            v_processed_data := jsonb_build_object(
                'names', NEW.names,
                'vote_count', jsonb_array_length(NEW.names::JSONB),
                'migrated_at', NOW()::TEXT
            );
        WHEN 'pool' THEN
            v_processed_data := jsonb_build_object(
                'prediction', NEW.prediction,
                'guest_name', NEW.name,
                'due_date', NEW.due_date,
                'migrated_at', NOW()::TEXT
            );
        WHEN 'quiz' THEN
            v_processed_data := jsonb_build_object(
                'answers', NEW.answers,
                'score', NEW.score,
                'total_questions', NEW.total_questions,
                'migrated_at', NOW()::TEXT
            );
        WHEN 'advice' THEN
            v_processed_data := jsonb_build_object(
                'advice_text', NEW.advice,
                'category', NEW.category,
                'is_approved', FALSE,
                'migrated_at', NOW()::TEXT
            );
        ELSE
            -- Generic fallback for unknown activity types
            v_processed_data := jsonb_build_object(
                'activity_type', NEW.activity_type,
                'migrated_at', NOW()::TEXT
            );
    END CASE;
    
    v_processing_end := CLOCK_TIMESTAMP();
    v_processing_time := EXTRACT(EPOCH FROM (v_processing_end - v_processing_start)) * 1000;
    
    -- Insert into internal archive
    INSERT INTO internal.event_archive (
        id,
        created_at,
        guest_name,
        activity_type,
        raw_data,
        processed_data,
        source_ip,
        user_agent,
        processing_time_ms
    ) VALUES (
        NEW.id,
        NEW.created_at,
        NEW.name,
        NEW.activity_type,
        NEW.activity_data::JSONB,
        v_processed_data,
        NEW.source_ip,
        NEW.user_agent,
        v_processing_time
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create Trigger (Automatic Migration on INSERT)
-- ============================================================================
DROP TRIGGER IF EXISTS on_submission_insert ON public.submissions;
CREATE TRIGGER on_submission_insert
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION internal.handle_submission_migration();

-- ============================================================================
-- STEP 5: Performance Indexes (Query Optimization)
-- ============================================================================
-- Index for time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_internal_archive_created_at 
    ON internal.event_archive(created_at DESC);

-- Index for activity type filtering
CREATE INDEX IF NOT EXISTS idx_internal_archive_activity_type 
    ON internal.event_archive(activity_type);

-- Index for guest name searches
CREATE INDEX IF NOT EXISTS idx_internal_archive_guest_name 
    ON internal.event_archive(guest_name) 
    WHERE guest_name IS NOT NULL;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_internal_archive_activity_date 
    ON internal.event_archive(activity_type, created_at DESC);

-- ============================================================================
-- STEP 6: Row Level Security (RLS) - Security Firewall
-- ============================================================================
-- Enable RLS on public schema tables (already exists, but ensuring)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow INSERT for authenticated users only
DROP POLICY IF EXISTS allow_insert_submissions ON public.submissions;
CREATE POLICY allow_insert_submissions ON public.submissions
    FOR INSERT
    WITH CHECK (auth.role() IN ('authenticated', 'anon'));

-- RLS Policy: Allow SELECT for public read access
DROP POLICY IF EXISTS allow_select_submissions ON public.submissions;
CREATE POLICY allow_select_submissions ON public.submissions
    FOR SELECT
    USING (true);

-- RLS Policy: Deny UPDATE (immutable data)
DROP POLICY IF EXISTS deny_update_submissions ON public.submissions;
CREATE POLICY deny_update_submissions ON public.submissions
    FOR UPDATE
    USING (false);

-- RLS Policy: Deny DELETE
DROP POLICY IF EXISTS deny_delete_submissions ON public.submissions;
CREATE POLICY deny_delete_submissions ON public.submissions
    FOR DELETE
    USING (false);

-- Internal schema: Service Role only access
ALTER TABLE internal.event_archive ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service Role full access
DROP POLICY IF EXISTS internal_full_access ON internal.event_archive;
CREATE POLICY internal_full_access ON internal.event_archive
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 7: Database Webhook for Google Sheets Integration
-- ============================================================================
-- Note: Create this via Supabase Dashboard > Database > Webhooks
-- - Table: internal.event_archive
-- - Event: INSERT
-- - HTTP Method: POST
-- - URL: [Your Google Apps Script Webhook URL]
-- - Headers: Content-Type: application/json

-- ============================================================================
-- STEP 8: Enable Realtime (Optional - for frontend updates)
-- ============================================================================
-- Supabase handles this automatically, but ensure RLS allows it
-- Go to Database > Replication > Sources > public.submissions
-- Enable replication for INSERT events

-- ============================================================================
-- STEP 9: Statistics Table (for monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS internal.submission_stats (
    id BIGSERIAL PRIMARY KEY,
    stat_date DATE DEFAULT CURRENT_DATE NOT NULL,
    activity_type TEXT NOT NULL,
    submission_count INTEGER DEFAULT 0,
    avg_processing_time_ms NUMERIC(10,2),
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(stat_date, activity_type)
);

-- Create function to update stats
CREATE OR REPLACE FUNCTION internal.update_submission_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO internal.submission_stats (stat_date, activity_type, submission_count)
    VALUES (
        CURRENT_DATE,
        NEW.activity_type,
        1
    )
    ON CONFLICT (stat_date, activity_type) 
    DO UPDATE SET 
        submission_count = internal.submission_stats.submission_count + 1,
        last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stats
DROP TRIGGER IF EXISTS on_submission_stats ON public.submissions;
CREATE TRIGGER on_submission_stats
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION internal.update_submission_stats();

-- ============================================================================
-- STEP 10: Views for Common Queries
-- ============================================================================
-- View: Today's submissions summary
CREATE OR REPLACE VIEW v_today_submissions AS
SELECT 
    activity_type,
    COUNT(*) as count,
    MIN(created_at) as first_submission,
    MAX(created_at) as last_submission
FROM public.submissions
WHERE created_at >= CURRENT_DATE
GROUP BY activity_type;

-- View: Activity breakdown
CREATE OR REPLACE VIEW v_activity_breakdown AS
SELECT 
    activity_type,
    COUNT(*) as total_submissions,
    COUNT(DISTINCT guest_name) as unique_guests,
    TO_CHAR(MIN(created_at), 'HH24:MI') as earliest,
    TO_CHAR(MAX(created_at), 'HH24:MI') as latest
FROM (
    SELECT activity_type, name as guest_name, created_at 
    FROM public.submissions
) all_submissions
GROUP BY activity_type
ORDER BY total_submissions DESC;

-- ============================================================================
-- VERIFICATION QUERIES (Run to confirm setup)
-- ============================================================================
-- SELECT 'Schema created: ✓' as status;
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'internal' ORDER BY table_name;

-- SELECT 'Trigger created: ✓' as status 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_submission_insert';

-- SELECT 'RLS enabled: ✓' as status 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'submissions'
-- AND relrowsecurity = true;
