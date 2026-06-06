import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, count, avg } from "drizzle-orm";
import { CreateProductBody, GetProductParams, DeleteProductParams } from "@workspace/api-zod";

const router = Router();

router.get("/marketplace/products", async (req, res) => {
  const { category, search, district } = req.query as { category?: string; search?: string; district?: string };

  let products = await db.select().from(productsTable).orderBy(productsTable.createdAt);

  if (category) products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  if (district) products = products.filter(p => p.district.toLowerCase() === district.toLowerCase());
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(s) || p.nameBn.includes(s));
  }

  res.json(products.map(p => ({ ...p, imageUrl: p.imageUrl ?? null, description: p.description ?? null, createdAt: p.createdAt.toISOString() })));
});

router.post("/marketplace/products", async (req, res) => {
  const parse = CreateProductBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const [product] = await db.insert(productsTable).values(parse.data).returning();
  res.status(201).json({ ...product, imageUrl: product.imageUrl ?? null, description: product.description ?? null, createdAt: product.createdAt.toISOString() });
});

router.get("/marketplace/products/:id", async (req, res) => {
  const parse = GetProductParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid ID" });

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parse.data.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ ...product, imageUrl: product.imageUrl ?? null, description: product.description ?? null, createdAt: product.createdAt.toISOString() });
});

router.delete("/marketplace/products/:id", async (req, res) => {
  const parse = DeleteProductParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(productsTable).where(eq(productsTable.id, parse.data.id));
  res.status(204).send();
});

router.get("/marketplace/stats", async (_req, res) => {
  const [total] = await db.select({ count: count(), avg: avg(productsTable.price) }).from(productsTable);

  const all = await db.select().from(productsTable);
  const categoryMap: Record<string, number> = {};
  const districtSet = new Set<string>();
  const sellerSet = new Set<string>();

  for (const p of all) {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    districtSet.add(p.district);
    sellerSet.add(p.sellerPhone);
  }

  const topCategories = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  res.json({
    totalProducts: Number(total.count),
    totalSellers: sellerSet.size,
    totalDistricts: districtSet.size,
    avgPrice: Number(total.avg) || 0,
    topCategories,
  });
});

export default router;
