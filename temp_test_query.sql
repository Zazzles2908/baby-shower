-- Test Query to find setup sessions
SELECT session_code, mom_name, dad_name, admin_code, status, total_rounds 
FROM baby_shower.game_sessions 
WHERE status = 'setup' 
ORDER BY created_at DESC 
LIMIT 5;
