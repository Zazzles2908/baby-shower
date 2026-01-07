


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "baby_shower";


ALTER SCHEMA "baby_shower" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "internal";


ALTER SCHEMA "internal" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "baby_shower"."calculate_vote_stats"("scenario_id" "uuid") RETURNS TABLE("mom_count" bigint, "dad_count" bigint, "total_votes" bigint, "mom_percentage" numeric, "dad_percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN vote_choice = 'mom' THEN 1 END)::BIGINT as mom_count,
        COUNT(CASE WHEN vote_choice = 'dad' THEN 1 END)::BIGINT as dad_count,
        COUNT(*)::BIGINT as total_votes,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN vote_choice = 'mom' THEN 1 END)::DECIMAL / COUNT(*) * 100)
            ELSE 0 
        END as mom_percentage,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN vote_choice = 'dad' THEN 1 END)::DECIMAL / COUNT(*) * 100)
            ELSE 0 
        END as dad_percentage
    FROM baby_shower.game_votes
    WHERE scenario_id = baby_shower.calculate_vote_stats.scenario_id;
END;
$$;


ALTER FUNCTION "baby_shower"."calculate_vote_stats"("scenario_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."check_voting_complete"("scenario_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    vote_count INTEGER;
    guest_count INTEGER;
BEGIN
    -- Count total votes
    SELECT COUNT(*) INTO vote_count 
    FROM baby_shower.game_votes 
    WHERE scenario_id = check_voting_complete.scenario_id;
    
    -- Could add logic to check if all guests have voted
    -- For now, just return true if at least 1 vote
    RETURN vote_count >= 1;
END;
$$;


ALTER FUNCTION "baby_shower"."check_voting_complete"("scenario_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."generate_admin_code"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    code VARCHAR(10) := '';
BEGIN
    FOR i IN 1..4 LOOP
        code := code || floor(random() * 10)::int::text;
    END LOOP;
    RETURN code;
END;
$$;


ALTER FUNCTION "baby_shower"."generate_admin_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."generate_session_code"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Removed confusing chars
    code VARCHAR(8) := '';
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Ensure uniqueness
    IF EXISTS (SELECT 1 FROM baby_shower.game_sessions WHERE session_code = code) THEN
        code := baby_shower.generate_session_code();
    END IF;
    
    RETURN code;
END;
$$;


ALTER FUNCTION "baby_shower"."generate_session_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."get_health"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN json_build_object(
    'status', 'healthy',
    'submissions', (SELECT COUNT(*) FROM baby_shower.submissions)
  );
END;
$$;


ALTER FUNCTION "baby_shower"."get_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."get_stats"() RETURNS TABLE("counts" json)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'guestbook', COUNT(*) FILTER (WHERE activity_type = 'guestbook'),
    'pool', COUNT(*) FILTER (WHERE activity_type = 'pool'),
    'quiz', COUNT(*) FILTER (WHERE activity_type = 'quiz'),
    'advice', COUNT(*) FILTER (WHERE activity_type = 'advice'),
    'voting', COUNT(*) FILTER (WHERE activity_type = 'voting')
  );
END;
$$;


ALTER FUNCTION "baby_shower"."get_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."get_stats_java"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN json_build_object(
    'guestbook', (SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'guestbook'),
    'pool', (SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'pool'),
    'quiz', (SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'quiz'),
    'advice', (SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'advice'),
    'votes', (SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'voting')
  );
END;
$$;


ALTER FUNCTION "baby_shower"."get_stats_java"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."get_submissions_count"() RETURNS TABLE("activity_type" "text", "total" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY 
  SELECT s.activity_type, COUNT(*)::BIGINT as total
  FROM baby_shower.submissions s
  GROUP BY s.activity_type;
END;
$$;


ALTER FUNCTION "baby_shower"."get_submissions_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."get_vote_counts"() RETURNS TABLE("baby_name" "text", "vote_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY 
  SELECT vc.baby_name, vc.vote_count::BIGINT
  FROM baby_shower.vote_counts vc;
END;
$$;


ALTER FUNCTION "baby_shower"."get_vote_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."handle_submission_migration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_processed_data JSONB;
BEGIN
    -- Process data based on activity type
    CASE NEW.activity_type
        WHEN 'guestbook' THEN
            v_processed_data := jsonb_build_object(
                'guest_name', NEW.name,
                'message', NEW.activity_data->>'message',
                'relationship', NEW.activity_data->>'relationship',
                'migrated_at', NOW()::TEXT
            );
        WHEN 'baby_pool' THEN
            v_processed_data := jsonb_build_object(
                'guest_name', NEW.name,
                'dateGuess', NEW.activity_data->>'dateGuess',
                'timeGuess', NEW.activity_data->>'timeGuess',
                'weightGuess', (NEW.activity_data->>'weightGuess')::numeric,
                'lengthGuess', (NEW.activity_data->>'lengthGuess')::integer,
                'migrated_at', NOW()::TEXT
            );
        WHEN 'quiz' THEN
            v_processed_data := jsonb_build_object(
                'guest_name', NEW.name,
                'puzzle1', NEW.activity_data->>'puzzle1',
                'puzzle2', NEW.activity_data->>'puzzle2',
                'puzzle3', NEW.activity_data->>'puzzle3',
                'puzzle4', NEW.activity_data->>'puzzle4',
                'puzzle5', NEW.activity_data->>'puzzle5',
                'migrated_at', NOW()::TEXT
            );
        WHEN 'advice' THEN
            v_processed_data := jsonb_build_object(
                'guest_name', NEW.name,
                'adviceType', NEW.activity_data->>'adviceType',
                'message', NEW.activity_data->>'message',
                'migrated_at', NOW()::TEXT
            );
        WHEN 'voting' THEN
            v_processed_data := jsonb_build_object(
                'guest_name', NEW.name,
                'names', NEW.activity_data->'names',
                'vote_count', NEW.activity_data->>'vote_count',
                'migrated_at', NOW()::TEXT
            );
        ELSE
            v_processed_data := jsonb_build_object(
                'activity_type', NEW.activity_type,
                'migrated_at', NOW()::TEXT
            );
    END CASE;
    
    -- Insert into internal archive
    INSERT INTO internal.event_archive (
        id,
        created_at,
        guest_name,
        activity_type,
        raw_data,
        processed_data
    ) VALUES (
        NEW.id,
        NEW.created_at,
        NEW.name,
        NEW.activity_type,
        NEW.activity_data,
        v_processed_data
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "baby_shower"."handle_submission_migration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."health"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN json_build_object(
    'status', 'healthy',
    'api', 'connected',
    'db', 'connected',
    'submissions', (SELECT COUNT(*) FROM baby_shower.submissions)
  );
END;
$$;


ALTER FUNCTION "baby_shower"."health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."health_check"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN json_build_object(
    'timestamp', NOW(),
    'submissions_count', (SELECT COUNT(*) FROM baby_shower.submissions),
    'public_count', (SELECT COUNT(*) FROM public.submissions)
  );
END;
$$;


