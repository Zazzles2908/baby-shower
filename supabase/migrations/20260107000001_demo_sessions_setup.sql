-- Demo Game Sessions Setup Script
-- Run this in Supabase Dashboard → SQL Editor
-- Or execute via: supabase db push (after committing this migration)

-- Create demo game sessions for the 4 lobbies
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;

-- Verify insertion
SELECT session_code, mom_name, dad_name, admin_code, status
FROM baby_shower.game_sessions
WHERE session_code LIKE 'LOBBY-%'
ORDER BY session_code;
