import { Router } from "express";

const router = Router();

const FERTILIZER_GUIDES = [
  { id: 1, cropName: "Rice (Boro)", cropNameBn: "বোরো ধান", season: "Rabi", soilType: "Clay Loam", nitrogenKgPerAcre: 80, phosphorusKgPerAcre: 25, potassiumKgPerAcre: 30, applicationSchedule: "Apply 1/3 N as basal, 1/3 at tillering, 1/3 at panicle initiation. Full P and K as basal.", applicationScheduleBn: "১/৩ নাইট্রোজেন বেসাল হিসেবে, ১/৩ কুশি পর্যায়ে, ১/৩ শীষ বের হওয়ার সময় প্রয়োগ করুন। সম্পূর্ণ ফসফরাস ও পটাশিয়াম বেসাল হিসেবে প্রয়োগ করুন।", notes: "Use Urea for N, TSP for P, MoP for K" },
  { id: 2, cropName: "Rice (Aman)", cropNameBn: "আমন ধান", season: "Kharif", soilType: "Alluvial", nitrogenKgPerAcre: 60, phosphorusKgPerAcre: 20, potassiumKgPerAcre: 25, applicationSchedule: "Split N into 2-3 doses. Apply P and K at transplanting.", applicationScheduleBn: "নাইট্রোজেন ২-৩ ভাগে ভাগ করুন। রোপণের সময় ফসফরাস ও পটাশিয়াম প্রয়োগ করুন।", notes: "Avoid excess N to prevent lodging" },
  { id: 3, cropName: "Wheat", cropNameBn: "গম", season: "Rabi", soilType: "Sandy Loam", nitrogenKgPerAcre: 70, phosphorusKgPerAcre: 30, potassiumKgPerAcre: 20, applicationSchedule: "Half N at sowing, half at first irrigation. Full P and K at sowing.", applicationScheduleBn: "অর্ধেক নাইট্রোজেন বপনের সময়, বাকি অর্ধেক প্রথম সেচের সময়। সম্পূর্ণ ফসফরাস ও পটাশিয়াম বপনের সময় প্রয়োগ করুন।", notes: "Zinc sulfate 10kg/acre if deficient" },
  { id: 4, cropName: "Potato", cropNameBn: "আলু", season: "Rabi", soilType: "Sandy Loam", nitrogenKgPerAcre: 100, phosphorusKgPerAcre: 60, potassiumKgPerAcre: 80, applicationSchedule: "Apply 1/2 N at planting, 1/2 at 45 days. Full P and K at planting.", applicationScheduleBn: "রোপণের সময় ১/২ নাইট্রোজেন, ৪৫ দিন পর বাকি অর্ধেক। সম্পূর্ণ ফসফরাস ও পটাশিয়াম রোপণের সময় প্রয়োগ করুন।", notes: "High K demand for tuber quality" },
  { id: 5, cropName: "Jute", cropNameBn: "পাট", season: "Kharif", soilType: "Silt Loam", nitrogenKgPerAcre: 50, phosphorusKgPerAcre: 15, potassiumKgPerAcre: 15, applicationSchedule: "Apply N in 2 splits at 30 and 60 days. P and K as basal.", applicationScheduleBn: "৩০ ও ৬০ দিনে ২ ভাগে নাইট্রোজেন প্রয়োগ করুন। ফসফরাস ও পটাশিয়াম বেসাল হিসেবে দিন।", notes: "Avoid waterlogging during early growth" },
  { id: 6, cropName: "Tomato", cropNameBn: "টমেটো", season: "Rabi", soilType: "Loam", nitrogenKgPerAcre: 90, phosphorusKgPerAcre: 50, potassiumKgPerAcre: 60, applicationSchedule: "Apply N in 3 splits. P and K at transplanting. Foliar micronutrients if needed.", applicationScheduleBn: "৩ ভাগে নাইট্রোজেন প্রয়োগ করুন। রোপণের সময় ফসফরাস ও পটাশিয়াম দিন। প্রয়োজনে পাতায় মাইক্রোনিউট্রিয়েন্ট স্প্রে করুন।", notes: "Calcium spray prevents blossom end rot" },
  { id: 7, cropName: "Mustard", cropNameBn: "সরিষা", season: "Rabi", soilType: "Sandy Loam", nitrogenKgPerAcre: 45, phosphorusKgPerAcre: 25, potassiumKgPerAcre: 15, applicationSchedule: "Half N at sowing, half at 25-30 days. Full P and K at sowing.", applicationScheduleBn: "বপনের সময় অর্ধেক নাইট্রোজেন, ২৫-৩০ দিনে বাকি অর্ধেক। সম্পূর্ণ ফসফরাস ও পটাশিয়াম বপনের সময় দিন।", notes: "Sulfur application 15kg/acre recommended" },
  { id: 8, cropName: "Sugarcane", cropNameBn: "আখ", season: "Kharif", soilType: "Loam", nitrogenKgPerAcre: 120, phosphorusKgPerAcre: 40, potassiumKgPerAcre: 50, applicationSchedule: "Apply N in 3-4 splits over the season. P and K at planting.", applicationScheduleBn: "মৌসুম জুড়ে ৩-৪ ভাগে নাইট্রোজেন প্রয়োগ করুন। রোপণের সময় ফসফরাস ও পটাশিয়াম দিন।", notes: "Ratoon crops need additional N" },
];

router.get("/fertilizer", (req, res) => {
  const { crop, season } = req.query as { crop?: string; season?: string };
  let guides = FERTILIZER_GUIDES;
  if (crop) guides = guides.filter(g => g.cropName.toLowerCase().includes(crop.toLowerCase()) || g.cropNameBn.includes(crop));
  if (season) guides = guides.filter(g => g.season.toLowerCase() === season.toLowerCase());
  res.json(guides);
});

export default router;