ALTER FUNCTION "baby_shower"."health_check"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."insert_advice"("p_advice_giver" "text", "p_advice_text" "text", "p_delivery_option" "text", "p_is_approved" boolean, "p_ai_generated" boolean, "p_submitted_by" "text") RETURNS TABLE("id" bigint, "advice_giver" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    INSERT INTO baby_shower.advice (
        advice_giver, advice_text, delivery_option, is_approved, ai_generated, submitted_by
    )
    VALUES (
        p_advice_giver, p_advice_text, p_delivery_option, p_is_approved, p_ai_generated, p_submitted_by
    )
    RETURNING baby_shower.advice.id, 
              baby_shower.advice.advice_giver, 
              baby_shower.advice.created_at;
END;
$$;


ALTER FUNCTION "baby_shower"."insert_advice"("p_advice_giver" "text", "p_advice_text" "text", "p_delivery_option" "text", "p_is_approved" boolean, "p_ai_generated" boolean, "p_submitted_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."insert_pool_prediction"("p_predictor_name" "text", "p_gender" "text", "p_birth_date" "date", "p_prediction" "text", "p_weight_kg" numeric, "p_length_cm" integer, "p_hair_color" "text", "p_eye_color" "text", "p_personality" "text", "p_submitted_by" "text") RETURNS TABLE("id" bigint, "predictor_name" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    INSERT INTO baby_shower.pool_predictions (
        predictor_name, gender, birth_date, prediction, weight_kg, length_cm,
        hair_color, eye_color, personality, submitted_by
    )
    VALUES (
        p_predictor_name, p_gender, p_birth_date, p_prediction, p_weight_kg, p_length_cm,
        p_hair_color, p_eye_color, p_personality, p_submitted_by
    )
    RETURNING baby_shower.pool_predictions.id, 
              baby_shower.pool_predictions.predictor_name, 
              baby_shower.pool_predictions.created_at;
END;
$$;


ALTER FUNCTION "baby_shower"."insert_pool_prediction"("p_predictor_name" "text", "p_gender" "text", "p_birth_date" "date", "p_prediction" "text", "p_weight_kg" numeric, "p_length_cm" integer, "p_hair_color" "text", "p_eye_color" "text", "p_personality" "text", "p_submitted_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."insert_quiz_result"("p_participant_name" "text", "p_answers" "jsonb", "p_score" integer, "p_total_questions" integer, "p_percentage" integer, "p_submitted_by" "text", "p_puzzle1" "text", "p_puzzle2" "text", "p_puzzle3" "text", "p_puzzle4" "text", "p_puzzle5" "text") RETURNS TABLE("id" bigint, "participant_name" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    INSERT INTO baby_shower.quiz_results (
        participant_name, answers, score, total_questions, percentage,
        submitted_by, puzzle1, puzzle2, puzzle3, puzzle4, puzzle5
    )
    VALUES (
        p_participant_name, p_answers, p_score, p_total_questions, p_percentage,
        p_submitted_by, p_puzzle1, p_puzzle2, p_puzzle3, p_puzzle4, p_puzzle5
    )
    RETURNING baby_shower.quiz_results.id, 
              baby_shower.quiz_results.participant_name, 
              baby_shower.quiz_results.created_at;
END;
$$;


ALTER FUNCTION "baby_shower"."insert_quiz_result"("p_participant_name" "text", "p_answers" "jsonb", "p_score" integer, "p_total_questions" integer, "p_percentage" integer, "p_submitted_by" "text", "p_puzzle1" "text", "p_puzzle2" "text", "p_puzzle3" "text", "p_puzzle4" "text", "p_puzzle5" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO baby_shower.submissions (name, activity_type, activity_data)
  VALUES (p_name, p_activity_type, p_activity_data);
END;
$$;


ALTER FUNCTION "baby_shower"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "baby_shower"."sync_quiz_answers"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If individual puzzle columns are provided but answers JSONB is empty/null, build JSONB
    IF (NEW.puzzle1 IS NOT NULL OR NEW.puzzle2 IS NOT NULL OR NEW.puzzle3 IS NOT NULL OR 
        NEW.puzzle4 IS NOT NULL OR NEW.puzzle5 IS NOT NULL) AND 
       (NEW.answers IS NULL OR NEW.answers = '{}'::jsonb) THEN
        
        NEW.answers := JSONB_BUILD_OBJECT(
            'puzzle1', NEW.puzzle1,
            'puzzle2', NEW.puzzle2, 
            'puzzle3', NEW.puzzle3,
            'puzzle4', NEW.puzzle4,
            'puzzle5', NEW.puzzle5
        );
    END IF;
    
    -- Calculate score from answers if not provided
    IF NEW.score IS NULL AND NEW.answers IS NOT NULL THEN
        -- Simple scoring: check if answers match expected patterns
        NEW.score := 0;
        -- This is a placeholder - actual scoring logic depends on expected answers
    END IF;
    
    -- Set total_questions default
    IF NEW.total_questions IS NULL THEN
        NEW.total_questions := 5;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "baby_shower"."sync_quiz_answers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "internal"."handle_submission_migration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "internal"."handle_submission_migration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_advice_entries"() RETURNS TABLE("id" bigint, "advisor_name" "text", "advice" "text", "category" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'baby_shower', 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT id, advisor_name, advice, category, created_at
  FROM baby_shower.advice
  ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_advice_entries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pool_predictions"() RETURNS TABLE("id" bigint, "predictor_name" "text", "due_date" "text", "time_guess" "text", "weight_kg" numeric, "length_cm" numeric, "prediction" "text", "ai_roast" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'baby_shower', 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT id, predictor_name, due_date, time_guess, weight_kg, length_cm, 
         prediction, ai_roast, created_at
  FROM baby_shower.pool_predictions
  ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_pool_predictions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_quiz_results"() RETURNS TABLE("id" bigint, "participant_name" "text", "puzzle1" "text", "puzzle2" "text", "puzzle3" "text", "puzzle4" "text", "puzzle5" "text", "score" integer, "total_questions" integer, "percentage" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'baby_shower', 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT id, participant_name, puzzle1, puzzle2, puzzle3, puzzle4, puzzle5,
         score, total_questions, percentage, created_at
  FROM baby_shower.quiz_results
  ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_quiz_results"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_submissions_count"() RETURNS TABLE("activity_type" "text", "total" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY 
  SELECT s.activity_type, COUNT(*)::BIGINT as total
  FROM baby_shower.submissions s
  GROUP BY s.activity_type;
END;
$$;


ALTER FUNCTION "public"."get_submissions_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vote_counts"() RETURNS TABLE("total_votes" bigint, "results" json, "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'baby_shower', 'public'
    AS $$
DECLARE
  v_total bigint;
  v_results json;
BEGIN
  SELECT COUNT(*) INTO v_total FROM baby_shower.votes;
  
  SELECT json_agg(x) INTO v_results
  FROM (
    SELECT 
      json_build_object(
        'name', n_name,
        'count', n_count,
        'percentage', CASE WHEN v_total > 0 THEN ROUND((n_count::numeric / v_total) * 100)::int ELSE 0 END
      ) as x
    FROM (
      SELECT 
        COALESCE((selected_names->>'name')::text, 'Unknown') as n_name,
        COUNT(*)::bigint as n_count
      FROM (
        SELECT json_array_elements(selected_names::json) as selected_names
        FROM baby_shower.votes
      ) AS parsed
      GROUP BY n_name
    ) AS sub
    ORDER BY n_count DESC
  ) AS ordered_data;

  total_votes := v_total;
  results := COALESCE(v_results, '[]'::json);
  last_updated := NOW();
END;
$$;


ALTER FUNCTION "public"."get_vote_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_advice_entry"("p_name" "text", "p_advice" "text", "p_category" "text") RETURNS TABLE("id" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    INSERT INTO baby_shower.advice (advice_giver, advice_text, delivery_option)
    VALUES (p_name, p_advice, p_category)
    RETURNING baby_shower.advice.id, baby_shower.advice.created_at;
END;
$$;


ALTER FUNCTION "public"."insert_advice_entry"("p_name" "text", "p_advice" "text", "p_category" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_guestbook_entry"("p_guest_name" "text", "p_relationship" "text", "p_message" "text", "p_submitted_by" "text") RETURNS TABLE("id" bigint, "guest_name" "text", "relationship" "text", "message" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'baby_shower', 'public'
    AS $$
BEGIN
  RETURN QUERY
  INSERT INTO baby_shower.guestbook (guest_name, relationship, message, submitted_by)
  VALUES (p_guest_name, p_relationship, p_message, p_submitted_by)
  RETURNING baby_shower.guestbook.id, 
            baby_shower.guestbook.guest_name, 
            baby_shower.guestbook.relationship, 
            baby_shower.guestbook.message, 
            baby_shower.guestbook.created_at;
END;
$$;


ALTER FUNCTION "public"."insert_guestbook_entry"("p_guest_name" "text", "p_relationship" "text", "p_message" "text", "p_submitted_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_pool_prediction"("p_name" "text", "p_prediction" "text", "p_due_date" "date", "p_weight" numeric, "p_length" integer, "p_ai_roast" "text") RETURNS TABLE("id" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    INSERT INTO baby_shower.pool_predictions 
      (predictor_name, prediction, birth_date, weight_kg, length_cm)
    VALUES (p_name, p_prediction, p_due_date, p_weight, p_length)
    RETURNING baby_shower.pool_predictions.id, baby_shower.pool_predictions.created_at;
END;
$$;


ALTER FUNCTION "public"."insert_pool_prediction"("p_name" "text", "p_prediction" "text", "p_due_date" "date", "p_weight" numeric, "p_length" integer, "p_ai_roast" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_quiz_result"("p_name" "text", "p_p1" "text", "p_p2" "text", "p_p3" "text", "p_p4" "text", "p_p5" "text", "p_score" integer, "p_total" integer) RETURNS TABLE("id" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'baby_shower', 'public'
    AS $$
DECLARE
  v_pct integer := CASE WHEN p_total > 0 THEN ROUND((p_score::numeric / p_total) * 100)::int ELSE 0 END;
BEGIN
  RETURN QUERY
  INSERT INTO baby_shower.quiz_results 
    (participant_name, puzzle1, puzzle2, puzzle3, puzzle4, puzzle5, score, total_questions, percentage)
  VALUES (p_name, p_p1, p_p2, p_p3, p_p4, p_p5, p_score, p_total, v_pct)
  RETURNING baby_shower.quiz_results.id, baby_shower.quiz_results.created_at;
END;
$$;


ALTER FUNCTION "public"."insert_quiz_result"("p_name" "text", "p_p1" "text", "p_p2" "text", "p_p3" "text", "p_p4" "text", "p_p5" "text", "p_score" integer, "p_total" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO baby_shower.submissions (name, activity_type, activity_data)
  VALUES (p_name, p_activity_type, p_activity_data);
END;
$$;


ALTER FUNCTION "public"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "baby_shower"."advice" (
    "id" bigint NOT NULL,
    "advice_giver" "text" NOT NULL,
    "advice_text" "text" NOT NULL,
    "delivery_option" "text" NOT NULL,
    "is_approved" boolean DEFAULT false,
    "ai_generated" boolean DEFAULT false,
    "submitted_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "baby_shower"."advice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "baby_shower"."submissions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_data" "jsonb" DEFAULT '{}'::"jsonb",
    "message" "text",
    "advice_type" "text",
    "date_guess" "date",
    "time_guess" time without time zone,
    "weight_guess" numeric,
    "length_guess" integer,
    "puzzle1" "text",
    "puzzle2" "text",
    "puzzle3" "text",
    "puzzle4" "text",
    "puzzle5" "text",
    "score" integer,
    "selected_names" "text",
    "photo_url" "text",
    "relationship" "text"
);


ALTER TABLE "baby_shower"."submissions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "baby_shower"."advice_entries" AS
 SELECT "id",
    "created_at",
    "name",
    "activity_type",
    "activity_data"
   FROM "baby_shower"."submissions"
  WHERE ("activity_type" = 'advice'::"text")
  ORDER BY "created_at" DESC;


ALTER VIEW "baby_shower"."advice_entries" OWNER TO "postgres";


COMMENT ON VIEW "baby_shower"."advice_entries" IS 'Advice submissions from baby_shower.submissions';



CREATE SEQUENCE IF NOT EXISTS "baby_shower"."advice_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "baby_shower"."advice_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "baby_shower"."advice_id_seq" OWNED BY "baby_shower"."advice"."id";



CREATE TABLE IF NOT EXISTS "baby_shower"."game_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scenario_id" "uuid" NOT NULL,
    "mom_answer" character varying(10),
    "dad_answer" character varying(10),
    "mom_locked" boolean DEFAULT false,
    "mom_locked_at" timestamp with time zone,
    "dad_locked" boolean DEFAULT false,
    "dad_locked_at" timestamp with time zone,
    "final_answer" character varying(10),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "all_locked_at" timestamp with time zone,
    CONSTRAINT "game_answers_dad_answer_check" CHECK (((("dad_answer")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[])) OR ("dad_answer" IS NULL))),
    CONSTRAINT "game_answers_final_answer_check" CHECK (((("final_answer")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[])) OR ("final_answer" IS NULL))),
    CONSTRAINT "game_answers_mom_answer_check" CHECK (((("mom_answer")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[])) OR ("mom_answer" IS NULL)))
);


ALTER TABLE "baby_shower"."game_answers" OWNER TO "postgres";


COMMENT ON TABLE "baby_shower"."game_answers" IS 'Secret parent answers, locked before reveal';



COMMENT ON COLUMN "baby_shower"."game_answers"."final_answer" IS 'Consensus answer (if parents disagree, could use coin flip or require re-vote)';



CREATE TABLE IF NOT EXISTS "baby_shower"."game_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scenario_id" "uuid" NOT NULL,
    "mom_votes" integer DEFAULT 0,
    "dad_votes" integer DEFAULT 0,
    "total_votes" integer GENERATED ALWAYS AS ((COALESCE("mom_votes", 0) + COALESCE("dad_votes", 0))) STORED,
    "mom_percentage" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ((COALESCE("mom_votes", 0) + COALESCE("dad_votes", 0)) > 0) THEN (((COALESCE("mom_votes", 0))::numeric / ((COALESCE("mom_votes", 0) + COALESCE("dad_votes", 0)))::numeric) * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "crowd_choice" character varying(10),
    "actual_choice" character varying(10),
    "perception_gap" numeric(5,2),
    "roast_commentary" "text",
    "roast_provider" character varying(20) DEFAULT 'moonshot'::character varying,
    "roast_model" character varying(50),
    "particle_effect" character varying(20) DEFAULT 'confetti'::character varying,
    "revealed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "baby_shower"."game_results" OWNER TO "postgres";


COMMENT ON TABLE "baby_shower"."game_results" IS 'Perception gap analysis and AI roast commentary';



COMMENT ON COLUMN "baby_shower"."game_results"."perception_gap" IS 'Percentage difference between crowd choice and reality';



CREATE TABLE IF NOT EXISTS "baby_shower"."game_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "round_number" integer NOT NULL,
    "scenario_text" "text" NOT NULL,
    "mom_option" "text" NOT NULL,
    "dad_option" "text" NOT NULL,
    "ai_provider" character varying(20) DEFAULT 'z_ai'::character varying,
    "intensity" numeric(3,2) DEFAULT 0.5,
    "theme_tags" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "used_at" timestamp with time zone
);


ALTER TABLE "baby_shower"."game_scenarios" OWNER TO "postgres";


COMMENT ON TABLE "baby_shower"."game_scenarios" IS 'AI-generated scenarios for Mom vs Dad game rounds';



COMMENT ON COLUMN "baby_shower"."game_scenarios"."intensity" IS 'Comedy level: 0.1=tame, 0.5=funny, 1.0=wild';



COMMENT ON COLUMN "baby_shower"."game_scenarios"."theme_tags" IS 'Theme tags for categorization: farm, cozy, parenting, funny, etc.';



CREATE TABLE IF NOT EXISTS "baby_shower"."game_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_code" character varying(8) NOT NULL,
    "status" character varying(20) DEFAULT 'setup'::character varying,
    "mom_name" character varying(100) NOT NULL,
    "dad_name" character varying(100) NOT NULL,
    "admin_code" character varying(10) NOT NULL,
    "total_rounds" integer DEFAULT 5,
    "current_round" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" character varying(100),
    CONSTRAINT "game_sessions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['setup'::character varying, 'voting'::character varying, 'revealed'::character varying, 'complete'::character varying])::"text"[])))
);


ALTER TABLE "baby_shower"."game_sessions" OWNER TO "postgres";


COMMENT ON TABLE "baby_shower"."game_sessions" IS 'Manages Mom vs Dad game sessions and rounds';



COMMENT ON COLUMN "baby_shower"."game_sessions"."session_code" IS '6-8 character code for guests to join';



COMMENT ON COLUMN "baby_shower"."game_sessions"."status" IS 'setup (configuring), voting (active), revealed (results shown), complete (finished)';



CREATE TABLE IF NOT EXISTS "baby_shower"."game_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scenario_id" "uuid" NOT NULL,
    "guest_name" character varying(100) NOT NULL,
    "guest_id" "uuid",
    "vote_choice" character varying(10) NOT NULL,
    "voted_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "game_votes_vote_choice_check" CHECK ((("vote_choice")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[])))
);


ALTER TABLE "baby_shower"."game_votes" OWNER TO "postgres";


COMMENT ON TABLE "baby_shower"."game_votes" IS 'Guest votes for Mom vs Dad scenarios';



COMMENT ON COLUMN "baby_shower"."game_votes"."vote_choice" IS 'Which parent the guest thinks would do the scenario';



CREATE TABLE IF NOT EXISTS "baby_shower"."guestbook" (
    "id" bigint NOT NULL,
    "guest_name" "text" NOT NULL,
    "relationship" "text" NOT NULL,
    "message" "text" NOT NULL,
    "submitted_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "baby_shower"."guestbook" OWNER TO "postgres";


CREATE OR REPLACE VIEW "baby_shower"."guestbook_entries" AS
 SELECT "id",
    "created_at",
    "name",
    "activity_type",
    "activity_data"
   FROM "baby_shower"."submissions"
  WHERE ("activity_type" = 'guestbook'::"text")
  ORDER BY "created_at" DESC;


ALTER VIEW "baby_shower"."guestbook_entries" OWNER TO "postgres";


COMMENT ON VIEW "baby_shower"."guestbook_entries" IS 'Guestbook submissions from baby_shower.submissions';



CREATE SEQUENCE IF NOT EXISTS "baby_shower"."guestbook_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "baby_shower"."guestbook_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "baby_shower"."guestbook_id_seq" OWNED BY "baby_shower"."guestbook"."id";



CREATE TABLE IF NOT EXISTS "baby_shower"."mom_dad_game_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lobby_id" "uuid",
    "round_number" integer NOT NULL,
    "scenario_text" "text" NOT NULL,
    "mom_option" "text" NOT NULL,
    "dad_option" "text" NOT NULL,
    "intensity" numeric(3,2) DEFAULT 0.5,
    "status" character varying(20) DEFAULT 'voting'::character varying,
    "mom_votes" integer DEFAULT 0,
    "dad_votes" integer DEFAULT 0,
    "mom_percentage" numeric(5,2),
    "dad_percentage" numeric(5,2),
    "crowd_choice" character varying(10),
    "actual_mom_answer" character varying(10),
    "actual_dad_answer" character varying(10),
    "perception_gap" numeric(5,2),
    "roast_commentary" "text",
    "particle_effect" character varying(20) DEFAULT 'confetti'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revealed_at" timestamp with time zone,
    CONSTRAINT "valid_answer" CHECK ((("actual_mom_answer" IS NULL) OR (("actual_mom_answer")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[])))),
    CONSTRAINT "valid_answer_dad" CHECK ((("actual_dad_answer" IS NULL) OR (("actual_dad_answer")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[])))),
    CONSTRAINT "valid_intensity" CHECK ((("intensity" >= 0.1) AND ("intensity" <= 1.0))),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['voting'::character varying, 'revealed'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "baby_shower"."mom_dad_game_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "baby_shower"."mom_dad_lobbies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lobby_key" character varying(20) NOT NULL,
    "lobby_name" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'waiting'::character varying,
    "max_players" integer DEFAULT 6,
    "current_players" integer DEFAULT 0,
    "current_humans" integer DEFAULT 0,
    "current_ai_count" integer DEFAULT 0,
    "admin_player_id" "uuid",
    "total_rounds" integer DEFAULT 5,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_ai_count_valid" CHECK ((("current_ai_count" >= 0) AND ("current_ai_count" <= "current_players"))),
    CONSTRAINT "check_current_humans_valid" CHECK ((("current_humans" >= 0) AND ("current_humans" <= "current_players"))),
    CONSTRAINT "check_player_count_positive" CHECK (("current_players" >= 0)),
    CONSTRAINT "valid_max_players" CHECK ((("max_players" >= 2) AND ("max_players" <= 6))),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['waiting'::character varying, 'active'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "baby_shower"."mom_dad_lobbies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "baby_shower"."mom_dad_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lobby_id" "uuid",
    "user_id" "uuid",
    "player_name" character varying(100) NOT NULL,
    "player_type" character varying(10) DEFAULT 'human'::character varying,
    "is_admin" boolean DEFAULT false,
    "is_ready" boolean DEFAULT false,
    "current_vote" character varying(10),
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "disconnected_at" timestamp with time zone,
    CONSTRAINT "valid_player_type" CHECK ((("player_type")::"text" = ANY ((ARRAY['human'::character varying, 'ai'::character varying])::"text"[]))),
    CONSTRAINT "valid_vote" CHECK ((("current_vote" IS NULL) OR (("current_vote")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[]))))
);


ALTER TABLE "baby_shower"."mom_dad_players" OWNER TO "postgres";


CREATE OR REPLACE VIEW "baby_shower"."pool_entries" AS
 SELECT "id",
    "created_at",
    "name",
    "activity_type",
    "activity_data"
   FROM "baby_shower"."submissions"
  WHERE ("activity_type" = 'pool'::"text")
  ORDER BY "created_at" DESC;


ALTER VIEW "baby_shower"."pool_entries" OWNER TO "postgres";


COMMENT ON VIEW "baby_shower"."pool_entries" IS 'Pool submissions from baby_shower.submissions';



CREATE TABLE IF NOT EXISTS "baby_shower"."pool_predictions" (
    "id" bigint NOT NULL,
    "predictor_name" "text" NOT NULL,
    "gender" "text" DEFAULT 'surprise'::"text",
    "birth_date" "date" NOT NULL,
    "weight_kg" numeric NOT NULL,
    "length_cm" integer NOT NULL,
    "hair_color" "text",
    "eye_color" "text",
    "personality" "text",
    "submitted_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "prediction" "text"
);


ALTER TABLE "baby_shower"."pool_predictions" OWNER TO "postgres";


COMMENT ON COLUMN "baby_shower"."pool_predictions"."prediction" IS 'Text prediction or guess about the baby';



CREATE SEQUENCE IF NOT EXISTS "baby_shower"."pool_predictions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "baby_shower"."pool_predictions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "baby_shower"."pool_predictions_id_seq" OWNED BY "baby_shower"."pool_predictions"."id";



CREATE OR REPLACE VIEW "baby_shower"."quiz_entries" AS
 SELECT "id",
    "created_at",
    "name",
    "activity_type",
    "activity_data"
   FROM "baby_shower"."submissions"
  WHERE ("activity_type" = 'quiz'::"text")
  ORDER BY "created_at" DESC;


ALTER VIEW "baby_shower"."quiz_entries" OWNER TO "postgres";


COMMENT ON VIEW "baby_shower"."quiz_entries" IS 'Quiz submissions from baby_shower.submissions';



CREATE TABLE IF NOT EXISTS "baby_shower"."quiz_results" (
    "id" bigint NOT NULL,
    "participant_name" "text" NOT NULL,
    "answers" "jsonb" NOT NULL,
    "score" integer NOT NULL,
    "total_questions" integer NOT NULL,
    "percentage" integer,
    "submitted_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "puzzle1" "text",
    "puzzle2" "text",
    "puzzle3" "text",
    "puzzle4" "text",
    "puzzle5" "text"
);


ALTER TABLE "baby_shower"."quiz_results" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "baby_shower"."quiz_results_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "baby_shower"."quiz_results_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "baby_shower"."quiz_results_id_seq" OWNED BY "baby_shower"."quiz_results"."id";



CREATE OR REPLACE VIEW "baby_shower"."submissions_count" AS
 SELECT "activity_type",
    "count"(*) AS "total",
    "min"("created_at") AS "first_submission",
    "max"("created_at") AS "last_submission"
   FROM "baby_shower"."submissions"
  GROUP BY "activity_type";


ALTER VIEW "baby_shower"."submissions_count" OWNER TO "postgres";


COMMENT ON VIEW "baby_shower"."submissions_count" IS 'Count of submissions by activity type';



ALTER TABLE "baby_shower"."submissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "baby_shower"."submissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "baby_shower"."vote_counts" AS
 SELECT "jsonb_array_elements_text"(("activity_data" -> 'names'::"text")) AS "baby_name",
    "count"(*) AS "vote_count"
   FROM "baby_shower"."submissions"
  WHERE ("activity_type" = 'voting'::"text")
  GROUP BY ("jsonb_array_elements_text"(("activity_data" -> 'names'::"text")))
  ORDER BY ("count"(*)) DESC;


ALTER VIEW "baby_shower"."vote_counts" OWNER TO "postgres";


COMMENT ON VIEW "baby_shower"."vote_counts" IS 'Vote counts for baby names';



CREATE TABLE IF NOT EXISTS "baby_shower"."votes" (
    "id" bigint NOT NULL,
    "voter_name" "text" NOT NULL,
    "selected_names" "jsonb" NOT NULL,
    "submitted_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "baby_shower"."votes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "baby_shower"."votes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "baby_shower"."votes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "baby_shower"."votes_id_seq" OWNED BY "baby_shower"."votes"."id";



CREATE OR REPLACE VIEW "baby_shower"."voting_names" AS
 SELECT "unnest"(ARRAY['Emma'::"text", 'Olivia'::"text", 'Sophia'::"text", 'Charlotte'::"text", 'Amelia'::"text", 'Ava'::"text", 'Mia'::"text", 'Isabella'::"text", 'Lily'::"text", 'Harper'::"text"]) AS "name";


ALTER VIEW "baby_shower"."voting_names" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "baby_shower"."who_would_rather_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_text" "text" NOT NULL,
    "question_number" integer NOT NULL,
    "category" character varying(50) DEFAULT 'general'::character varying,
    "difficulty" character varying(20) DEFAULT 'medium'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "who_would_rather_questions_difficulty_check" CHECK ((("difficulty")::"text" = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::"text"[]))),
    CONSTRAINT "who_would_rather_questions_question_number_check" CHECK ((("question_number" >= 1) AND ("question_number" <= 24)))
);


ALTER TABLE "baby_shower"."who_would_rather_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "baby_shower"."who_would_rather_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "question_number" integer NOT NULL,
    "guest_name" character varying(100) NOT NULL,
    "vote_choice" character varying(10) NOT NULL,
    "voted_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "who_would_rather_votes_question_number_check" CHECK ((("question_number" >= 1) AND ("question_number" <= 24))),
    CONSTRAINT "who_would_rather_votes_vote_choice_check" CHECK ((("vote_choice")::"text" = ANY ((ARRAY['mom'::character varying, 'dad'::character varying])::"text"[])))
);


ALTER TABLE "baby_shower"."who_would_rather_votes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "baby_shower"."who_would_rather_results" AS
 SELECT "session_id",
    "question_number",
    "count"(
        CASE
            WHEN (("vote_choice")::"text" = 'mom'::"text") THEN 1
            ELSE NULL::integer
        END) AS "mom_votes",
    "count"(
        CASE
            WHEN (("vote_choice")::"text" = 'dad'::"text") THEN 1
            ELSE NULL::integer
        END) AS "dad_votes",
    "count"(*) AS "total_votes",
        CASE
            WHEN ("count"(*) > 0) THEN "round"(((("count"(
            CASE
                WHEN (("vote_choice")::"text" = 'mom'::"text") THEN 1
                ELSE NULL::integer
            END))::numeric / ("count"(*))::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS "mom_percentage",
        CASE
            WHEN ("count"(*) > 0) THEN "round"(((("count"(
            CASE
                WHEN (("vote_choice")::"text" = 'dad'::"text") THEN 1
                ELSE NULL::integer
            END))::numeric / ("count"(*))::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS "dad_percentage",
        CASE
            WHEN ("count"(
            CASE
                WHEN (("vote_choice")::"text" = 'mom'::"text") THEN 1
                ELSE NULL::integer
            END) > "count"(
            CASE
                WHEN (("vote_choice")::"text" = 'dad'::"text") THEN 1
                ELSE NULL::integer
            END)) THEN 'mom'::"text"
            WHEN ("count"(
            CASE
                WHEN (("vote_choice")::"text" = 'dad'::"text") THEN 1
                ELSE NULL::integer
            END) > "count"(
            CASE
                WHEN (("vote_choice")::"text" = 'mom'::"text") THEN 1
                ELSE NULL::integer
            END)) THEN 'dad'::"text"
            ELSE 'tie'::"text"
        END AS "winning_choice"
   FROM "baby_shower"."who_would_rather_votes" "v"
  GROUP BY "session_id", "question_number";


ALTER VIEW "baby_shower"."who_would_rather_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "baby_shower"."who_would_rather_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_code" character varying(6) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "current_question_index" integer DEFAULT 0,
    "total_questions" integer DEFAULT 24,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_by" character varying(100),
    CONSTRAINT "who_would_rather_sessions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'complete'::character varying])::"text"[])))
);


ALTER TABLE "baby_shower"."who_would_rather_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "internal"."event_archive" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "guest_name" "text",
    "activity_type" "text",
    "raw_data" "jsonb" NOT NULL,
    "processed_data" "jsonb",
    "source_ip" "inet",
    "user_agent" "text",
    "processing_time_ms" integer
);


ALTER TABLE "internal"."event_archive" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "internal"."event_archive_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "internal"."event_archive_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "internal"."event_archive_id_seq" OWNED BY "internal"."event_archive"."id";



CREATE OR REPLACE VIEW "public"."advice_v" AS
 SELECT "id",
    "advice_giver",
    "advice_text",
    "delivery_option",
    "is_approved",
    "ai_generated",
    "submitted_by",
    "created_at"
   FROM "baby_shower"."advice"
  WHERE (true = true);


ALTER VIEW "public"."advice_v" OWNER TO "postgres";


COMMENT ON VIEW "public"."advice_v" IS 'Advice entries from baby_shower schema';



CREATE TABLE IF NOT EXISTS "public"."appliance_research" (
    "id" integer NOT NULL,
    "appliance_type" "text",
    "data_type" "text",
    "brand" "text",
    "model" "text",
    "data" "jsonb",
    "source" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."appliance_research" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."appliance_research_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."appliance_research_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."appliance_research_id_seq" OWNED BY "public"."appliance_research"."id";



CREATE TABLE IF NOT EXISTS "public"."baby_product_research" (
    "id" integer NOT NULL,
    "category" character varying(100) NOT NULL,
    "product_name" character varying(255) NOT NULL,
    "brand" character varying(100),
    "price_aud" numeric(10,2),
    "original_price_aud" numeric(10,2),
    "discount_percentage" numeric(5,2),
    "retailer" character varying(100),
    "engineering_features" "text",
    "practicality_score" integer,
    "value_score" integer,
    "safety_ratings" "text",
    "pros" "text",
    "cons" "text",
    "black_friday_deal" boolean DEFAULT false,
    "purchase_urgency" character varying(20),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."baby_product_research" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."baby_product_research_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."baby_product_research_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."baby_product_research_id_seq" OWNED BY "public"."baby_product_research"."id";



CREATE OR REPLACE VIEW "public"."guestbook_v" AS
 SELECT "id",
    "guest_name",
    "relationship",
    "message",
    "submitted_by",
    "created_at"
   FROM "baby_shower"."guestbook"
  WHERE (true = true);


ALTER VIEW "public"."guestbook_v" OWNER TO "postgres";


COMMENT ON VIEW "public"."guestbook_v" IS 'Guestbook entries from baby_shower schema';



CREATE TABLE IF NOT EXISTS "public"."installation_requirements" (
    "id" integer NOT NULL,
    "appliance_type" character varying(50),
    "brand" character varying(50),
    "model" character varying(200),
    "body_depth_mm" integer,
    "body_width_mm" integer,
    "body_height_mm" integer,
    "rear_clearance_needed_mm" integer,
    "side_clearance_needed_mm" integer,
    "front_clearance_needed_mm" integer,
    "total_depth_from_wall_mm" integer,
    "stacking_compatible" boolean,
    "stacking_kit_required" boolean,
    "stacked_total_height_mm" integer,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."installation_requirements" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."installation_requirements_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."installation_requirements_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."installation_requirements_id_seq" OWNED BY "public"."installation_requirements"."id";



CREATE TABLE IF NOT EXISTS "public"."laundry_room_specs" (
    "id" integer NOT NULL,
    "location" character varying(200),
    "width_mm" integer,
    "depth_mm" integer,
    "height_mm" integer,
    "width_available_after_clearance_mm" integer,
    "depth_available_after_clearance_mm" integer,
    "can_fit_side_by_side" boolean,
    "can_fit_stacked" boolean,
    "recommended_setup" character varying(50),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."laundry_room_specs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."laundry_room_specs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."laundry_room_specs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."laundry_room_specs_id_seq" OWNED BY "public"."laundry_room_specs"."id";



CREATE TABLE IF NOT EXISTS "public"."local_retailers_dandenong" (
    "id" integer NOT NULL,
    "retailer_name" character varying(100) NOT NULL,
    "address" "text" NOT NULL,
    "phone" character varying(20),
    "store_type" character varying(50) NOT NULL,
    "product_categories" "text",
    "opening_hours" "text",
    "black_friday_deals" boolean DEFAULT false,
    "sale_end_date" "date",
    "discount_code" character varying(50),
    "website_url" "text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."local_retailers_dandenong" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."local_retailers_dandenong_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."local_retailers_dandenong_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."local_retailers_dandenong_id_seq" OWNED BY "public"."local_retailers_dandenong"."id";



CREATE OR REPLACE VIEW "public"."pool_predictions_v" AS
 SELECT "id",
    "predictor_name",
    "gender",
    "birth_date",
    "weight_kg",
    "length_cm",
    "hair_color",
    "eye_color",
    "personality",
    "submitted_by",
    "created_at"
   FROM "baby_shower"."pool_predictions"
  WHERE (true = true);


ALTER VIEW "public"."pool_predictions_v" OWNER TO "postgres";


COMMENT ON VIEW "public"."pool_predictions_v" IS 'Pool predictions from baby_shower schema';



CREATE TABLE IF NOT EXISTS "public"."pram_research" (
    "id" integer NOT NULL,
    "data_type" "text",
    "brand" "text",
    "model" "text",
    "data" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."pram_research" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pram_research_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pram_research_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pram_research_id_seq" OWNED BY "public"."pram_research"."id";



CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "id" integer NOT NULL,
    "category_name" character varying(100) NOT NULL,
    "description" "text",
    "key_features" "text",
    "evaluation_criteria" "text",
    "engineering_standards" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_categories_id_seq" OWNED BY "public"."product_categories"."id";



CREATE TABLE IF NOT EXISTS "public"."pump_analysis" (
    "id" integer NOT NULL,
    "pump_type" character varying(50),
    "model_name" character varying(255),
    "brand" character varying(100),
    "hospital_grade" boolean,
    "practical_benefits" "text",
    "engineering_advantages" "text",
    "noise_level_db" numeric(4,1),
    "weight_kg" numeric(4,1),
    "parts_to_wash" integer,
    "suction_profile" "text",
    "portability_score" integer,
    "price_aud" numeric(10,2),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."pump_analysis" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pump_analysis_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pump_analysis_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pump_analysis_id_seq" OWNED BY "public"."pump_analysis"."id";



CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" integer NOT NULL,
    "category" "text",
    "product_name" "text",
    "brand" "text",
    "price_paid" numeric(10,2),
    "original_price" numeric(10,2),
    "discount_pct" numeric(5,2),
    "retailer" "text",
    "purchase_url" "text",
    "purchase_date" "date",
    "status" "text" DEFAULT 'considering'::"text",
    "why_chosen" "text",
    "alternatives_considered" "text",
    "key_features" "text",
    "notes" "text",
    "urgency_level" "text",
    "sale_end_date" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."purchases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchases_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."purchases_id_seq" OWNED BY "public"."purchases"."id";



CREATE OR REPLACE VIEW "public"."quiz_results_v" AS
 SELECT "id",
    "participant_name",
    "answers",
    "score",
    "total_questions",
    "percentage",
    "submitted_by",
    "created_at"
   FROM "baby_shower"."quiz_results"
  WHERE (true = true);


ALTER VIEW "public"."quiz_results_v" OWNER TO "postgres";


COMMENT ON VIEW "public"."quiz_results_v" IS 'Quiz results from baby_shower schema';



CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_data" "jsonb"
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."submissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."submissions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."submissions_id_seq" OWNED BY "public"."submissions"."id";



CREATE OR REPLACE VIEW "public"."submissions_v" AS
 SELECT "id",
    "created_at",
    "name",
    "activity_type",
    "activity_data",
    "message",
    "advice_type",
    "date_guess",
    "time_guess",
    "weight_guess",
    "length_guess",
    "puzzle1",
    "puzzle2",
    "puzzle3",
    "puzzle4",
    "puzzle5",
    "score",
    "selected_names",
    "photo_url",
    "relationship"
   FROM "baby_shower"."submissions"
  WHERE (true = true);


ALTER VIEW "public"."submissions_v" OWNER TO "postgres";


COMMENT ON VIEW "public"."submissions_v" IS 'All submissions from baby_shower schema';



CREATE OR REPLACE VIEW "public"."vote_counts_v" AS
 SELECT "baby_name",
    "vote_count"
   FROM "baby_shower"."vote_counts"
  WHERE (true = true);


ALTER VIEW "public"."vote_counts_v" OWNER TO "postgres";


COMMENT ON VIEW "public"."vote_counts_v" IS 'Vote counts from baby_shower schema';



CREATE OR REPLACE VIEW "public"."votes" AS
 SELECT "id",
    "voter_name",
    "selected_names",
    "submitted_by",
    "created_at"
   FROM "baby_shower"."votes"
  WHERE (true = true);


ALTER VIEW "public"."votes" OWNER TO "postgres";


COMMENT ON VIEW "public"."votes" IS 'Votes from baby_shower schema';



CREATE OR REPLACE VIEW "public"."votes_v" AS
 SELECT "id",
    "voter_name",
    "selected_names",
    "submitted_by",
    "created_at"
   FROM "baby_shower"."votes"
  WHERE (true = true);


ALTER VIEW "public"."votes_v" OWNER TO "postgres";


COMMENT ON VIEW "public"."votes_v" IS 'Votes from baby_shower schema';



ALTER TABLE ONLY "baby_shower"."advice" ALTER COLUMN "id" SET DEFAULT "nextval"('"baby_shower"."advice_id_seq"'::"regclass");



ALTER TABLE ONLY "baby_shower"."guestbook" ALTER COLUMN "id" SET DEFAULT "nextval"('"baby_shower"."guestbook_id_seq"'::"regclass");



ALTER TABLE ONLY "baby_shower"."pool_predictions" ALTER COLUMN "id" SET DEFAULT "nextval"('"baby_shower"."pool_predictions_id_seq"'::"regclass");



ALTER TABLE ONLY "baby_shower"."quiz_results" ALTER COLUMN "id" SET DEFAULT "nextval"('"baby_shower"."quiz_results_id_seq"'::"regclass");



ALTER TABLE ONLY "baby_shower"."votes" ALTER COLUMN "id" SET DEFAULT "nextval"('"baby_shower"."votes_id_seq"'::"regclass");



ALTER TABLE ONLY "internal"."event_archive" ALTER COLUMN "id" SET DEFAULT "nextval"('"internal"."event_archive_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."appliance_research" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."appliance_research_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."baby_product_research" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."baby_product_research_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."installation_requirements" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."installation_requirements_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."laundry_room_specs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."laundry_room_specs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."local_retailers_dandenong" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."local_retailers_dandenong_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pram_research" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pram_research_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pump_analysis" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pump_analysis_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."purchases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."purchases_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."submissions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."submissions_id_seq"'::"regclass");



ALTER TABLE ONLY "baby_shower"."advice"
    ADD CONSTRAINT "advice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."game_answers"
    ADD CONSTRAINT "game_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."game_results"
    ADD CONSTRAINT "game_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."game_scenarios"
    ADD CONSTRAINT "game_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."game_sessions"
    ADD CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."game_sessions"
    ADD CONSTRAINT "game_sessions_session_code_key" UNIQUE ("session_code");



ALTER TABLE ONLY "baby_shower"."game_votes"
    ADD CONSTRAINT "game_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."game_votes"
    ADD CONSTRAINT "game_votes_scenario_id_guest_id_key" UNIQUE ("scenario_id", "guest_id");



ALTER TABLE ONLY "baby_shower"."game_votes"
    ADD CONSTRAINT "game_votes_scenario_id_guest_name_key" UNIQUE ("scenario_id", "guest_name");



ALTER TABLE ONLY "baby_shower"."guestbook"
    ADD CONSTRAINT "guestbook_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."mom_dad_game_sessions"
    ADD CONSTRAINT "mom_dad_game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."mom_dad_lobbies"
    ADD CONSTRAINT "mom_dad_lobbies_lobby_key_key" UNIQUE ("lobby_key");



ALTER TABLE ONLY "baby_shower"."mom_dad_lobbies"
    ADD CONSTRAINT "mom_dad_lobbies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."mom_dad_players"
    ADD CONSTRAINT "mom_dad_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."pool_predictions"
    ADD CONSTRAINT "pool_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."quiz_results"
    ADD CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."mom_dad_players"
    ADD CONSTRAINT "unique_player_name_per_lobby" UNIQUE ("lobby_id", "player_name");



ALTER TABLE ONLY "baby_shower"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."who_would_rather_questions"
    ADD CONSTRAINT "who_would_rather_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."who_would_rather_questions"
    ADD CONSTRAINT "who_would_rather_questions_question_number_key" UNIQUE ("question_number");



ALTER TABLE ONLY "baby_shower"."who_would_rather_sessions"
    ADD CONSTRAINT "who_would_rather_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."who_would_rather_sessions"
    ADD CONSTRAINT "who_would_rather_sessions_session_code_key" UNIQUE ("session_code");



ALTER TABLE ONLY "baby_shower"."who_would_rather_votes"
    ADD CONSTRAINT "who_would_rather_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "baby_shower"."who_would_rather_votes"
    ADD CONSTRAINT "who_would_rather_votes_session_id_question_number_guest_nam_key" UNIQUE ("session_id", "question_number", "guest_name");



ALTER TABLE ONLY "internal"."event_archive"
    ADD CONSTRAINT "event_archive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appliance_research"
    ADD CONSTRAINT "appliance_research_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."baby_product_research"
    ADD CONSTRAINT "baby_product_research_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."installation_requirements"
    ADD CONSTRAINT "installation_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."laundry_room_specs"
    ADD CONSTRAINT "laundry_room_specs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."local_retailers_dandenong"
    ADD CONSTRAINT "local_retailers_dandenong_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pram_research"
    ADD CONSTRAINT "pram_research_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pump_analysis"
    ADD CONSTRAINT "pump_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_advice_created_at" ON "baby_shower"."advice" USING "btree" ("created_at");



CREATE INDEX "idx_baby_shower_activity" ON "baby_shower"."submissions" USING "btree" ("activity_type");



CREATE INDEX "idx_baby_shower_created" ON "baby_shower"."submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_baby_shower_guestbook_created_at" ON "baby_shower"."guestbook" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_baby_shower_guestbook_guest_name" ON "baby_shower"."guestbook" USING "btree" ("guest_name");



CREATE INDEX "idx_baby_shower_name" ON "baby_shower"."submissions" USING "btree" ("name");



CREATE INDEX "idx_baby_shower_votes_created_at" ON "baby_shower"."votes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_baby_shower_votes_gin_names" ON "baby_shower"."votes" USING "gin" ("selected_names");



CREATE INDEX "idx_baby_shower_votes_voter_name" ON "baby_shower"."votes" USING "btree" ("voter_name");



CREATE INDEX "idx_game_answers_scenario" ON "baby_shower"."game_answers" USING "btree" ("scenario_id");



CREATE INDEX "idx_game_results_perception" ON "baby_shower"."game_results" USING "btree" ("perception_gap");



CREATE INDEX "idx_game_results_scenario" ON "baby_shower"."game_results" USING "btree" ("scenario_id");



CREATE INDEX "idx_game_scenarios_active" ON "baby_shower"."game_scenarios" USING "btree" ("session_id", "is_active");



CREATE INDEX "idx_game_scenarios_round" ON "baby_shower"."game_scenarios" USING "btree" ("session_id", "round_number");



CREATE INDEX "idx_game_scenarios_session" ON "baby_shower"."game_scenarios" USING "btree" ("session_id");



CREATE INDEX "idx_game_sessions_code" ON "baby_shower"."game_sessions" USING "btree" ("session_code");



CREATE INDEX "idx_game_sessions_status" ON "baby_shower"."game_sessions" USING "btree" ("status");



CREATE INDEX "idx_game_votes_choice" ON "baby_shower"."game_votes" USING "btree" ("scenario_id", "vote_choice");



CREATE INDEX "idx_game_votes_guest" ON "baby_shower"."game_votes" USING "btree" ("guest_name");



CREATE INDEX "idx_game_votes_scenario" ON "baby_shower"."game_votes" USING "btree" ("scenario_id");



CREATE INDEX "idx_guestbook_created_at" ON "baby_shower"."guestbook" USING "btree" ("created_at");



CREATE INDEX "idx_mom_dad_active_round" ON "baby_shower"."mom_dad_game_sessions" USING "btree" ("lobby_id", "status") WHERE (("status")::"text" = ANY ((ARRAY['voting'::character varying, 'revealed'::character varying])::"text"[]));



CREATE INDEX "idx_mom_dad_admin_lookup" ON "baby_shower"."mom_dad_players" USING "btree" ("lobby_id", "is_admin") WHERE ("is_admin" = true);



CREATE INDEX "idx_mom_dad_lobby_key" ON "baby_shower"."mom_dad_lobbies" USING "btree" ("lobby_key");



CREATE INDEX "idx_mom_dad_lobby_players" ON "baby_shower"."mom_dad_players" USING "btree" ("lobby_id");



CREATE INDEX "idx_mom_dad_lobby_rounds" ON "baby_shower"."mom_dad_game_sessions" USING "btree" ("lobby_id", "round_number");



CREATE INDEX "idx_mom_dad_status" ON "baby_shower"."mom_dad_lobbies" USING "btree" ("status");



CREATE INDEX "idx_mom_dad_user_players" ON "baby_shower"."mom_dad_players" USING "btree" ("user_id");



CREATE INDEX "idx_pool_predictions_created_at" ON "baby_shower"."pool_predictions" USING "btree" ("created_at");



CREATE INDEX "idx_quiz_results_answers" ON "baby_shower"."quiz_results" USING "gin" ("answers");



CREATE INDEX "idx_quiz_results_created_at" ON "baby_shower"."quiz_results" USING "btree" ("created_at");



CREATE INDEX "idx_votes_created_at" ON "baby_shower"."votes" USING "btree" ("created_at");



CREATE INDEX "idx_votes_gin_names" ON "baby_shower"."votes" USING "gin" ("selected_names");



CREATE INDEX "idx_votes_selected_names" ON "baby_shower"."votes" USING "gin" ("selected_names");



CREATE INDEX "idx_who_would_questions_number" ON "baby_shower"."who_would_rather_questions" USING "btree" ("question_number");



CREATE INDEX "idx_who_would_sessions_code" ON "baby_shower"."who_would_rather_sessions" USING "btree" ("session_code");



CREATE INDEX "idx_who_would_sessions_status" ON "baby_shower"."who_would_rather_sessions" USING "btree" ("status");



CREATE INDEX "idx_who_would_votes_session_question" ON "baby_shower"."who_would_rather_votes" USING "btree" ("session_id", "question_number");



CREATE INDEX "idx_internal_archive_activity_type" ON "internal"."event_archive" USING "btree" ("activity_type");



CREATE INDEX "idx_internal_archive_created_at" ON "internal"."event_archive" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_submissions_activity_type" ON "public"."submissions" USING "btree" ("activity_type");



CREATE INDEX "idx_submissions_created_at" ON "public"."submissions" USING "btree" ("created_at" DESC);



CREATE OR REPLACE TRIGGER "on_baby_shower_submission" AFTER INSERT ON "baby_shower"."submissions" FOR EACH ROW EXECUTE FUNCTION "baby_shower"."handle_submission_migration"();



CREATE OR REPLACE TRIGGER "trg_sync_quiz_answers" BEFORE INSERT OR UPDATE ON "baby_shower"."quiz_results" FOR EACH ROW EXECUTE FUNCTION "baby_shower"."sync_quiz_answers"();



CREATE OR REPLACE TRIGGER "Google Sheets Export" AFTER INSERT ON "internal"."event_archive" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://script.google.com/macros/s/AKfycbxagzts6q60zPuUPCQMwnkyxUZmAatsoHFh8vvHjrA__f0PBMv89QYElKHabAlxF3CH-w/exec', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



ALTER TABLE ONLY "baby_shower"."game_answers"
    ADD CONSTRAINT "game_answers_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "baby_shower"."game_scenarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "baby_shower"."game_results"
    ADD CONSTRAINT "game_results_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "baby_shower"."game_scenarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "baby_shower"."game_scenarios"
    ADD CONSTRAINT "game_scenarios_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "baby_shower"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "baby_shower"."game_votes"
    ADD CONSTRAINT "game_votes_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "baby_shower"."game_scenarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "baby_shower"."mom_dad_game_sessions"
    ADD CONSTRAINT "mom_dad_game_sessions_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "baby_shower"."mom_dad_lobbies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "baby_shower"."mom_dad_players"
    ADD CONSTRAINT "mom_dad_players_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "baby_shower"."mom_dad_lobbies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "baby_shower"."mom_dad_players"
    ADD CONSTRAINT "mom_dad_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "baby_shower"."who_would_rather_votes"
    ADD CONSTRAINT "who_would_rather_votes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "baby_shower"."who_would_rather_sessions"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can update mom_dad lobby" ON "baby_shower"."mom_dad_lobbies" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "baby_shower"."mom_dad_players"
  WHERE (("mom_dad_players"."lobby_id" = "mom_dad_lobbies"."id") AND ("mom_dad_players"."is_admin" = true) AND (("mom_dad_players"."user_id" = "auth"."uid"()) OR ("mom_dad_players"."user_id" IS NULL) OR (("mom_dad_players"."player_type")::"text" = 'ai'::"text"))))));



CREATE POLICY "Admin can update mom_dad lobby players" ON "baby_shower"."mom_dad_players" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "baby_shower"."mom_dad_players" "p2"
  WHERE (("p2"."lobby_id" = "mom_dad_players"."lobby_id") AND ("p2"."is_admin" = true) AND (("p2"."user_id" = "auth"."uid"()) OR ("p2"."user_id" IS NULL) OR (("p2"."player_type")::"text" = 'ai'::"text"))))));



CREATE POLICY "Admins can create results" ON "baby_shower"."game_results" FOR INSERT WITH CHECK (true);



CREATE POLICY "Admins can manage answers" ON "baby_shower"."game_answers" USING ((EXISTS ( SELECT 1
   FROM "baby_shower"."game_sessions" "s"
  WHERE (("s"."id" = "game_answers"."scenario_id") AND ("s"."admin_code" IS NOT NULL)))));



CREATE POLICY "Admins can update game sessions" ON "baby_shower"."game_sessions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "baby_shower"."game_sessions" "s"
  WHERE (("s"."id" = "game_sessions"."id") AND ("s"."admin_code" IS NOT NULL)))));



CREATE POLICY "Allow anonymous inserts" ON "baby_shower"."submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow anonymous reads" ON "baby_shower"."submissions" FOR SELECT USING (true);



CREATE POLICY "Allow authenticated users to create game sessions" ON "baby_shower"."game_sessions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to create game sessions" ON "baby_shower"."mom_dad_game_sessions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to create lobbies" ON "baby_shower"."mom_dad_lobbies" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert players" ON "baby_shower"."mom_dad_players" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to view game sessions" ON "baby_shower"."game_sessions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow guestbook inserts for all" ON "baby_shower"."guestbook" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow guestbook reads for all" ON "baby_shower"."guestbook" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to mom_dad_lobbies" ON "baby_shower"."mom_dad_lobbies" FOR SELECT USING (true);



CREATE POLICY "Allow votes inserts for all" ON "baby_shower"."votes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow votes reads for all" ON "baby_shower"."votes" FOR SELECT USING (true);



CREATE POLICY "Anyone can create game sessions" ON "baby_shower"."game_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create sessions" ON "baby_shower"."who_would_rather_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can submit votes" ON "baby_shower"."game_votes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can submit votes" ON "baby_shower"."who_would_rather_votes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active scenarios" ON "baby_shower"."game_scenarios" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view mom_dad game sessions" ON "baby_shower"."mom_dad_game_sessions" FOR SELECT USING (("lobby_id" IN ( SELECT "mom_dad_lobbies"."id"
   FROM "baby_shower"."mom_dad_lobbies")));



CREATE POLICY "Enable all for all users" ON "baby_shower"."advice" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for all users" ON "baby_shower"."guestbook" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for all users" ON "baby_shower"."pool_predictions" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for all users" ON "baby_shower"."quiz_results" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for all users" ON "baby_shower"."votes" USING (true) WITH CHECK (true);



CREATE POLICY "Mom_dad players can update own state" ON "baby_shower"."mom_dad_players" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR (("player_type")::"text" = 'ai'::"text")));



