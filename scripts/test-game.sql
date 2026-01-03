/**
 * Mom vs Dad Game - SQL Test Queries
 * Run these queries in Supabase MCP to test the game
 */

-- TEST 1: Create a game session
-- Returns: session_id, session_code, admin_code
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, total_rounds) 
VALUES ('TESTME', '1234', 'Emma', 'Oliver', 'voting', 3)
RETURNING id, session_code, admin_code, mom_name, dad_name, status;

-- TEST 2: Get the session we just created
SELECT id, session_code, admin_code, mom_name, dad_name, status 
FROM baby_shower.game_sessions 
WHERE session_code = 'TESTME';

-- TEST 3: Create a scenario for the session
-- Replace SESSION_ID with the actual session ID from TEST 2
INSERT INTO baby_shower.game_scenarios (session_id, scenario_text, mom_option, dad_option, intensity)
VALUES (
  'REPLACE_WITH_SESSION_ID',
  "It's 3 AM and the baby has a dirty diaper that requires immediate attention.",
  'Emma would gently clean it up while singing a lullaby',
  'Oliver would make a dramatic production of it while holding their breath',
  0.6
)
RETURNING id, session_id, scenario_text;

-- TEST 4: Submit votes
-- Replace SCENARIO_ID with the actual scenario ID from TEST 3
INSERT INTO baby_shower.game_votes (scenario_id, guest_name, vote_choice)
VALUES 
  ('REPLACE_WITH_SCENARIO_ID', 'Alice', 'mom'),
  ('REPLACE_WITH_SCENARIO_ID', 'Bob', 'dad'),
  ('REPLACE_WITH_SCENARIO_ID', 'Carol', 'mom'),
  ('REPLACE_WITH_SCENARIO_ID', 'Dave', 'mom');

-- TEST 5: Check vote counts
SELECT 
  COUNT(*) FILTER (WHERE vote_choice = 'mom') as mom_votes,
  COUNT(*) FILTER (WHERE vote_choice = 'dad') as dad_votes
FROM baby_shower.game_votes
WHERE scenario_id = 'REPLACE_WITH_SCENARIO_ID';

-- TEST 6: Lock parent answers
INSERT INTO baby_shower.game_answers (scenario_id, mom_answer, dad_answer, mom_locked, dad_locked)
VALUES ('REPLACE_WITH_SCENARIO_ID', 'dad', 'dad', true, true);

-- TEST 7: Create result with perception gap calculation
-- Calculate results manually:
-- Mom votes: 3 (75%), Dad votes: 1 (25%)
-- Crowd picked: mom, Actual: dad
-- Perception gap: 50% (75% wrong - 25% correct)

INSERT INTO baby_shower.game_results (
  scenario_id, mom_votes, dad_votes, crowd_choice, actual_choice, 
  perception_gap, roast_commentary, particle_effect
)
VALUES (
  'REPLACE_WITH_SCENARIO_ID',
  3, 1, 'mom', 'dad',
  50,
  '😅 Oops! 75% were SO wrong! The crowd was absolutely certain about mom, but dad cleaned it up!',
  'confetti'
);

-- TEST 8: Update session status
UPDATE baby_shower.game_sessions
SET status = 'revealed', current_round = 1
WHERE session_code = 'TESTME';

-- VERIFICATION: Check all data
SELECT 
  s.session_code,
  s.mom_name,
  s.dad_name,
  s.status as session_status,
  sc.scenario_text,
  (SELECT COUNT(*) FROM baby_shower.game_votes v WHERE v.scenario_id = sc.id) as vote_count,
  r.roast_commentary,
  r.perception_gap
FROM baby_shower.game_sessions s
LEFT JOIN baby_shower.game_scenarios sc ON sc.session_id = s.id
LEFT JOIN baby_shower.game_results r ON r.scenario_id = sc.id
WHERE s.session_code = 'TESTME';

-- CLEANUP: Remove test data
DELETE FROM baby_shower.game_results WHERE scenario_id IN (
  SELECT id FROM baby_shower.game_scenarios WHERE session_id IN (
    SELECT id FROM baby_shower.game_sessions WHERE session_code = 'TESTME'
  )
);
DELETE FROM baby_shower.game_votes WHERE scenario_id IN (
  SELECT id FROM baby_shower.game_scenarios WHERE session_id IN (
    SELECT id FROM baby_shower.game_sessions WHERE session_code = 'TESTME'
  )
);
DELETE FROM baby_shower.game_answers WHERE scenario_id IN (
  SELECT id FROM baby_shower.game_scenarios WHERE session_id IN (
    SELECT id FROM baby_shower.game_sessions WHERE session_code = 'TESTME'
  )
);
DELETE FROM baby_shower.game_scenarios WHERE session_id IN (
  SELECT id FROM baby_shower.game_sessions WHERE session_code = 'TESTME'
);
DELETE FROM baby_shower.game_sessions WHERE session_code = 'TESTME';
