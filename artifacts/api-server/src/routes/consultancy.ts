import { Router } from "express";
import { db } from "@workspace/db";
import { consultantsTable, consultancyBookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { BookConsultancyBody } from "@workspace/api-zod";

const router = Router();

router.get("/consultancy", async (_req, res) => {
  const consultants = await db.select().from(consultantsTable);
  res.json(consultants.map(c => ({ ...c, imageUrl: c.imageUrl ?? null })));
});

router.post("/consultancy", async (req, res) => {
  const parse = BookConsultancyBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const consultant = await db.select().from(consultantsTable).where(eq(consultantsTable.id, parse.data.consultantId));
  if (!consultant.length) return res.status(404).json({ error: "Consultant not found" });

  const [booking] = await db.insert(consultancyBookingsTable).values({
    ...parse.data,
    status: "pending",
  }).returning();

  res.status(201).json({
    ...booking,
    consultantName: consultant[0].name,
    createdAt: booking.createdAt.toISOString(),
  });
});

router.get("/consultancy/bookings", async (_req, res) => {
  const bookings = await db.select({
    id: consultancyBookingsTable.id,
    consultantId: consultancyBookingsTable.consultantId,
    consultantName: consultantsTable.name,
    farmerName: consultancyBookingsTable.farmerName,
    phone: consultancyBookingsTable.phone,
    topic: consultancyBookingsTable.topic,
    preferredDate: consultancyBookingsTable.preferredDate,
    status: consultancyBookingsTable.status,
    createdAt: consultancyBookingsTable.createdAt,
  }).from(consultancyBookingsTable)
    .leftJoin(consultantsTable, eq(consultancyBookingsTable.consultantId, consultantsTable.id));

  res.json(bookings.map(b => ({ ...b, createdAt: b.createdAt?.toISOString() })));
});

export default router;