CREATE POLICY "Mom_dad players can view lobby members" ON "baby_shower"."mom_dad_players" FOR SELECT USING ((("lobby_id" IN ( SELECT "mom_dad_lobbies"."id"
   FROM "baby_shower"."mom_dad_lobbies"
  WHERE (("mom_dad_lobbies"."lobby_key")::"text" = ANY ((ARRAY['LOBBY-A'::character varying, 'LOBBY-B'::character varying, 'LOBBY-C'::character varying, 'LOBBY-D'::character varying])::"text"[])))) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Players can update own state" ON "baby_shower"."mom_dad_players" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL) OR (("player_type")::"text" = 'ai'::"text")));



CREATE POLICY "Public can read game sessions" ON "baby_shower"."game_sessions" FOR SELECT USING (true);



CREATE POLICY "Public can read questions" ON "baby_shower"."who_would_rather_questions" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can read results" ON "baby_shower"."game_results" FOR SELECT USING (("revealed_at" IS NOT NULL));



CREATE POLICY "Public can read scenarios" ON "baby_shower"."game_scenarios" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "baby_shower"."game_sessions" "s"
  WHERE (("s"."id" = "game_scenarios"."session_id") AND (("s"."status")::"text" = ANY ((ARRAY['voting'::character varying, 'revealed'::character varying, 'complete'::character varying])::"text"[]))))));



