# Research: Supabase RLS Best Practices and Security Remediation

## Executive Summary

This research analyzes Supabase Row Level Security (RLS) best practices and security vulnerabilities for the Baby Shower project, which has 34+ permissive RLS policies and 8 SECURITY DEFINER views requiring remediation. The report provides actionable patterns, real-world examples, and a comprehensive security hardening checklist.

## Key Findings

### Critical Security Issues Identified
1. **34+ RLS policies using `WITH CHECK (true)`** - Complete bypass of security controls
2. **8 SECURITY DEFINER views** - Privilege escalation vulnerability
3. **Missing role specifications** - Policies apply to all roles including anonymous users
4. **No performance optimization** - Missing indexes on policy columns
5. **Mutable search_path** - Function hijacking vulnerability

### Documentation Sources
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL CREATE FUNCTION Security](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase RLS Performance Guide](https://github.com/orgs/supabase/discussions/14576)
- [PostgreSQL Search Path Configuration](https://www.postgresql.org/docs/current/runtime-config-client.html)

## RLS Policy Best Practices

### 1. Proper Policy Structure

**❌ INCORRECT - Permissive Policy**
```sql
CREATE POLICY "Allow all operations" ON baby_shower.game_sessions
FOR ALL USING (true) WITH CHECK (true);
```

**✅ CORRECT - Secure Policy with Role Specification**
```sql
-- Enable RLS first
ALTER TABLE baby_shower.game_sessions ENABLE ROW LEVEL SECURITY;

-- Create specific policies for each operation
CREATE POLICY "Game sessions viewable by participants" 
ON baby_shower.game_sessions FOR SELECT 
TO authenticated 
USING (
  session_code IN (
    SELECT session_code FROM baby_shower.game_participants 
    WHERE participant_name = current_setting('request.jwt.claims', true)::json->>'name'
  )
);

CREATE POLICY "Game sessions insert by authenticated" 
ON baby_shower.game_sessions FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  admin_code IS NOT NULL AND 
  LENGTH(admin_code) = 4
);
```

### 2. Performance Optimization Patterns

**Function Wrapping for Performance**
```sql
-- ❌ SLOW - Function called per row
CREATE POLICY "Slow policy" ON baby_shower.game_votes
FOR SELECT USING (auth.uid() = user_id);

-- ✅ FAST - Function wrapped in SELECT
CREATE POLICY "Fast policy" ON baby_shower.game_votes  
FOR SELECT USING ((SELECT auth.uid()) = user_id);
```

**Index Requirements**
```sql
-- Add indexes on columns used in RLS policies
CREATE INDEX idx_game_sessions_session_code ON baby_shower.game_sessions(session_code);
CREATE INDEX idx_game_votes_guest_name ON baby_shower.game_votes(guest_name);
CREATE INDEX idx_game_participants_participant_name ON baby_shower.game_participants(participant_name);
```

### 3. Game Session Security Patterns

**Session-Based Access Control**
```sql
-- Policy for game scenarios - only accessible to session participants
CREATE POLICY "Game scenarios accessible by session participants"
ON baby_shower.game_scenarios FOR SELECT 
TO authenticated
USING (
  session_id IN (
    SELECT id FROM baby_shower.game_sessions 
    WHERE session_code IN (
      SELECT session_code FROM baby_shower.game_participants 
      WHERE participant_name = current_setting('request.jwt.claims', true)::json->>'name'
    )
  )
);

-- Policy for votes - guests can only vote in their session
CREATE POLICY "Votes limited to session participants" 
ON baby_shower.game_votes FOR ALL
TO authenticated
USING (
  scenario_id IN (
    SELECT id FROM baby_shower.game_scenarios 
    WHERE session_id IN (
      SELECT session_id FROM baby_shower.game_participants
      WHERE participant_name = current_setting('request.jwt.claims', true)::json->>'name'
    )
  )
);
```

## SECURITY DEFINER Remediation

### Understanding the Risk
SECURITY DEFINER functions execute with the privileges of the function owner, not the caller. This creates privilege escalation vulnerabilities when:
1. Functions are created by superusers
2. Search path is mutable
3. Functions access sensitive data

### Secure Function Pattern

**❌ VULNERABLE - Mutable Search Path**
```sql
CREATE FUNCTION baby_shower.get_game_results(session_uuid UUID)
RETURNS TABLE (...) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM game_results WHERE session_id = session_uuid;
END;
$$;
```

**✅ SECURE - Fixed Search Path**
```sql
CREATE FUNCTION baby_shower.get_game_results(session_uuid UUID)
RETURNS TABLE (...) 
LANGUAGE plpgsql
SECURITY DEFINER
-- Set secure search path: trusted schemas only, pg_temp last
SET search_path = baby_shower, pg_temp
AS $$
BEGIN
  -- Validate input
  IF session_uuid IS NULL THEN
    RAISE EXCEPTION 'Session UUID cannot be null';
  END IF;
  
  -- Check user has access to this session
  IF NOT EXISTS (
    SELECT 1 FROM baby_shower.game_sessions 
    WHERE id = session_uuid 
    AND session_code IN (
      SELECT session_code FROM baby_shower.game_participants 
      WHERE participant_name = current_setting('request.jwt.claims', true)::json->>'name'
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to game session';
  END IF;
  
  RETURN QUERY SELECT * FROM baby_shower.game_results WHERE session_id = session_uuid;
END;
$$;

-- Restrict execution privileges
REVOKE ALL ON FUNCTION baby_shower.get_game_results(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION baby_shower.get_game_results(UUID) TO authenticated;
```

### View Security Migration

**Replace SECURITY DEFINER Views**
```sql
-- ❌ REMOVE - Security definer view
DROP VIEW IF EXISTS baby_shower.game_results_view;

-- ✅ CREATE - Security invoker view (PostgreSQL 15+)
CREATE VIEW baby_shower.game_results_view 
WITH (security_invoker = true)
AS 
SELECT 
  gr.id,
  gr.scenario_id,
  gr.mom_votes,
  gr.dad_votes,
  gr.perception_gap,
  gr.roast_commentary,
  gs.session_id
FROM baby_shower.game_results gr
JOIN baby_shower.game_scenarios gs ON gr.scenario_id = gs.id;

-- For PostgreSQL < 15, use RLS on underlying tables
ALTER VIEW baby_shower.game_results_view OWNER TO postgres;
REVOKE ALL ON baby_shower.game_results_view FROM anon, authenticated;
```

## Real-World Code Examples

### Example 1: Production RLS from Supabase Community
```sql
-- From: https://github.com/GaryAustin1/RLS-Performance
-- Pattern: Multi-tenant application with team-based access

CREATE POLICY "Users can access their team data" 
ON public.projects FOR ALL 
TO authenticated 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = (SELECT auth.uid())
  )
) WITH CHECK (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = (SELECT auth.uid())
  )
);
```

### Example 2: Game Session Security Pattern
```sql
-- Pattern: Session-based multiplayer game
CREATE POLICY "Game data accessible by session members"
ON public.game_data FOR SELECT 
TO authenticated 
USING (
  session_id IN (
    SELECT session_id FROM public.session_players 
    WHERE player_id = (SELECT auth.uid())
    AND joined_at <= NOW()
    AND (left_at IS NULL OR left_at > NOW())
  )
);
```

### Example 3: Anonymous Guest Access Pattern
```sql
-- Pattern: Anonymous guests with session codes
CREATE POLICY "Anonymous guests with valid session code"
ON public.guestbook_entries FOR SELECT 
TO anon, authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE code = current_setting('request.headers', true)::json->>'x-session-code'
    AND expires_at > NOW()
  )
);
```

## Search Path Security

### Understanding the Risk
Mutable search_path allows function hijacking through schema precedence attacks.

### Secure Configuration
```sql
-- Set secure search_path for SECURITY DEFINER functions
ALTER FUNCTION baby_shower.get_game_results(UUID) 
SET search_path = baby_shower, pg_temp;

-- Global secure search_path configuration
ALTER DATABASE your_database SET search_path = "$user", baby_shower, public, pg_temp;

-- Function creation with secure search_path
CREATE OR REPLACE FUNCTION baby_shower.secure_function()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = baby_shower, pg_temp  -- Explicit secure path
AS $$
BEGIN
  -- Function body
END;
$$;
```

## Recommended Approach for Baby Shower Project

### Phase 1: Critical Security Fixes (Week 1)
1. **Audit Current Policies**: Document all 34+ permissive policies
2. **Implement Role-Based Access**: Add `TO authenticated` clauses
3. **Remove `WITH CHECK (true)`**: Replace with proper validation
4. **Secure Game Sessions**: Implement session-based access control

### Phase 2: Performance Optimization (Week 2)
1. **Add Indexes**: Create indexes on all policy columns
2. **Function Wrapping**: Wrap auth functions in SELECT statements
3. **Query Optimization**: Add explicit filters alongside RLS
4. **Security Definer Review**: Audit and secure all 8 views

### Phase 3: Advanced Security (Week 3)
1. **Input Validation**: Add comprehensive input validation
2. **Rate Limiting**: Implement rate limiting for game operations
3. **Audit Logging**: Add security event logging
4. **Testing**: Comprehensive security testing

## Security Hardening Checklist

### RLS Policy Requirements
- [ ] All tables have RLS enabled
- [ ] No policies use `USING (true)` or `WITH CHECK (true)`
- [ ] All policies specify roles with `TO` clause
- [ ] Policies validate `auth.uid() IS NOT NULL`
- [ ] Indexes exist on all columns used in policies
- [ ] Function calls wrapped in SELECT for performance
- [ ] Policies handle both authenticated and anonymous users appropriately

### SECURITY DEFINER Requirements
- [ ] All SECURITY DEFINER functions have explicit `SET search_path`
- [ ] Search path excludes user-writable schemas
- [ ] `pg_temp` specified last in search path
- [ ] Functions validate all input parameters
- [ ] Execution privileges restricted from PUBLIC
- [ ] Views use `security_invoker = true` (PostgreSQL 15+)
- [ ] Alternative security patterns for PostgreSQL < 15

### Game Session Security
- [ ] Session codes are unique and unpredictable
- [ ] Admin PINs are properly hashed and validated
- [ ] Guests can only access their session data
- [ ] Vote integrity maintained (no duplicate votes)
- [ ] Real-time updates respect RLS policies
- [ ] Game state transitions are properly authorized

### Performance Optimization
- [ ] Benchmark queries with and without RLS
- [ ] Add indexes on foreign key columns
- [ ] Use security definer functions for complex joins
- [ ] Implement query result caching where appropriate
- [ ] Monitor RLS performance in production

## Estimated Effort

### RLS Remediation (2-3 weeks)
- **Policy Rewrite**: 1 week for 34+ policies
- **Index Creation**: 2-3 days
- **Testing**: 3-4 days
- **Performance Tuning**: 2-3 days

### SECURITY DEFINER Remediation (1-2 weeks)
- **View Analysis**: 2-3 days
- **Function Security**: 3-4 days
- **Search Path Hardening**: 2-3 days
- **Privilege Review**: 2-3 days

### Game Session Security (1-2 weeks)
- **Session Access Control**: 3-4 days
- **Vote Integrity**: 2-3 days
- **Real-time Security**: 2-3 days
- **Admin Authentication**: 2-3 days

**Total Estimated Effort: 4-7 weeks for complete remediation**

## Next Steps

1. **Immediate Action**: Audit current RLS policies and identify critical vulnerabilities
2. **Priority 1**: Fix permissive policies with `WITH CHECK (true)`
3. **Priority 2**: Secure SECURITY DEFINER views and functions
4. **Priority 3**: Implement proper game session access controls
5. **Priority 4**: Performance optimization and testing

## Sources

1. [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
2. [PostgreSQL Security Documentation](https://www.postgresql.org/docs/current/sql-createfunction.html)
3. [Supabase RLS Performance Guide](https://github.com/orgs/supabase/discussions/14576)
4. [PostgreSQL Search Path Security](https://www.postgresql.org/docs/current/runtime-config-client.html)
5. Community examples from production Supabase projects