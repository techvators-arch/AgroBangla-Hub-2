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

// ── Precision agriculture ──
export const precisionAgTable = pgTable("precision_agriculture", {
  id: serial("id").primaryKey(),
  fieldId: text("field_id").notNull(),
  cropType: text("crop_type").notNull(),
  fieldSize: real("field_size"),
  soilType: text("soil_type"),
  nitrogen: real("nitrogen"),
  phosphorus: real("phosphorus"),
  potassium: real("potassium"),
  organicMatter: real("organic_matter"),
  recommendation: text("recommendation"),
  nextAction: text("next_action"),
  location: text("location").notNull().default("সাদেরাবাদ"),
  lat: real("lat"),
  lon: real("lon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Drone monitoring ──
export const droneTable = pgTable("drone_monitoring", {
  id: serial("id").primaryKey(),
  droneId: text("drone_id").notNull(),
  status: text("status").notNull().default("নির্঵াচন"), // নির্঵াচন, হারিয়ে দশ, হারিয়ে মশন, রিসেশ্ন
  battery: real("battery"),
  altitude: real("altitude"),
  speed: real("speed"),
  coverageArea: real("coverage_area"),
  lat: real("lat"),
  lon: real("lon"),
  imageUrl: text("image_url"),
  lastMission: text("last_mission"),
  nextMission: text("next_mission"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Market intelligence ──
export const marketPricesTable = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  cropName: text("crop_name").notNull(),
  variety: text("variety"),
  wholesalePrice: real("wholesale_price").notNull(),
  retailPrice: real("retail_price").notNull(),
  marketName: text("market_name").notNull().default("নেত্রকোনা বাজার"),
  district: text("district").default("ঢাকা"),
  trend: text("trend").default("স্থির"), // বেশি, কম, স্থির
  volume: real("volume"),
  unit: text("unit").default("তন"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Smart irrigation ──
export const irrigationTable = pgTable("smart_irrigation", {
  id: serial("id").primaryKey(),
  fieldId: text("field_id").notNull(),
  cropType: text("crop_type").notNull(),
  scheduleType: text("schedule_type").notNull().default("নির্দিষ্ট"), // নির্দিষ্ট, তাত্ক্ষণিক
  startTime: text("start_time"),
  duration: integer("duration"),
  waterAmount: real("water_amount"),
  soilMoistureThreshold: real("soil_moisture_threshold"),
  nextRun: text("next_run"),
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").default("সন্ধি"), // সন্ধি, চলুমান, বান্দ
  location: text("location").notNull().default("সাদেরাবাদ"),
  lat: real("lat"),
  lon: real("lon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Schemas ──
export const insertSensorReadingSchema = createInsertSchema(sensorReadingsTable).omit({ id: true, createdAt: true });
export const insertWeatherDataSchema = createInsertSchema(weatherDataTable).omit({ id: true, createdAt: true });
export const insertAnimalHealthSchema = createInsertSchema(animalHealthTable).omit({ id: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export const insertSensorAlertSchema = createInsertSchema(sensorAlertsTable).omit({ id: true, createdAt: true, isRead: true });
export const insertPrecisionAgSchema = createInsertSchema(precisionAgTable).omit({ id: true, createdAt: true });
export const insertDroneSchema = createInsertSchema(droneTable).omit({ id: true, updatedAt: true });
export const insertMarketPriceSchema = createInsertSchema(marketPricesTable).omit({ id: true, updatedAt: true });
export const insertIrrigationSchema = createInsertSchema(irrigationTable).omit({ id: true, createdAt: true });

export type SensorReading = typeof sensorReadingsTable.$inferSelect;
export type WeatherData = typeof weatherDataTable.$inferSelect;
export type AnimalHealth = typeof animalHealthTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type SensorAlert = typeof sensorAlertsTable.$inferSelect;
export type PrecisionAg = typeof precisionAgTable.$inferSelect;
export type Drone = typeof droneTable.$inferSelect;
export type MarketPrice = typeof marketPricesTable.$inferSelect;
export type Irrigation = typeof irrigationTable.$inferSelect;

export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type InsertAnimalHealth = z.infer<typeof insertAnimalHealthSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertSensorAlert = z.infer<typeof insertSensorAlertSchema>;
export type InsertPrecisionAg = z.infer<typeof insertPrecisionAgSchema>;
export type InsertDrone = z.infer<typeof insertDroneSchema>;
export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type InsertIrrigation = z.infer<typeof insertIrrigationSchema>;