CREATE POLICY "Public can read sessions" ON "baby_shower"."who_would_rather_sessions" FOR SELECT USING (true);



CREATE POLICY "Public can read vote counts" ON "baby_shower"."game_votes" FOR SELECT USING (true);



CREATE POLICY "Public can read votes" ON "baby_shower"."who_would_rather_votes" FOR SELECT USING (true);



CREATE POLICY "Public mom_dad lobbies are viewable by everyone" ON "baby_shower"."mom_dad_lobbies" FOR SELECT USING (true);



CREATE POLICY "Reveal answers after game" ON "baby_shower"."game_answers" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("baby_shower"."game_sessions" "s"
     JOIN "baby_shower"."game_scenarios" "sc" ON (("s"."id" = "sc"."session_id")))
  WHERE (("sc"."id" = "game_answers"."scenario_id") AND (("s"."status")::"text" = ANY ((ARRAY['revealed'::character varying, 'complete'::character varying])::"text"[]))))) OR (("mom_locked" = true) AND ("dad_locked" = true))));



CREATE POLICY "System can manage mom_dad players" ON "baby_shower"."mom_dad_players" USING (("current_setting"('app.current_role'::"text", true) = 'system'::"text"));



CREATE POLICY "System can update mom_dad lobby" ON "baby_shower"."mom_dad_lobbies" FOR UPDATE USING (("current_setting"('app.current_role'::"text", true) = 'system'::"text"));



