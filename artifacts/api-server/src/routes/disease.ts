import { Router } from "express";
import { DetectDiseaseBody } from "@workspace/api-zod";

const router = Router();

const DISEASE_DB: Record<string, { name: string; nameBn: string; severity: "low" | "medium" | "high"; treatment: string; treatmentBn: string }[]> = {
  rice: [
    { name: "Rice Blast", nameBn: "ব্লাস্ট রোগ", severity: "high", treatment: "Apply Tricyclazole 75% WP at 0.6g/L water. Improve field drainage.", treatmentBn: "ট্রাইসাইক্লাজোল ৭৫% WP ০.৬ গ্রাম/লিটার পানিতে মিশিয়ে স্প্রে করুন। মাঠের পানি নিষ্কাশন উন্নত করুন।" },
    { name: "Bacterial Leaf Blight", nameBn: "ব্যাকটেরিয়াল লিফ ব্লাইট", severity: "high", treatment: "Use resistant varieties. Apply copper-based bactericides.", treatmentBn: "প্রতিরোধী জাত ব্যবহার করুন। তামা-ভিত্তিক ব্যাকটেরিসাইড প্রয়োগ করুন।" },
    { name: "Sheath Blight", nameBn: "শীথ ব্লাইট", severity: "medium", treatment: "Apply Propiconazole 25EC at 1ml/L. Reduce dense planting.", treatmentBn: "প্রোপিকোনাজোল ২৫ EC ১ মিলি/লিটার প্রয়োগ করুন। ঘন রোপণ কমান।" },
  ],
  wheat: [
    { name: "Wheat Rust", nameBn: "গম মরিচা রোগ", severity: "high", treatment: "Apply Propiconazole or Tebuconazole fungicide. Use resistant varieties.", treatmentBn: "প্রোপিকোনাজোল বা টেবুকোনাজোল ছত্রাকনাশক প্রয়োগ করুন। প্রতিরোধী জাত ব্যবহার করুন।" },
    { name: "Powdery Mildew", nameBn: "পাউডারি মিলডিউ", severity: "medium", treatment: "Apply sulfur-based fungicide. Ensure good air circulation.", treatmentBn: "সালফার-ভিত্তিক ছত্রাকনাশক প্রয়োগ করুন। ভালো বায়ু চলাচল নিশ্চিত করুন।" },
  ],
  potato: [
    { name: "Late Blight", nameBn: "লেট ব্লাইট", severity: "high", treatment: "Apply Mancozeb 75WP at 2.5g/L. Remove infected plants.", treatmentBn: "ম্যানকোজেব ৭৫ WP ২.৫ গ্রাম/লিটার প্রয়োগ করুন। আক্রান্ত গাছ সরিয়ে ফেলুন।" },
    { name: "Early Blight", nameBn: "আর্লি ব্লাইট", severity: "medium", treatment: "Apply Chlorothalonil. Ensure proper spacing between plants.", treatmentBn: "ক্লোরোথ্যালোনিল প্রয়োগ করুন। গাছের মধ্যে সঠিক দূরত্ব নিশ্চিত করুন।" },
  ],
  tomato: [
    { name: "Tomato Mosaic Virus", nameBn: "টমেটো মোজাইক ভাইরাস", severity: "medium", treatment: "Remove infected plants. Control aphid vectors. Use virus-free seeds.", treatmentBn: "আক্রান্ত গাছ সরিয়ে ফেলুন। এফিড নিয়ন্ত্রণ করুন। ভাইরাসমুক্ত বীজ ব্যবহার করুন।" },
    { name: "Bacterial Wilt", nameBn: "ব্যাকটেরিয়াল উইল্ট", severity: "high", treatment: "Use resistant varieties. Avoid waterlogging. Crop rotation.", treatmentBn: "প্রতিরোধী জাত ব্যবহার করুন। জলাবদ্ধতা এড়িয়ে চলুন। ফসল পরিবর্তন করুন।" },
  ],
  jute: [
    { name: "Jute Stem Rot", nameBn: "পাট কাণ্ড পচা", severity: "high", treatment: "Apply Carbendazim. Ensure good drainage. Avoid dense planting.", treatmentBn: "কার্বেনডাজিম প্রয়োগ করুন। ভালো নিষ্কাশন নিশ্চিত করুন। ঘন রোপণ এড়িয়ে চলুন।" },
  ],
};

const diseaseHistory: { id: number; cropType: string; symptoms: string; diseaseName: string; diseaseNameBn: string; severity: string; treatment: string; treatmentBn: string; confidence: number; detectedAt: string }[] = [];
let nextId = 1;

router.post("/disease/detect", (req, res) => {
  const parse = DetectDiseaseBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { cropType, symptoms } = parse.data;
  const cropKey = cropType.toLowerCase();
  const diseases = DISEASE_DB[cropKey] || DISEASE_DB.rice;
  const symptomsLower = symptoms.toLowerCase();

  let matched = diseases[0];
  for (const d of diseases) {
    if (symptomsLower.includes("rust") || symptomsLower.includes("মরিচা")) matched = d;
    if (symptomsLower.includes("blight") || symptomsLower.includes("ব্লাস্ট") || symptomsLower.includes("ব্লাইট")) matched = d;
    if (symptomsLower.includes("mildew") || symptomsLower.includes("মিলডিউ")) matched = d;
    if (symptomsLower.includes("wilt") || symptomsLower.includes("উইল্ট")) matched = d;
  }

  const result = {
    id: nextId++,
    cropType,
    symptoms,
    diseaseName: matched.name,
    diseaseNameBn: matched.nameBn,
    severity: matched.severity,
    treatment: matched.treatment,
    treatmentBn: matched.treatmentBn,
    confidence: Math.round((0.75 + Math.random() * 0.2) * 100) / 100,
    detectedAt: new Date().toISOString(),
  };
  diseaseHistory.unshift(result);
  if (diseaseHistory.length > 20) diseaseHistory.pop();
  res.json(result);
});

router.get("/disease/history", (_req, res) => {
  res.json(diseaseHistory);
});

export default router;
