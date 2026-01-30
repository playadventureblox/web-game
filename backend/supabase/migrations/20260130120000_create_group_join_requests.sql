-- Create group_join_requests table for managing join requests when manual approval is enabled
CREATE TABLE IF NOT EXISTS group_join_requests (
  id TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "respondedAt" TIMESTAMPTZ,
  "respondedBy" TEXT REFERENCES users(id) ON DELETE SET NULL,
  message TEXT,
  UNIQUE("groupId", "userId")
);

-- Create indexes for better query performance
CREATE INDEX idx_join_requests_group_id ON group_join_requests("groupId");
CREATE INDEX idx_join_requests_user_id ON group_join_requests("userId");
CREATE INDEX idx_join_requests_status ON group_join_requests(status);
CREATE INDEX idx_join_requests_requested_at ON group_join_requests("requestedAt" DESC);

-- Enable Row Level Security
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_join_requests
CREATE POLICY "Users can view their own join requests"
  ON group_join_requests FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Group admins can view join requests for their group"
  ON group_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      INNER JOIN group_roles gr ON gm."roleId" = gr.id
      WHERE gm."groupId" = group_join_requests."groupId"
      AND gm."userId" = auth.uid()::TEXT
      AND (gr.name = 'Owner' OR gr."canManageMembers" = true)
    )
  );

CREATE POLICY "Users can create join requests"
  ON group_join_requests FOR INSERT
  WITH CHECK (auth.uid()::TEXT = "userId");

CREATE POLICY "Group admins can update join requests"
  ON group_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      INNER JOIN group_roles gr ON gm."roleId" = gr.id
      WHERE gm."groupId" = group_join_requests."groupId"
      AND gm."userId" = auth.uid()::TEXT
      AND (gr.name = 'Owner' OR gr."canManageMembers" = true)
    )
  );

CREATE POLICY "Users can delete their own pending join requests"
  ON group_join_requests FOR DELETE
  USING (auth.uid()::TEXT = "userId" AND status = 'pending');
