import { Request, Response } from "express";
import pool from "../../lib/db.js";

// GET /api/v1/catalog/inventory
export const getUserInventory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { category, search, page = "1", limit = "30" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 30));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = ["ui.user_id = $1"];
    let params: any[] = [userId];
    let paramIndex = 2;

    if (category && category !== "All") {
      whereConditions.push(`ci.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`ci.name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM user_inventory ui
       JOIN catalog_items ci ON ui.item_id = ci.id
       ${whereClause}`,
      params
    );
    const totalItems = parseInt(countResult.rows[0].count);

    const itemsResult = await pool.query(
      `SELECT ci.id, ci.name, ci.category, ci.subcategory,
              ci."itemType", ci."thumbnailUrl", ci."robloxAssetId",
              ui.acquired_at
       FROM user_inventory ui
       JOIN catalog_items ci ON ui.item_id = ci.id
       ${whereClause}
       ORDER BY ui.acquired_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    return res.json({
      success: true,
      data: {
        items: itemsResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages: Math.ceil(totalItems / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch inventory" });
  }
};

// POST /api/v1/catalog/inventory/:itemId
export const addToInventory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { itemId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check item exists
    const itemCheck = await pool.query(
      "SELECT id FROM catalog_items WHERE id = $1",
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Add to inventory
    await pool.query(
      `INSERT INTO user_inventory (user_id, item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, item_id) DO NOTHING`,
      [userId, itemId]
    );

    return res.json({ success: true, message: "Item added to inventory" });
  } catch (error) {
    console.error("Error adding to inventory:", error);
    return res.status(500).json({ success: false, message: "Failed to add to inventory" });
  }
};
