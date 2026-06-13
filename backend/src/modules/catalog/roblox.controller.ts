import { Request, Response } from "express";
import pool from "../../lib/db.js";

const ROBLOX_CATALOG_URL = "https://catalog.roblox.com/v1/search/items/details";
const ROBLOX_THUMBNAILS_URL = "https://thumbnails.roblox.com/v1/assets";

export const searchRobloxCatalog = async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      category,
      limit = "30",
      cursor,
    } = req.query;

    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword as string);
    if (category) params.append("Category", category as string);
    params.append("Limit", limit as string);
    if (cursor) params.append("cursor", cursor as string);

    const catalogRes = await fetch(`${ROBLOX_CATALOG_URL}?${params.toString()}`);
    if (!catalogRes.ok) {
      return res.status(502).json({ success: false, message: "Failed to fetch from Roblox" });
    }

    const catalogData = await catalogRes.json() as any;
    const items = catalogData.data || [];

    let thumbnailMap: Record<number, string> = {};

    // Get thumbnails for Assets
    const assetIds = items
      .filter((item: any) => item.itemType === "Asset")
      .map((item: any) => item.id)
      .join(",");

    if (assetIds) {
      const thumbRes = await fetch(
        `${ROBLOX_THUMBNAILS_URL}?assetIds=${assetIds}&size=150x150&format=Png`
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json() as any;
        (thumbData.data || []).forEach((t: any) => {
          if (t.state === "Completed") {
            thumbnailMap[t.targetId] = t.imageUrl;
          }
        });
      }
    }

    // Get thumbnails for Bundles
    const bundleIds = items
      .filter((item: any) => item.itemType === "Bundle")
      .map((item: any) => item.id)
      .join(",");

    if (bundleIds) {
      const bundleThumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/bundles/thumbnails?bundleIds=${bundleIds}&size=150x150&format=Png`
      );
      if (bundleThumbRes.ok) {
        const bundleThumbData = await bundleThumbRes.json() as any;
        (bundleThumbData.data || []).forEach((t: any) => {
          if (t.state === "Completed") {
            thumbnailMap[t.targetId] = t.imageUrl;
          }
        });
      }
    }

    const mappedItems = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      itemType: item.itemType,
      assetType: item.assetType,
      creatorName: item.creatorName,
      price: item.price,
      priceStatus: item.priceStatus,
      favoriteCount: item.favoriteCount,
      thumbnailUrl: thumbnailMap[item.id] || null,
      robloxAssetId: String(item.id),
    }));

    return res.json({
      success: true,
      data: {
        items: mappedItems,
        nextPageCursor: catalogData.nextPageCursor || null,
        previousPageCursor: catalogData.previousPageCursor || null,
      },
    });
  } catch (error) {
    console.error("Error fetching Roblox catalog:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch Roblox catalog" });
  }
};

export const importRobloxItem = async (req: Request, res: Response) => {
  try {
    const { robloxAssetId } = req.params;

    // Check if item already exists in our catalog
    const existing = await pool.query(
      `SELECT id FROM catalog_items WHERE "robloxAssetId" = $1`,
      [robloxAssetId]
    );

    if (existing.rows.length > 0) {
      return res.json({ success: true, data: { id: existing.rows[0].id } });
    }

    // Fetch item details from Roblox
    const detailRes = await fetch(
      `https://catalog.roblox.com/v1/catalog/items/${robloxAssetId}/details`
    );

    let name = `Roblox Item ${robloxAssetId}`;
    let description = "";
    let creatorName = "Roblox";

    if (detailRes.ok) {
      const detail = await detailRes.json() as any;
      name = detail.name || name;
      description = detail.description || "";
      creatorName = detail.creatorName || "Roblox";
    }

    // Get thumbnail
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${robloxAssetId}&size=150x150&format=Png`
    );
    let thumbnailUrl = "";
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json() as any;
      thumbnailUrl = thumbData.data?.[0]?.imageUrl || "";
    }

    // Insert into catalog
    const result = await pool.query(
      `INSERT INTO catalog_items (id, name, description, "creatorName", category, subcategory, "itemType", "thumbnailUrl", "robloxAssetId", "isAvailable", "isFeatured", tags, "favoriteCount", "salesCount", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'Accessories', 'Roblox Items', 'Asset', $4, $5, true, false, ARRAY[]::text[], 0, 0, NOW(), NOW())
       ON CONFLICT ("robloxAssetId") DO UPDATE SET "thumbnailUrl" = $4
       RETURNING id`,
      [name, description, creatorName, thumbnailUrl, robloxAssetId]
    );

    return res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    console.error("Import Roblox item error:", error);
    return res.status(500).json({ success: false, message: "Failed to import item" });
  }
};
