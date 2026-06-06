import { Router } from "express";
import { RecommendCropsBody } from "@workspace/api-zod";

const router = Router();

const ALL_CROPS = [
  { id: 1, name: "Rice", nameBn: "ধান", category: "Cereal", season: "Kharif", imageUrl: null },
  { id: 2, name: "Wheat", nameBn: "গম", category: "Cereal", season: "Rabi", imageUrl: null },
  { id: 3, name: "Jute", nameBn: "পাট", category: "Fiber", season: "Kharif", imageUrl: null },
  { id: 4, name: "Potato", nameBn: "আলু", category: "Vegetable", season: "Rabi", imageUrl: null },
  { id: 5, name: "Tomato", nameBn: "টমেটো", category: "Vegetable", season: "Rabi", imageUrl: null },
  { id: 6, name: "Mustard", nameBn: "সরিষা", category: "Oilseed", season: "Rabi", imageUrl: null },
  { id: 7, name: "Sugarcane", nameBn: "আখ", category: "Cash Crop", season: "Kharif", imageUrl: null },
  { id: 8, name: "Onion", nameBn: "পেঁয়াজ", category: "Vegetable", season: "Rabi", imageUrl: null },
  { id: 9, name: "Garlic", nameBn: "রসুন", category: "Vegetable", season: "Rabi", imageUrl: null },
  { id: 10, name: "Mango", nameBn: "আম", category: "Fruit", season: "Kharif", imageUrl: null },
  { id: 11, name: "Banana", nameBn: "কলা", category: "Fruit", season: "Year-round", imageUrl: null },
  { id: 12, name: "Lentil", nameBn: "মসুর ডাল", category: "Pulse", season: "Rabi", imageUrl: null },
  { id: 13, name: "Chickpea", nameBn: "ছোলা", category: "Pulse", season: "Rabi", imageUrl: null },
  { id: 14, name: "Tea", nameBn: "চা", category: "Beverage", season: "Year-round", imageUrl: null },
  { id: 15, name: "Eggplant", nameBn: "বেগুন", category: "Vegetable", season: "Year-round", imageUrl: null },
];

const CROP_RECOMMENDATIONS: Record<string, { cropName: string; cropNameBn: string; expectedYield: string; expectedYieldBn: string; growingPeriod: string; estimatedProfit: number; reasons: string[] }> = {
  "rice-clay-kharif": { cropName: "Rice (Aman)", cropNameBn: "আমন ধান", expectedYield: "4-5 tons/hectare", expectedYieldBn: "৪-৫ টন/হেক্টর", growingPeriod: "120-150 days", estimatedProfit: 45000, reasons: ["Excellent match for clay soil", "Kharif season optimal", "High market demand in Bangladesh"] },
  "rice-alluvial-kharif": { cropName: "Rice (Aman)", cropNameBn: "আমন ধান", expectedYield: "5-6 tons/hectare", expectedYieldBn: "৫-৬ টন/হেক্টর", growingPeriod: "120-150 days", estimatedProfit: 52000, reasons: ["Alluvial soil provides excellent nutrients", "High water retention suitable for rice", "Traditional crop with established market"] },
  "wheat-sandy-rabi": { cropName: "Wheat", cropNameBn: "গম", expectedYield: "3-4 tons/hectare", expectedYieldBn: "৩-৪ টন/হেক্টর", growingPeriod: "100-120 days", estimatedProfit: 38000, reasons: ["Sandy loam ideal for wheat root development", "Rabi season matches wheat growth requirements", "Government support price available"] },
  "potato-sandy-rabi": { cropName: "Potato", cropNameBn: "আলু", expectedYield: "20-25 tons/hectare", expectedYieldBn: "২০-২৫ টন/হেক্টর", growingPeriod: "80-90 days", estimatedProfit: 75000, reasons: ["Sandy soil ensures good tuber development", "Short growing season allows double cropping", "High market value"] },
};

router.get("/crops", (_req, res) => {
  res.json(ALL_CROPS);
});

router.post("/crops/recommend", (req, res) => {
  const parse = RecommendCropsBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const { soilType, season } = parse.data;
  const soilKey = soilType.toLowerCase().replace(/\s+/g, "-").split("-")[0];
  const seasonKey = season.toLowerCase();

  const recommendations = [
    { suitabilityScore: 0.95, ...(CROP_RECOMMENDATIONS[`rice-${soilKey}-${seasonKey}`] || CROP_RECOMMENDATIONS["rice-alluvial-kharif"]) },
    { suitabilityScore: 0.85, cropName: "Vegetable Mix", cropNameBn: "মিশ্র সবজি", expectedYield: "8-10 tons/hectare", expectedYieldBn: "৮-১০ টন/হেক্টর", growingPeriod: "60-90 days", estimatedProfit: 60000, reasons: ["High value crop", "Quick return on investment", "Year-round market demand"] },
    { suitabilityScore: 0.78, cropName: "Mustard", cropNameBn: "সরিষা", expectedYield: "1.2-1.5 tons/hectare", expectedYieldBn: "১.২-১.৫ টন/হেক্টর", growingPeriod: "85-95 days", estimatedProfit: 28000, reasons: ["Oil crop with stable prices", "Low water requirement", "Good for crop rotation"] },
    { suitabilityScore: 0.70, cropName: "Lentil", cropNameBn: "মসুর ডাল", expectedYield: "1.0-1.5 tons/hectare", expectedYieldBn: "১.০-১.৫ টন/হেক্টর", growingPeriod: "100-110 days", estimatedProfit: 22000, reasons: ["Nitrogen-fixing crop improves soil", "Import substitution demand", "Drought tolerant"] },
  ];

  res.json(recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore));
});

export default router;