CREATE POLICY "System manages mom_dad game sessions" ON "baby_shower"."mom_dad_game_sessions" USING (("current_setting"('app.current_role'::"text", true) = 'system'::"text"));



ALTER TABLE "baby_shower"."advice" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."game_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."game_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."game_scenarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."game_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."guestbook" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."mom_dad_game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."mom_dad_lobbies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."mom_dad_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."pool_predictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."quiz_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."who_would_rather_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."who_would_rather_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "baby_shower"."who_would_rather_votes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow public INSERT" ON "public"."submissions" FOR INSERT WITH CHECK (("auth"."role"() = ANY (ARRAY['anon'::"text", 'authenticated'::"text"])));



CREATE POLICY "Allow public SELECT" ON "public"."submissions" FOR SELECT USING (true);



CREATE POLICY "Allow public inserts" ON "public"."submissions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow public read" ON "public"."submissions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read access" ON "public"."appliance_research" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."baby_product_research" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."installation_requirements" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."laundry_room_specs" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."local_retailers_dandenong" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."pram_research" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."product_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."pump_analysis" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."purchases" FOR SELECT USING (true);



CREATE POLICY "Deny DELETE" ON "public"."submissions" FOR DELETE USING (false);



CREATE POLICY "Deny UPDATE" ON "public"."submissions" FOR UPDATE USING (false);



