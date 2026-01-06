-- Demo Game Sessions for Mom vs Dad Game
-- Run this SQL in Supabase SQL Editor to create demo sessions

-- Insert demo game sessions (will not overwrite if they exist)
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES 
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;

-- Verify the sessions were created
SELECT session_code, mom_name, dad_name, status, admin_code 
FROM baby_shower.game_sessions 
WHERE session_code IN ('LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D')
ORDER BY session_code;
