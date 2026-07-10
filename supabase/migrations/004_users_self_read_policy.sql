-- Allow an authenticated user to read their own row.
-- Needed by GET /api/auth/me — the users table had RLS enabled (migration
-- 002) but no SELECT policy, so it default-denied everyone except the
-- service role.
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth_id = auth.uid());