ALTER TABLE "public"."appliance_research" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."baby_product_research" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."installation_requirements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."laundry_room_specs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."local_retailers_dandenong" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pram_research" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pump_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


CREATE PUBLICATION "baby_shower_game_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "baby_shower_game_realtime" OWNER TO "postgres";


COMMENT ON PUBLICATION "baby_shower_game_realtime" IS 'Realtime updates for Mom vs Dad game';





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "baby_shower_game_realtime" ADD TABLE ONLY "baby_shower"."game_results";



ALTER PUBLICATION "baby_shower_game_realtime" ADD TABLE ONLY "baby_shower"."game_scenarios";



ALTER PUBLICATION "baby_shower_game_realtime" ADD TABLE ONLY "baby_shower"."game_sessions";



ALTER PUBLICATION "baby_shower_game_realtime" ADD TABLE ONLY "baby_shower"."game_votes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "baby_shower"."submissions";



GRANT USAGE ON SCHEMA "baby_shower" TO "anon";
GRANT USAGE ON SCHEMA "baby_shower" TO "authenticated";
GRANT USAGE ON SCHEMA "baby_shower" TO "service_role";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "baby_shower"."get_submissions_count"() TO "anon";



GRANT ALL ON FUNCTION "baby_shower"."get_vote_counts"() TO "anon";



