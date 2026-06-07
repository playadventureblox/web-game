import { Request, Response } from "express";
import pool from "../../lib/db.js";

// GET /api/v1/catalog/items
export const getCatalogItems = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subcategory,
      search,
      sort = "relevance",
      page = "1",
      limit = "30",
      itemType,
      available,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 30));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Always exclude Rthro heads
    whereConditions.push(`subcategory != 'Heads'`);

    // Category filter
    if (category && category !== "All") {
      whereConditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Subcategory filter
    if (subcategory) {
      whereConditions.push(`subcategory = $${paramIndex}`);
      params.push(subcategory);
      paramIndex++;
    }

    // Search filter (full-text search on name)
    if (search) {
      whereConditions.push(
        `(to_tsvector('english', name) @@ plainto_tsquery('english', $${paramIndex}) OR name ILIKE $${paramIndex + 1})`
      );
      params.push(search);
      params.push(`%${search}%`);
      paramIndex += 2;
    }

    // Item type filter
    if (itemType) {
      whereConditions.push(`"itemType" = $${paramIndex}`);
      params.push(itemType);
      paramIndex++;
    }

    // Availability filter
    if (available === "true") {
      whereConditions.push(`"isAvailable" = true`);
    } else if (available === "false") {
      whereConditions.push(`"isAvailable" = false`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Sort options
    let orderClause = 'ORDER BY "createdAt" DESC';
    switch ((sort as string).toLowerCase()) {
      case "relevance":
        orderClause = 'ORDER BY "isFeatured" DESC, "salesCount" DESC, "createdAt" DESC';
        break;
      case "most favorited":
      case "favorited":
        orderClause = 'ORDER BY "favoriteCount" DESC';
        break;
      case "recently published":
      case "recent":
        orderClause = 'ORDER BY "createdAt" DESC';
        break;
      case "sales":
        orderClause = 'ORDER BY "salesCount" DESC';
        break;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM catalog_items ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // Get items
    const itemsQuery = `
      SELECT id, name, description, "creatorName", category, subcategory,
             "itemType", "thumbnailUrl", "robloxAssetId",
             "isAvailable", "isFeatured", tags, "favoriteCount", "salesCount",
             "createdAt", "updatedAt"
      FROM catalog_items
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);

    const itemsResult = await pool.query(itemsQuery, params);

    res.json({
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
    console.error("Error fetching catalog items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch catalog items",
    });
  }
};

// GET /api/v1/catalog/items/:id
export const getCatalogItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, description, "creatorName", category, subcategory,
              "itemType", "thumbnailUrl", "robloxAssetId",
              "isAvailable", "isFeatured", tags, "favoriteCount", "salesCount",
              "createdAt", "updatedAt"
       FROM catalog_items
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Catalog item not found",
      });
      return;
    }

    res.json({
      success: true,
      data: { item: result.rows[0] },
    });
  } catch (error) {
    console.error("Error fetching catalog item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch catalog item",
    });
  }
};

// GET /api/v1/catalog/categories
export const getCatalogCategories = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT category, COUNT(*) as "itemCount"
      FROM catalog_items
      WHERE "isAvailable" = true AND subcategory != 'Heads'
      GROUP BY category
      ORDER BY category
    `);

    res.json({
      success: true,
      data: { categories: result.rows },
    });
  } catch (error) {
    console.error("Error fetching catalog categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// GET /api/v1/catalog/subcategories/:category
export const getCatalogSubcategories = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    const result = await pool.query(
      `SELECT subcategory, COUNT(*) as "itemCount"
       FROM catalog_items
       WHERE category = $1 AND "isAvailable" = true AND subcategory IS NOT NULL AND subcategory != 'Heads'
       GROUP BY subcategory
       ORDER BY subcategory`,
      [category]
    );

    res.json({
      success: true,
      data: { subcategories: result.rows },
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
    });
  }
};
