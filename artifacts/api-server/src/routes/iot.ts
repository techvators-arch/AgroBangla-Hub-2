import { Router } from "express";
import { db } from "@workspace/db";
import {
  sensorReadingsTable, weatherDataTable, animalHealthTable,
  chatMessagesTable, sensorAlertsTable,
  precisionAgTable, droneTable, marketPricesTable, irrigationTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// ── 1. WEATHER ──
router.get("/weather/current", async (_req, res) => {
  const rows = await db.select().from(weatherDataTable).orderBy(desc(weatherDataTable.createdAt)).limit(1);
  if (!rows.length) {
    return res.json({
      location: "ময়মনসিংহ",
      temperature: 32.5, humidity: 78, windSpeed: 12, rainfall: 2.5,
      sunlight: 850, pressure: 1012, uvIndex: 6.8,
      floodRisk: "স্বাভাবিক", alertLevel: "স্বাভাবিক",
      updatedAt: new Date().toISOString(),
    });
  }
  res.json({ ...rows[0], updatedAt: rows[0].createdAt.toISOString() });
});

router.get("/weather/forecast", async (_req, res) => {
  const now = new Date();
  const labels = ["আজ", "কাল", "পরশু", "তরশু", "চার দিন পর"];
  const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  const forecast = Array.from({ length: 5 }, (_, i) => {
    const day = new Date(now); day.setDate(day.getDate() + i);
    const temp = 28 + Math.random() * 8;
    const hum = 60 + Math.random() * 35;
    const rain = Math.random() * 15;
    const wind = 5 + Math.random() * 20;
    const sun = 400 + Math.random() * 800;
    const floodRisk = rain > 10 ? "বিপদজনক" : rain > 5 ? "মাঝারি" : "স্বাভাবিক";
    const alert = rain > 12 ? "বিপদজনক" : rain > 7 ? "সতর্ক" : "স্বাভাবিক";
    return {
      date: `${day.getDate()} ${months[day.getMonth()]}`, label: labels[i],
      temperature: parseFloat(temp.toFixed(1)), humidity: parseFloat(hum.toFixed(1)),
      rainfall: parseFloat(rain.toFixed(1)), windSpeed: parseFloat(wind.toFixed(1)),
      sunlight: parseFloat(sun.toFixed(0)), floodRisk, alertLevel: alert,
      condition: rain > 5 ? "বৃষ্টি" : hum > 80 ? "মেঘলা" : "রোদেলা",
    };
  });
  res.json(forecast);
});

router.post("/weather/ingest", async (req, res) => {
  const { location, temperature, humidity, windSpeed, rainfall, sunlight, pressure, uvIndex, lat, lon } = req.body;
  const floodRisk = rainfall > 50 ? "বিপদজনক" : rainfall > 25 ? "মাঝারি" : "স্বাভাবিক";
  const alertLevel = rainfall > 50 ? "বিপদজনক" : temperature > 40 ? "সতর্ক" : "স্বাভাবিক";
  const [row] = await db.insert(weatherDataTable).values({
    location: location || "ময়মনসিংহ",
    temperature, humidity, windSpeed, rainfall, sunlight, pressure, uvIndex,
    lat, lon, floodRisk, alertLevel,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// ── 2. SENSOR DASHBOARD ──
router.get("/sensor/readings", async (req, res) => {
  const { type, limit = "24" } = req.query as { type?: string; limit?: string };
  const l = Math.min(parseInt(limit) || 24, 200);
  const rows = type
    ? await db.select().from(sensorReadingsTable).where(eq(sensorReadingsTable.sensorType, type)).orderBy(desc(sensorReadingsTable.createdAt)).limit(l)
    : await db.select().from(sensorReadingsTable).orderBy(desc(sensorReadingsTable.createdAt)).limit(l);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/sensor/dashboard", async (_req, res) => {
  const sensors = ["soil_moisture", "ph", "salinity", "tds", "oxygen", "turbidity", "water_level", "temperature"];
  const dashboard = await Promise.all(
    sensors.map(async (type) => {
      const rows = await db.select().from(sensorReadingsTable).where(eq(sensorReadingsTable.sensorType, type)).orderBy(desc(sensorReadingsTable.createdAt)).limit(1);
      if (!rows.length) return null;
      return { type, ...rows[0], createdAt: rows[0].createdAt.toISOString() };
    })
  );
  res.json(dashboard.filter(Boolean));
});

router.post("/sensor/ingest", async (req, res) => {
  const { deviceId, sensorType, value, unit, location, lat, lon } = req.body;
  const [row] = await db.insert(sensorReadingsTable).values({
    deviceId: deviceId || "rover-001", sensorType, value, unit,
    location: location || "ময়মনসিংহ", lat, lon,
  }).returning();
  const thresholdMap: Record<string, { max: number; min: number; unit: string }> = {
    soil_moisture: { min: 30, max: 80, unit: "%" },
    ph: { min: 5.5, max: 8.5, unit: "pH" },
    salinity: { min: 0, max: 4, unit: "dS/m" },
    tds: { min: 0, max: 1000, unit: "ppm" },
    oxygen: { min: 4, max: 15, unit: "mg/L" },
    turbidity: { min: 0, max: 5, unit: "NTU" },
    water_level: { min: 20, max: 100, unit: "%" },
    temperature: { min: 15, max: 40, unit: "°C" },
  };
  const t = thresholdMap[sensorType];
  if (t && (value < t.min || value > t.max)) {
    const severity = value > t.max * 1.5 || value < t.min * 0.5 ? "বিপদজনক" : "সতর্ক";
    const title = value > t.max ? `${sensorType} মান বেশি` : `${sensorType} মান কম`;
    await db.insert(sensorAlertsTable).values({
      sensorType, severity, title,
      description: `${sensorType} সেন্সরের রিডিং ${value} ${t.unit} হয়েছে। স্বাভাবিক সীমা ${t.min} - ${t.max} ${t.unit}।`,
      value, threshold: value > t.max ? t.max : t.min, unit: t.unit,
    });
  }
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/sensor/alerts", async (req, res) => {
  const { unread } = req.query as { unread?: string };
  const rows = unread === "true"
    ? await db.select().from(sensorAlertsTable).where(eq(sensorAlertsTable.isRead, false)).orderBy(desc(sensorAlertsTable.createdAt))
    : await db.select().from(sensorAlertsTable).orderBy(desc(sensorAlertsTable.createdAt));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.patch("/sensor/alerts/:id/read", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.update(sensorAlertsTable).set({ isRead: true }).where(eq(sensorAlertsTable.id, id));
  res.json({ success: true });
});

// ── 3. ANIMAL HEALTH ──
// NOTE: /alerts must come BEFORE /:animalId to avoid Express matching "alerts" as an ID
router.get("/animal-health/alerts", async (_req, res) => {
  const rows = await db.select().from(animalHealthTable).where(eq(animalHealthTable.status, "বিপদজনক")).orderBy(desc(animalHealthTable.updatedAt));
  res.json(rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
});

router.get("/animal-health", async (req, res) => {
  const { species, status } = req.query as { species?: string; status?: string };
  let rows = await db.select().from(animalHealthTable).orderBy(desc(animalHealthTable.updatedAt));
  if (species) rows = rows.filter(r => r.species === species);
  if (status) rows = rows.filter(r => r.status === status);
  res.json(rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
});

router.get("/animal-health/:animalId", async (req, res) => {
  const { animalId } = req.params;
  const rows = await db.select().from(animalHealthTable).where(eq(animalHealthTable.animalId, animalId));
  if (!rows.length) return res.status(404).json({ error: "Animal not found" });
  res.json({ ...rows[0], updatedAt: rows[0].updatedAt.toISOString() });
});

router.post("/animal-health/ingest", async (req, res) => {
  const data = req.body;
  let status = "সুস্থ";
  let healthScore = 100;
  const { temperature, heartRate, respiratoryRate, activity } = data;
  if (temperature > 39.5 || temperature < 38.0) healthScore -= 20;
  if (heartRate > 90 || heartRate < 40) healthScore -= 20;
  if (respiratoryRate > 30 || respiratoryRate < 10) healthScore -= 20;
  if (activity < 30) healthScore -= 15;
  if (healthScore < 50) status = "বিপদজনক";
  else if (healthScore < 70) status = "সতর্ক";
  else if (healthScore < 85) status = "রোগাক্রান্ত";
  const [row] = await db.insert(animalHealthTable).values({ ...data, healthScore, status }).returning();
  res.status(201).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.post("/animal-health/upsert", async (req, res) => {
  const { animalId, species, name, age, weight, temperature, heartRate, status, location, symptoms, lastVaccine } = req.body;
  let healthScore = 100;
  if (temperature > 39.5 || temperature < 38.0) healthScore -= 20;
  if (heartRate > 90 || heartRate < 40) healthScore -= 20;
  const finalStatus = status || (healthScore < 50 ? "বিপদজনক" : healthScore < 70 ? "সতর্ক" : "সুস্থ");
  const existing = await db.select().from(animalHealthTable).where(eq(animalHealthTable.animalId, animalId)).limit(1);
  let row;
  if (existing.length) {
    [row] = await db.update(animalHealthTable).set({ species, name, age, weight, temperature, heartRate, status: finalStatus, healthScore, location, symptoms, lastVaccine }).where(eq(animalHealthTable.animalId, animalId)).returning();
  } else {
    [row] = await db.insert(animalHealthTable).values({ animalId, species, name, age, weight, temperature, heartRate, status: finalStatus, healthScore, location, symptoms, lastVaccine }).returning();
  }
  res.status(200).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

// ── 4. LIVE CHAT ──
router.get("/live-chat/rooms", async (_req, res) => {
  res.json([
    { id: "সাধারণ", name: "সাধারণ কক্ষ", type: "সাধারণ" },
    { id: "জরুরি", name: "জরুরি সহায়তা", type: "জরুরি" },
    { id: "বিশেষজ্ঞ", name: "বিশেষজ্ঞ পরামর্শ", type: "বিশেষজ্ঞ" },
  ]);
});

router.get("/live-chat/history", async (req, res) => {
  const { roomId } = req.query as { roomId?: string };
  const rows = roomId
    ? await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.roomId, roomId)).orderBy(chatMessagesTable.createdAt)
    : await db.select().from(chatMessagesTable).orderBy(chatMessagesTable.createdAt);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/live-chat/message", async (req, res) => {
  const { roomId, senderId, senderName, senderRole, message, isAi } = req.body;
  const [row] = await db.insert(chatMessagesTable).values({
    roomId: roomId || "সাধারণ", senderId, senderName, senderRole: senderRole || "কৃষক", message, isAi: isAi || false,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.post("/live-chat/ai-reply", async (req, res) => {
  const { message } = req.body;
  const lower = message.toLowerCase();
  let reply = "দুঃখিত! আপনার প্রশ্নের সমাধান দেওয়ার চেষ্টা করছি।";
  if (lower.includes("সার") || lower.includes("fertilizer")) {
    reply = "সার ব্যবহারের জন্য মাটির পরীক্ষা করুন। ধানের ক্ষেতে N-P-K অনুপাত ৭:৩:৩০ সরবরাহ করুন। রাসায়নিক সারের পরিমাণ মাটির অবস্থা অনুযায়ী নির্ধারণ করুন।";
  } else if (lower.includes("রোগ") || lower.includes("disease") || lower.includes("সমস্যা")) {
    reply = "রোগ নির্ণয়ের প্রথম পদক্ষেপ হলো পাতা ও ঘাসের নমুনা সংগ্রহ করা। কীটনাশক ব্যবহারের আগে স্থানীয় কৃষি অফিসের পরামর্শ নিন।";
  } else if (lower.includes("বৃষ্টি") || lower.includes("rain") || lower.includes("আবহাওয়া") || lower.includes("weather")) {
    reply = "আজকের আবহাওয়া পর্যবেক্ষণ করুন। বৃষ্টির সম্ভাবনা থাকলে ফসলের নিষ্কাশন ব্যবস্থা পরীক্ষা করুন।";
  } else if (lower.includes("পানি") || lower.includes("water") || lower.includes("সেচ")) {
    reply = "সেচের সময় ভোর বা সন্ধ্যা বেছে নিন। পানির pH ৬.৫-৭.৫ রাখার চেষ্টা করুন।";
  } else if (lower.includes("মাটি") || lower.includes("soil") || lower.includes("ph") || lower.includes("salinity")) {
    reply = "মাটির pH ৬.০-৭.৫ এবং লবণাক্ততা ৪ dS/m-এর নিচে রাখুন। মাটির পরীক্ষা করুন এবং জৈব সার প্রয়োগ করুন।";
  }
  res.json({ reply, confidence: 0.92, source: "agri-ai" });
});

// ── 5. PRECISION AGRICULTURE ──
router.get("/precision-ag", async (_req, res) => {
  const rows = await db.select().from(precisionAgTable).orderBy(desc(precisionAgTable.createdAt));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/precision-ag/:fieldId", async (req, res) => {
  const rows = await db.select().from(precisionAgTable).where(eq(precisionAgTable.fieldId, req.params.fieldId));
  if (!rows.length) return res.status(404).json({ error: "Field not found" });
  res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString() });
});

router.post("/precision-ag/ingest", async (req, res) => {
  const { fieldId, cropType, fieldSize, soilType, nitrogen, phosphorus, potassium, organicMatter, lat, lon, location } = req.body;
  let recommendation = "", nextAction = "";
  if (nitrogen < 80) { recommendation += "নাইট্রোজেন সার সরবরাহ করুন। "; nextAction += "ইউরিয়া সার প্রয়োগ করুন। "; }
  if (phosphorus < 25) { recommendation += "ফসফরাস বৃদ্ধির জন্য টিএসপি সার প্রয়োগ করুন। "; nextAction += "টিএসপি সার দিন। "; }
  if (potassium < 150) { recommendation += "ফলন বৃদ্ধির জন্য পটাশ সার প্রয়োগ করুন। "; nextAction += "মিউরেট অব পটাশ দিন। "; }
  if (organicMatter < 2) { recommendation += "মাটির জৈব পদার্থ কম। জৈব সার প্রয়োগ করুন। "; nextAction += "কম্পোস্ট সার প্রয়োগ করুন। "; }
  if (!recommendation) { recommendation = "মাটির পুষ্টিমান স্বাভাবিক। বর্তমান পরিমাণে সার প্রয়োগ করুন।"; nextAction = "নির্ধারিত সময়সূচি অনুযায়ী সার প্রয়োগ করুন।"; }
  const [row] = await db.insert(precisionAgTable).values({
    fieldId, cropType, fieldSize, soilType, nitrogen, phosphorus, potassium, organicMatter,
    recommendation, nextAction, location: location || "ময়মনসিংহ", lat, lon,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// ── 6. DRONE MONITORING ──
router.get("/drones", async (_req, res) => {
  const rows = await db.select().from(droneTable).orderBy(desc(droneTable.updatedAt));
  res.json(rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
});

router.get("/drones/:droneId", async (req, res) => {
  const rows = await db.select().from(droneTable).where(eq(droneTable.droneId, req.params.droneId));
  if (!rows.length) return res.status(404).json({ error: "Drone not found" });
  res.json({ ...rows[0], updatedAt: rows[0].updatedAt.toISOString() });
});

router.post("/drones/ingest", async (req, res) => {
  const { droneId, battery, altitude, speed, coverageArea, lat, lon, imageUrl, lastMission, nextMission } = req.body;
  const status = battery < 10 ? "চার্জিং" : battery < 30 ? "অপেক্ষায়" : "মিশনে আছে";
  const [row] = await db.insert(droneTable).values({
    droneId, battery, altitude, speed, coverageArea, lat, lon, imageUrl, lastMission, nextMission, status,
  }).returning();
  res.status(201).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.post("/drones/upsert", async (req, res) => {
  const { droneId, model, status, battery, altitude, speed, coverage, mission, location } = req.body;
  const [row] = await db.insert(droneTable).values({
    droneId, battery: battery || 80, altitude: altitude || 0,
    speed: speed || 0, coverageArea: coverage || 0,
    lastMission: mission || "—", nextMission: "অপেক্ষায়",
    status: status || "অপেক্ষায়",
    location: location || "ময়মনসিংহ",
  }).returning();
  res.status(200).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

// ── 7. MARKET INTELLIGENCE ──
router.get("/market-prices", async (req, res) => {
  const { crop, district } = req.query as { crop?: string; district?: string };
  let rows = await db.select().from(marketPricesTable).orderBy(desc(marketPricesTable.updatedAt));
  if (crop) rows = rows.filter(r => r.cropName.toLowerCase().includes(crop.toLowerCase()));
  if (district) rows = rows.filter(r => r.district?.toLowerCase().includes(district.toLowerCase()));
  res.json(rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
});

router.get("/market-prices/trends", async (_req, res) => {
  const rows = await db.select().from(marketPricesTable).orderBy(desc(marketPricesTable.updatedAt)).limit(50);
  const trends = rows.map(r => ({
    cropName: r.cropName, variety: r.variety, wholesalePrice: r.wholesalePrice, retailPrice: r.retailPrice,
    trend: r.trend, marketName: r.marketName, district: r.district, updatedAt: r.updatedAt.toISOString(),
  }));
  res.json(trends);
});

router.post("/market-prices/ingest", async (req, res) => {
  const { cropName, variety, wholesalePrice, retailPrice, marketName, district, volume, unit } = req.body;
  const prev = await db.select().from(marketPricesTable).where(eq(marketPricesTable.cropName, cropName)).orderBy(desc(marketPricesTable.updatedAt)).limit(1);
  const trend = prev.length
    ? (wholesalePrice > prev[0].wholesalePrice * 1.02 ? "বেশি" : wholesalePrice < prev[0].wholesalePrice * 0.98 ? "কম" : "স্থির")
    : "স্থির";
  const [row] = await db.insert(marketPricesTable).values({
    cropName, variety, wholesalePrice, retailPrice, marketName: marketName || "নেত্রকোনা বাজার", district: district || "ঢাকা", trend, volume, unit,
  }).returning();
  res.status(201).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

router.post("/irrigation/upsert", async (req, res) => {
  const { zoneId, zoneName, cropType, soilMoisture, waterFlow, status, scheduledDuration, nextSchedule, location } = req.body;
  const [row] = await db.insert(irrigationTable).values({
    fieldId: zoneId, cropType, scheduleType: "ম্যানুয়াল",
    startTime: nextSchedule || "06:00", duration: scheduledDuration || 30,
    waterAmount: waterFlow, soilMoistureThreshold: soilMoisture,
    nextRun: nextSchedule || "06:00", isActive: status !== "বন্ধ",
    status: status || "সক্রিয়", location: location || "ময়মনসিংহ",
  }).returning();
  res.status(200).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.post("/market-prices/upsert", async (req, res) => {
  const { crop, unit, wholesalePrice, retailPrice, change, market } = req.body;
  const [row] = await db.insert(marketPricesTable).values({
    cropName: crop, unit, wholesalePrice, retailPrice,
    marketName: market || "ময়মনসিংহ হাট", district: "ময়মনসিংহ",
    trend: (change || "").startsWith("+") ? "বেশি" : (change || "").startsWith("-") ? "কম" : "স্থির",
    volume: 0,
  }).returning();
  res.status(200).json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

// ── 8. SMART IRRIGATION ──
router.get("/irrigation", async (req, res) => {
  const { active } = req.query as { active?: string };
  let rows = await db.select().from(irrigationTable).orderBy(desc(irrigationTable.createdAt));
  if (active === "true") rows = rows.filter(r => r.isActive);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/irrigation/:fieldId", async (req, res) => {
  const rows = await db.select().from(irrigationTable).where(eq(irrigationTable.fieldId, req.params.fieldId));
  if (!rows.length) return res.status(404).json({ error: "Field not found" });
  res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString() });
});

router.post("/irrigation/schedule", async (req, res) => {
  const { fieldId, cropType, scheduleType, startTime, duration, waterAmount, soilMoistureThreshold, nextRun, location, lat, lon } = req.body;
  const [row] = await db.insert(irrigationTable).values({
    fieldId, cropType, scheduleType, startTime, duration, waterAmount, soilMoistureThreshold, nextRun,
    isActive: true, status: "সক্রিয়", location: location || "ময়মনসিংহ", lat, lon,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/irrigation/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);
  const rows = await db.select().from(irrigationTable).where(eq(irrigationTable.id, id));
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const newActive = !rows[0].isActive;
  const newStatus = newActive ? "সক্রিয়" : "বন্ধ";
  await db.update(irrigationTable).set({ isActive: newActive, status: newStatus }).where(eq(irrigationTable.id, id));
  res.json({ id, isActive: newActive, status: newStatus });
});

export default router;
