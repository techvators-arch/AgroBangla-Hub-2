import { pgTable, text, serial, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Sensor readings from rover (soil, water, air) ──
export const sensorReadingsTable = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().default("rover-001"),
  sensorType: text("sensor_type").notNull(), // "soil_moisture", "ph", "salinity", "tds", "temperature", "humidity", "oxygen", "turbidity", "water_level", "wind_speed", "rainfall", "sunlight"
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  location: text("location").notNull().default("সাদেরাবাদ"),
  lat: real("lat"),
  lon: real("lon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Weather data from rover sensors ──
export const weatherDataTable = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  location: text("location").notNull().default("সাদেরাবাদ"),
  lat: real("lat"),
  lon: real("lon"),
  temperature: real("temperature"),
  humidity: real("humidity"),
  windSpeed: real("wind_speed"),
  rainfall: real("rainfall"),
  sunlight: real("sunlight"), // lux or hours
  pressure: real("pressure"),
  uvIndex: real("uv_index"),
  floodRisk: text("flood_risk").default("সাবাবিক"), // সাবাবিক, মামুলি, সরাসরি
  alertLevel: text("alert_level").default("সাবাবিক"), // সাবাবিক, সরতকর, সরাসরি
  forecastJson: text("forecast_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Animal health records ──
export const animalHealthTable = pgTable("animal_health", {
  id: serial("id").primaryKey(),
  animalId: text("animal_id").notNull(), // e.g., "cow-001"
  species: text("species").notNull(), // cow, goat, buffalo, chicken
  name: text("name"),
  age: integer("age"),
  farmerId: text("farmer_id"),
  location: text("location").notNull().default("সাদেরাবাদ"),
  // Vital signs
  temperature: real("temperature"),
  heartRate: integer("heart_rate"),
  respiratoryRate: integer("respiratory_rate"),
  activity: real("activity"), // 0-100
  // Health
  weight: real("weight"),
  feedIntake: real("feed_intake"),
  waterIntake: real("water_intake"),
  healthScore: real("health_score").default(100),
  status: text("status").default("সুস্থ"), // সুস্থ, সরতকর, সরাসরি, রোগাক্রানত
  lastVaccination: text("last_vaccination"),
  lastCheckup: text("last_checkup"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Live chat messages ──
export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull().default("সাদার্ন"), // সাদার্ন, সরাসরি, সাহায্যতা
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull().default("কৃষক"), // কৃষক, বিশেষজ্ঞ, এআই
  message: text("message").notNull(),
  isAi: boolean("is_ai").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Sensor alerts ──
export const sensorAlertsTable = pgTable("sensor_alerts", {
  id: serial("id").primaryKey(),
  sensorType: text("sensor_type").notNull(),
  severity: text("severity").notNull().default("সরতকর"), // সরতকর, সরাসরি
  title: text("title").notNull(),
  description: text("description").notNull(),
  value: real("value"),
  threshold: real("threshold"),
  unit: text("unit"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Schemas ──
export const insertSensorReadingSchema = createInsertSchema(sensorReadingsTable).omit({ id: true, createdAt: true });
export const insertWeatherDataSchema = createInsertSchema(weatherDataTable).omit({ id: true, createdAt: true });
export const insertAnimalHealthSchema = createInsertSchema(animalHealthTable).omit({ id: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export const insertSensorAlertSchema = createInsertSchema(sensorAlertsTable).omit({ id: true, createdAt: true, isRead: true });

export type SensorReading = typeof sensorReadingsTable.$inferSelect;
export type WeatherData = typeof weatherDataTable.$inferSelect;
export type AnimalHealth = typeof animalHealthTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type SensorAlert = typeof sensorAlertsTable.$inferSelect;

export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type InsertAnimalHealth = z.infer<typeof insertAnimalHealthSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertSensorAlert = z.infer<typeof insertSensorAlertSchema>;
