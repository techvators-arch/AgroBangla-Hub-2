import { Router } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CROP_NAMES_BN: Record<string, string> = {
  rice: "ধান",
  wheat: "গম",
  potato: "আলু",
  tomato: "টমেটো",
  jute: "পাট",
  mustard: "সরিষা",
  sugarcane: "আখ",
  maize: "ভুট্টা",
  brinjal: "বেগুন",
  cucumber: "শসা",
  onion: "পেঁয়াজ",
  garlic: "রসুন",
  mango: "আম",
  banana: "কলা",
  papaya: "পেঁপে",
  lentil: "মসুর",
  chickpea: "ছোলা",
  cotton: "তুলা",
  groundnut: "চিনাবাদাম",
  soybean: "সয়াবিন",
};

const GEMINI_PROMPT = `You are an expert agricultural plant disease diagnostician with deep knowledge of crop diseases in Bangladesh and South Asia.

Analyze this plant/crop image carefully and provide a detailed disease diagnosis in the following JSON format ONLY (no extra text):

{
  "isPlant": true or false,
  "diseaseName": "Scientific and common name of the disease in English",
  "diseaseNameBn": "রোগের নাম বাংলায়",
  "severity": "low" or "medium" or "high",
  "confidence": 0.0 to 1.0,
  "symptoms": "Detailed symptoms description in English",
  "symptomsBn": "বিস্তারিত লক্ষণ বাংলায়",
  "treatment": "Detailed treatment and prevention in English including specific fungicide/pesticide names and doses",
  "treatmentBn": "বিস্তারিত প্রতিকার ও চিকিৎসা বাংলায় — নির্দিষ্ট ওষুধের নাম ও মাত্রা সহ",
  "additionalInfo": "Any additional advice for the farmer in English",
  "additionalInfoBn": "কৃষকের জন্য অতিরিক্ত পরামর্শ বাংলায়",
  "colorAnalysis": {
    "green": percentage as integer 0-100,
    "brown": percentage as integer 0-100,
    "yellow": percentage as integer 0-100,
    "white": percentage as integer 0-100,
    "dark": percentage as integer 0-100
  },
  "dominantColor": "green" or "brown" or "yellow" or "white" or "dark"
}

Rules:
- If the image is NOT a plant or crop, set isPlant=false and use diseaseName="Not a plant image", diseaseNameBn="উদ্ভিদের ছবি নয়"
- If the plant appears healthy (no disease), set diseaseName="Healthy Plant", diseaseNameBn="সুস্থ গাছ", severity="low", confidence=0.95
- For the colorAnalysis, estimate the percentage of each color visible (all should sum close to 100)
- Be specific about fungicide/bactericide names, doses, and application frequency
- Respond ONLY with the JSON object, no markdown, no extra text`;

interface DiseaseResult {
  id: number;
  cropType: string;
  diseaseName: string;
  diseaseNameBn: string;
  severity: string;
  treatment: string;
  treatmentBn: string;
  symptoms: string;
  symptomsBn: string;
  additionalInfo: string;
  additionalInfoBn: string;
  confidence: number;
  dominantColor: string;
  colorAnalysis: { green: number; brown: number; yellow: number; white: number; dark: number };
  detectedAt: string;
  analyzedBy: "gemini";
}

const imageHistory: DiseaseResult[] = [];
let nextImgId = 1;

router.post("/disease/detect-image", upload.single("image"), async (req, res) => {
  const cropType = (req.body?.cropType as string) || "rice";

  if (!req.file) {
    return res.status(400).json({ error: "ছবি দেওয়া হয়নি" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const cropNameBn = CROP_NAMES_BN[cropType] || cropType;
    const prompt = `${GEMINI_PROMPT}\n\nThe farmer says this is a ${cropType} (${cropNameBn}) crop. Use this as context but also verify from the image itself.`;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype as string,
      },
    };

    const geminiResult = await model.generateContent([prompt, imagePart]);
    const responseText = geminiResult.response.text().trim();

    let parsed: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      throw new Error("Gemini response parse failed: " + responseText.slice(0, 200));
    }

    const colorAnalysis = {
      green: Math.min(100, Math.max(0, Math.round(parsed.colorAnalysis?.green ?? 40))),
      brown: Math.min(100, Math.max(0, Math.round(parsed.colorAnalysis?.brown ?? 20))),
      yellow: Math.min(100, Math.max(0, Math.round(parsed.colorAnalysis?.yellow ?? 15))),
      white: Math.min(100, Math.max(0, Math.round(parsed.colorAnalysis?.white ?? 15))),
      dark: Math.min(100, Math.max(0, Math.round(parsed.colorAnalysis?.dark ?? 10))),
    };

    const result: DiseaseResult = {
      id: nextImgId++,
      cropType,
      diseaseName: parsed.diseaseName || "Unknown Disease",
      diseaseNameBn: parsed.diseaseNameBn || "অজানা রোগ",
      severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
      treatment: parsed.treatment || "",
      treatmentBn: parsed.treatmentBn || "",
      symptoms: parsed.symptoms || "",
      symptomsBn: parsed.symptomsBn || "",
      additionalInfo: parsed.additionalInfo || "",
      additionalInfoBn: parsed.additionalInfoBn || "",
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.85)),
      dominantColor: parsed.dominantColor || "green",
      colorAnalysis,
      detectedAt: new Date().toISOString(),
      analyzedBy: "gemini",
    };

    imageHistory.unshift(result);
    if (imageHistory.length > 20) imageHistory.pop();

    res.json(result);
  } catch (err) {
    req.log.error(err, "Gemini image analysis failed");
    res.status(500).json({ error: "ছবি বিশ্লেষণ ব্যর্থ হয়েছে। API key বা নেটওয়ার্ক সমস্যা হতে পারে।" });
  }
});

router.get("/disease/image-history", (_req, res) => {
  res.json(imageHistory);
});

export default router;
