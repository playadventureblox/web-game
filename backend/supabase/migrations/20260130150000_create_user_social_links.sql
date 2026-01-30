-- Create user_social_links table for storing user social media links
-- Migration: create_user_social_links
-- Created: 2026-01-30

CREATE TABLE IF NOT EXISTS user_social_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'twitter', 'twitch', 'discord', 'facebook', 'instagram', 'tiktok', 'github', 'website')),
  url TEXT NOT NULL,
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", platform)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_social_links_user_id ON user_social_links("userId");

-- Enable RLS
ALTER TABLE user_social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all social links" ON user_social_links FOR SELECT USING (true);
CREATE POLICY "Users can manage their own social links" ON user_social_links FOR ALL USING ("userId" = auth.uid()::TEXT);

-- Add comment
COMMENT ON TABLE user_social_links IS 'Stores user social media links displayed on profile pages';
