import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function generateTrackingCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `AGR${num}`;
}

router.post("/orders", async (req, res) => {
  const { buyerName, buyerPhone, buyerAddress, items, total } = req.body;

  if (!buyerName || !buyerPhone || !buyerAddress || !Array.isArray(items) || !items.length || typeof total !== "number") {
    return res.status(400).json({ error: "Invalid input" });
  }

  let trackingCode = generateTrackingCode();
  for (let i = 0; i < 5; i++) {
    const existing = await db.select().from(ordersTable).where(eq(ordersTable.trackingCode, trackingCode));
    if (!existing.length) break;
    trackingCode = generateTrackingCode();
  }

  const [order] = await db.insert(ordersTable).values({
    trackingCode,
    buyerName,
    buyerPhone,
    buyerAddress,
    items,
    total,
    status: "pending",
  }).returning();

  res.status(201).json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
});

router.get("/orders/track/:code", async (req, res) => {
  const code = req.params.code.toUpperCase();
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.trackingCode, code));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
});

router.get("/orders/phone/:phone", async (req, res) => {
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.buyerPhone, req.params.phone));
  res.json(orders.map(o => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  })));
});

export default router;
