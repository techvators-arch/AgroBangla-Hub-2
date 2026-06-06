import { Router } from "express";
import { db } from "@workspace/db";
import { krishokCardsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { VerifyKrishokCardBody, RegisterKrishokCardBody } from "@workspace/api-zod";

const router = Router();

function generateCardNumber(): string {
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");
  return digits;
}

router.post("/krishok-card/verify", async (req, res) => {
  const parse = VerifyKrishokCardBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const { cardNumber, nidNumber } = parse.data;
  const normalizedCard = cardNumber.replace(/\s/g, "");
  let query = db.select().from(krishokCardsTable).where(eq(krishokCardsTable.cardNumber, normalizedCard));
  const [card] = await query;

  if (!card) return res.status(404).json({ error: "Card not found" });
  if (nidNumber && card.nidNumber !== nidNumber) return res.status(400).json({ error: "NID does not match" });

  res.json({
    ...card,
    cropTypes: JSON.parse(card.cropTypes),
    issuedAt: card.issuedAt?.toISOString() ?? null,
    createdAt: card.createdAt.toISOString(),
  });
});

router.post("/krishok-card/register", async (req, res) => {
  const parse = RegisterKrishokCardBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const { cropTypes, ...rest } = parse.data;
  const cardNumber = generateCardNumber();

  const [card] = await db.insert(krishokCardsTable).values({
    ...rest,
    cardNumber,
    cropTypes: JSON.stringify(cropTypes),
    status: "pending",
  }).returning();

  res.status(201).json({
    ...card,
    cropTypes: JSON.parse(card.cropTypes),
    issuedAt: card.issuedAt?.toISOString() ?? null,
    createdAt: card.createdAt.toISOString(),
  });
});

export default router;
