import { Router } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const CROP_NAMES_BN: Record<string, string> = {
  rice: "ধান", wheat: "গম", potato: "আলু", tomato: "টমেটো",
  jute: "পাট", mustard: "সরিষা", sugarcane: "আখ", maize: "ভুট্টা",
  brinjal: "বেগুন", cucumber: "শসা", onion: "পেঁয়াজ", garlic: "রসুন",
  mango: "আম", banana: "কলা", papaya: "পেঁপে", lentil: "মসুর",
  chickpea: "ছোলা", cotton: "তুলা", groundnut: "চিনাবাদাম", soybean: "সয়াবিন",
};

const GEMINI_PROMPT = `You are an expert agricultural plant disease diagnostician with deep knowledge of crop diseases in Bangladesh and South Asia.

Analyze this plant/crop image carefully and provide a detailed disease diagnosis. Respond ONLY with a valid JSON object — no markdown, no extra text, no code fences.

{
  "isPlant": true,
  "diseaseName": "Scientific and common name in English",
  "diseaseNameBn": "রোগের নাম বাংলায়",
  "severity": "low",
  "confidence": 0.87,
  "symptoms": "Detailed symptoms in English",
  "symptomsBn": "বিস্তারিত লক্ষণ বাংলায়",
  "treatment": "Treatment in English with specific fungicide/pesticide names and doses",
  "treatmentBn": "বিস্তারিত প্রতিকার বাংলায় — নির্দিষ্ট ওষুধের নাম ও মাত্রা সহ",
  "additionalInfo": "Extra advice in English",
  "additionalInfoBn": "অতিরিক্ত পরামর্শ বাংলায়",
  "colorAnalysis": { "green": 45, "brown": 25, "yellow": 15, "white": 10, "dark": 5 },
  "dominantColor": "green"
}

Rules:
- severity must be exactly "low", "medium", or "high"
- confidence is a decimal 0.0 to 1.0
- colorAnalysis values are integers 0-100 (they should roughly sum to 100)
- dominantColor must be one of: green, brown, yellow, white, dark
- If NOT a plant: isPlant=false, diseaseName="Not a plant image", diseaseNameBn="উদ্ভিদের ছবি নয়", severity="low"
- If plant is HEALTHY: diseaseName="Healthy Plant", diseaseNameBn="সুস্থ গাছ", severity="low", confidence=0.95
- Be specific: include exact fungicide names, dose (g/L or ml/L), and frequency`;

interface DiseaseResult {
  id: number; cropType: string; diseaseName: string; diseaseNameBn: string;
  severity: string; treatment: string; treatmentBn: string;
  symptoms: string; symptomsBn: string; confidence: number;
  dominantColor: string;
  colorAnalysis: { green: number; brown: number; yellow: number; white: number; dark: number };
  detectedAt: string; additionalInfo: string; additionalInfoBn: string;
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
    const cropNameBn = CROP_NAMES_BN[cropType] || cropType;
    const prompt = `${GEMINI_PROMPT}\n\nThe farmer reports this is a ${cropType} (${cropNameBn}) crop. Use this context but also verify from the image itself.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: req.file.buffer.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    const responseText = response.text?.trim() ?? "";

    let parsed: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      throw new Error("JSON parse failed: " + responseText.slice(0, 300));
    }

    const ca = parsed.colorAnalysis ?? {};
    const colorAnalysis = {
      green:  Math.min(100, Math.max(0, Math.round(Number(ca.green)  || 40))),
      brown:  Math.min(100, Math.max(0, Math.round(Number(ca.brown)  || 20))),
      yellow: Math.min(100, Math.max(0, Math.round(Number(ca.yellow) || 15))),
      white:  Math.min(100, Math.max(0, Math.round(Number(ca.white)  || 15))),
      dark:   Math.min(100, Math.max(0, Math.round(Number(ca.dark)   || 10))),
    };

    const result: DiseaseResult = {
      id: nextImgId++,
      cropType,
      diseaseName:    parsed.diseaseName    || "Unknown Disease",
      diseaseNameBn:  parsed.diseaseNameBn  || "অজানা রোগ",
      severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
      treatment:      parsed.treatment      || "",
      treatmentBn:    parsed.treatmentBn    || "",
      symptoms:       parsed.symptoms       || "",
      symptomsBn:     parsed.symptomsBn     || "",
      additionalInfo:   parsed.additionalInfo   || "",
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
  } catch (err: any) {
    req.log.error(err, "Gemini image analysis failed");
    const msg = err?.message || "";
    if (msg.includes("429") || msg.includes("quota")) {
      return res.status(429).json({ error: "Gemini API quota শেষ। কিছুক্ষণ পর আবার চেষ্টা করুন।" });
    }
    res.status(500).json({ error: "ছবি বিশ্লেষণ ব্যর্থ হয়েছে।" });
  }
});

router.get("/disease/image-history", (_req, res) => {
  res.json(imageHistory);
});

export default router;
