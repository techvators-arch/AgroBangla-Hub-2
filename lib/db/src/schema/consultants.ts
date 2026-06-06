import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const consultantsTable = pgTable("consultants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  specialization: text("specialization").notNull(),
  specializationBn: text("specialization_bn").notNull(),
  district: text("district").notNull(),
  experience: integer("experience").notNull(),
  rating: real("rating").notNull().default(4.5),
  totalSessions: integer("total_sessions").notNull().default(0),
  available: boolean("available").notNull().default(true),
  fee: real("fee").notNull(),
  imageUrl: text("image_url"),
});

export const consultancyBookingsTable = pgTable("consultancy_bookings", {
  id: serial("id").primaryKey(),
  consultantId: integer("consultant_id").notNull().references(() => consultantsTable.id),
  farmerName: text("farmer_name").notNull(),
  phone: text("phone").notNull(),
  topic: text("topic").notNull(),
  preferredDate: text("preferred_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConsultantSchema = createInsertSchema(consultantsTable).omit({ id: true });
export const insertBookingSchema = createInsertSchema(consultancyBookingsTable).omit({ id: true, createdAt: true, status: true });

export type Consultant = typeof consultantsTable.$inferSelect;
export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type ConsultancyBooking = typeof consultancyBookingsTable.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
