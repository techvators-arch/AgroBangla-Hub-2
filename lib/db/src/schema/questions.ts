import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  farmerName: text("farmer_name").notNull(),
  district: text("district").notNull(),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questionsTable.id),
  body: text("body").notNull(),
  authorName: text("author_name").notNull(),
  isExpert: boolean("is_expert").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true, isResolved: true });
export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, createdAt: true });

export type Question = typeof questionsTable.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Answer = typeof answersTable.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