GRANT ALL ON FUNCTION "baby_shower"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") TO "anon";

























































































































































GRANT ALL ON FUNCTION "public"."get_advice_entries"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_advice_entries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_advice_entries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pool_predictions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pool_predictions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pool_predictions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_quiz_results"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_quiz_results"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_quiz_results"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_submissions_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_submissions_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_submissions_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vote_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_vote_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vote_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_advice_entry"("p_name" "text", "p_advice" "text", "p_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_advice_entry"("p_name" "text", "p_advice" "text", "p_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_advice_entry"("p_name" "text", "p_advice" "text", "p_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_guestbook_entry"("p_guest_name" "text", "p_relationship" "text", "p_message" "text", "p_submitted_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_guestbook_entry"("p_guest_name" "text", "p_relationship" "text", "p_message" "text", "p_submitted_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_guestbook_entry"("p_guest_name" "text", "p_relationship" "text", "p_message" "text", "p_submitted_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_pool_prediction"("p_name" "text", "p_prediction" "text", "p_due_date" "date", "p_weight" numeric, "p_length" integer, "p_ai_roast" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_pool_prediction"("p_name" "text", "p_prediction" "text", "p_due_date" "date", "p_weight" numeric, "p_length" integer, "p_ai_roast" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_pool_prediction"("p_name" "text", "p_prediction" "text", "p_due_date" "date", "p_weight" numeric, "p_length" integer, "p_ai_roast" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_quiz_result"("p_name" "text", "p_p1" "text", "p_p2" "text", "p_p3" "text", "p_p4" "text", "p_p5" "text", "p_score" integer, "p_total" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_quiz_result"("p_name" "text", "p_p1" "text", "p_p2" "text", "p_p3" "text", "p_p4" "text", "p_p5" "text", "p_score" integer, "p_total" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_quiz_result"("p_name" "text", "p_p1" "text", "p_p2" "text", "p_p3" "text", "p_p4" "text", "p_p5" "text", "p_score" integer, "p_total" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_submission"("p_name" "text", "p_activity_type" "text", "p_activity_data" "jsonb") TO "service_role";












GRANT SELECT,INSERT ON TABLE "baby_shower"."submissions" TO "anon";
GRANT SELECT,INSERT ON TABLE "baby_shower"."submissions" TO "authenticated";
GRANT SELECT,INSERT ON TABLE "baby_shower"."submissions" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "baby_shower"."advice_id_seq" TO "service_role";



GRANT ALL ON TABLE "baby_shower"."game_answers" TO "authenticated";
GRANT ALL ON TABLE "baby_shower"."game_answers" TO "service_role";



GRANT SELECT,INSERT ON TABLE "baby_shower"."game_results" TO "anon";
GRANT SELECT,INSERT ON TABLE "baby_shower"."game_results" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "baby_shower"."game_scenarios" TO "anon";
GRANT SELECT,INSERT ON TABLE "baby_shower"."game_scenarios" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "baby_shower"."game_sessions" TO "anon";
GRANT SELECT,INSERT ON TABLE "baby_shower"."game_sessions" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "baby_shower"."game_votes" TO "anon";
GRANT SELECT,INSERT ON TABLE "baby_shower"."game_votes" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "baby_shower"."guestbook" TO "anon";
GRANT SELECT,INSERT ON TABLE "baby_shower"."guestbook" TO "authenticated";
GRANT SELECT,INSERT ON TABLE "baby_shower"."guestbook" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "baby_shower"."guestbook_id_seq" TO "service_role";



GRANT SELECT ON TABLE "baby_shower"."mom_dad_lobbies" TO "anon";
GRANT SELECT ON TABLE "baby_shower"."mom_dad_lobbies" TO "authenticated";
GRANT SELECT ON TABLE "baby_shower"."mom_dad_lobbies" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "baby_shower"."pool_predictions_id_seq" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "baby_shower"."quiz_results_id_seq" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "baby_shower"."submissions_id_seq" TO "service_role";



GRANT SELECT,INSERT ON TABLE "baby_shower"."votes" TO "anon";
GRANT SELECT,INSERT ON TABLE "baby_shower"."votes" TO "authenticated";
GRANT SELECT,INSERT ON TABLE "baby_shower"."votes" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "baby_shower"."votes_id_seq" TO "service_role";









GRANT ALL ON TABLE "public"."advice_v" TO "anon";
GRANT ALL ON TABLE "public"."advice_v" TO "authenticated";
GRANT ALL ON TABLE "public"."advice_v" TO "service_role";



GRANT ALL ON TABLE "public"."appliance_research" TO "anon";
GRANT ALL ON TABLE "public"."appliance_research" TO "authenticated";
GRANT ALL ON TABLE "public"."appliance_research" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appliance_research_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appliance_research_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appliance_research_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."baby_product_research" TO "anon";
GRANT ALL ON TABLE "public"."baby_product_research" TO "authenticated";
GRANT ALL ON TABLE "public"."baby_product_research" TO "service_role";



GRANT ALL ON SEQUENCE "public"."baby_product_research_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."baby_product_research_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."baby_product_research_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."guestbook_v" TO "anon";
GRANT ALL ON TABLE "public"."guestbook_v" TO "authenticated";
GRANT ALL ON TABLE "public"."guestbook_v" TO "service_role";



GRANT ALL ON TABLE "public"."installation_requirements" TO "anon";
GRANT ALL ON TABLE "public"."installation_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."installation_requirements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."installation_requirements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."installation_requirements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."installation_requirements_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."laundry_room_specs" TO "anon";
GRANT ALL ON TABLE "public"."laundry_room_specs" TO "authenticated";
GRANT ALL ON TABLE "public"."laundry_room_specs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."laundry_room_specs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."laundry_room_specs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."laundry_room_specs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."local_retailers_dandenong" TO "anon";
GRANT ALL ON TABLE "public"."local_retailers_dandenong" TO "authenticated";
GRANT ALL ON TABLE "public"."local_retailers_dandenong" TO "service_role";



GRANT ALL ON SEQUENCE "public"."local_retailers_dandenong_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."local_retailers_dandenong_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."local_retailers_dandenong_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pool_predictions_v" TO "anon";
GRANT ALL ON TABLE "public"."pool_predictions_v" TO "authenticated";
GRANT ALL ON TABLE "public"."pool_predictions_v" TO "service_role";



GRANT ALL ON TABLE "public"."pram_research" TO "anon";
GRANT ALL ON TABLE "public"."pram_research" TO "authenticated";
GRANT ALL ON TABLE "public"."pram_research" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pram_research_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pram_research_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pram_research_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pump_analysis" TO "anon";
GRANT ALL ON TABLE "public"."pump_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."pump_analysis" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pump_analysis_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pump_analysis_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pump_analysis_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchases_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_results_v" TO "anon";
GRANT ALL ON TABLE "public"."quiz_results_v" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_results_v" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."submissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."submissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."submissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."submissions_v" TO "anon";
GRANT ALL ON TABLE "public"."submissions_v" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions_v" TO "service_role";



GRANT ALL ON TABLE "public"."vote_counts_v" TO "anon";
GRANT ALL ON TABLE "public"."vote_counts_v" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_counts_v" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



GRANT ALL ON TABLE "public"."votes_v" TO "anon";
GRANT ALL ON TABLE "public"."votes_v" TO "authenticated";
GRANT ALL ON TABLE "public"."votes_v" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































