/*
# CreatorFlow — Core Schema

## Overview
Creates the core database tables for CreatorFlow, a social media management app.
Users sign in with email/password (Supabase Auth) and each user sees only their own data.

## New Tables

1. **profiles**
   - Stores user display information (name, bio, avatar).
   - `id` links to `auth.users(id)` — one row per user.
   - Columns: id (uuid PK), email (text), display_name (text), bio (text), avatar_url (text), created_at (timestamptz).

2. **social_accounts**
   - Tracks which social platforms a user has connected.
   - Columns: id (uuid PK), user_id (uuid FK→auth.users), platform (text: twitter/instagram/linkedin/youtube/tiktok), handle (text), display_name (text), avatar_url (text), connected (bool), created_at (timestamptz).
   - Unique constraint on (user_id, platform) — one connection per platform per user.

3. **posts**
   - Stores composed posts across platforms with scheduling support.
   - Columns: id (uuid PK), user_id (uuid FK→auth.users), content (text), media_urls (text[]), platforms (text[]), status (text: draft/scheduled/published/failed), scheduled_for (timestamptz), published_at (timestamptz), created_at (timestamptz), updated_at (timestamptz).

## Security (RLS)
- RLS enabled on all tables.
- All tables scoped to `authenticated` role only (app requires sign-in).
- Owner-scoped CRUD policies using `auth.uid()` on every table.
- `user_id` columns default to `auth.uid()` so inserts work without client passing user_id.
- Grants: SELECT, INSERT, UPDATE, DELETE on all tables to `authenticated` only.
*/

-- =============================================
-- profiles table
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- =============================================
-- social_accounts table
-- =============================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('twitter', 'instagram', 'linkedin', 'youtube', 'tiktok')),
  handle text NOT NULL,
  display_name text,
  avatar_url text,
  connected boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON social_accounts TO authenticated;

DROP POLICY IF EXISTS "select_own_social_accounts" ON social_accounts;
CREATE POLICY "select_own_social_accounts" ON social_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_social_accounts" ON social_accounts;
CREATE POLICY "insert_own_social_accounts" ON social_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_social_accounts" ON social_accounts;
CREATE POLICY "update_own_social_accounts" ON social_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_social_accounts" ON social_accounts;
CREATE POLICY "delete_own_social_accounts" ON social_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- posts table
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  media_urls text[],
  platforms text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO authenticated;

DROP POLICY IF EXISTS "select_own_posts" ON posts;
CREATE POLICY "select_own_posts" ON posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_posts" ON posts;
CREATE POLICY "insert_own_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_posts" ON posts;
CREATE POLICY "update_own_posts" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_posts" ON posts;
CREATE POLICY "delete_own_posts" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
