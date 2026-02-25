import { Request, Response } from "express";
import db from '../../lib/db.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'adventureblox-admin-secret-2024';

/**
 * Middleware: verify admin secret header
 */
export const requireAdmin = (req: Request, res: Response, next: any) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

/**
 * GET /api/v1/admin/users
 * List all users with basic info
 */
export const listUsers = async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT
        id,
        username,
        "displayName" as display_name,
        email,
        "createdAt" as created_at,
        "presenceStatus" as presence_status,
        "isVerified" as is_verified
       FROM users
       ORDER BY "createdAt" DESC
       LIMIT 500`
    );
    return res.json({ success: true, data: { users: result.rows } });
  } catch (err) {
    console.error('Admin listUsers error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * DELETE /api/v1/admin/users/:userId
 * Hard delete a user and all their data (cascades via FK)
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const check = await db.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    return res.json({ success: true, message: `User ${check.rows[0].username} deleted` });
  } catch (err) {
    console.error('Admin deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v1/admin/groups
 * List all groups with basic info
 */
export const listGroups = async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT
        g.id,
        g."groupNumber" as group_number,
        g.name,
        g.description,
        g."createdAt" as created_at,
        u.username as owner_username,
        u."displayName" as owner_display_name,
        (SELECT COUNT(*) FROM group_members gm WHERE gm."groupId" = g.id)::int as member_count
       FROM groups g
       LEFT JOIN users u ON g."ownerId" = u.id
       ORDER BY g."createdAt" DESC
       LIMIT 500`
    );
    return res.json({ success: true, data: { groups: result.rows } });
  } catch (err) {
    console.error('Admin listGroups error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * DELETE /api/v1/admin/groups/:groupId
 * Hard delete a group and all its data
 */
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const check = await db.query('SELECT id, name FROM groups WHERE id = $1', [groupId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    await db.query('DELETE FROM groups WHERE id = $1', [groupId]);
    return res.json({ success: true, message: `Group "${check.rows[0].name}" deleted` });
  } catch (err) {
    console.error('Admin deleteGroup error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
