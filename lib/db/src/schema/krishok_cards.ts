import { pgTable, text, serial, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const krishokCardsTable = pgTable("krishok_cards", {
  id: serial("id").primaryKey(),
  cardNumber: text("card_number").notNull().unique(),
  farmerName: text("farmer_name").notNull(),
  farmerNameBn: text("farmer_name_bn").notNull(),
  fatherName: text("father_name").notNull(),
  nidNumber: text("nid_number").notNull().unique(),
  district: text("district").notNull(),
  upazila: text("upazila").notNull(),
  village: text("village").notNull(),
  phone: text("phone").notNull(),
  landSize: real("land_size").notNull(),
  cropTypes: text("crop_types").notNull(),
  status: text("status").notNull().default("pending"),
  issuedAt: timestamp("issued_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertKrishokCardSchema = createInsertSchema(krishokCardsTable).omit({ id: true, cardNumber: true, status: true, issuedAt: true, createdAt: true });

export type KrishokCard = typeof krishokCardsTable.$inferSelect;
export type InsertKrishokCard = z.infer<typeof insertKrishokCardSchema>;
