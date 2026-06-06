import { pgTable, text, serial, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  unit: text("unit").notNull(),
  quantity: real("quantity").notNull(),
  district: text("district").notNull(),
  sellerName: text("seller_name").notNull(),
  sellerPhone: text("seller_phone").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isOrganic: boolean("is_organic").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });

export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
