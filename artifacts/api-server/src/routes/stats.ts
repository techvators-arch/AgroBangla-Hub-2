import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable, productsTable, consultantsTable, krishokCardsTable } from "@workspace/db";
import { sql, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const [
    questionCount,
    productCount,
    consultantCount,
    krishokCount,
  ] = await Promise.all([
    db.select({ count: count() }).from(questionsTable),
    db.select({ count: count() }).from(productsTable),
    db.select({ count: count() }).from(consultantsTable),
    db.select({ count: count() }).from(krishokCardsTable),
  ]);

  res.json({
    totalFarmers: 2420,
    totalProducts: 12,
    totalConsultants: consultantCount[0].count,
    totalQuestions: questionCount[0].count,
    totalDistricts: 64,
    cropVarieties: 142,
  });
});

router.get("/agro-map/zones", async (_req, res) => {
  const zones = [
    { id: 1, district: "Dhaka", districtBn: "ঢাকা", lat: 23.8103, lng: 90.4125, primaryCrop: "Vegetables", primaryCropBn: "সবজি", soilType: "Alluvial", farmerCount: 12500, productionTons: 85000 },
    { id: 2, district: "Chittagong", districtBn: "চট্টগ্রাম", lat: 22.3569, lng: 91.7832, primaryCrop: "Rice", primaryCropBn: "ধান", soilType: "Clay Loam", farmerCount: 18200, productionTons: 125000 },
    { id: 3, district: "Rajshahi", districtBn: "রাজশাহী", lat: 24.3745, lng: 88.6042, primaryCrop: "Mango", primaryCropBn: "আম", soilType: "Sandy Loam", farmerCount: 22000, productionTons: 95000 },
    { id: 4, district: "Khulna", districtBn: "খুলনা", lat: 22.8456, lng: 89.5403, primaryCrop: "Shrimp farming", primaryCropBn: "চিংড়ি চাষ", soilType: "Saline", farmerCount: 15300, productionTons: 62000 },
    { id: 5, district: "Sylhet", districtBn: "সিলেট", lat: 24.8949, lng: 91.8687, primaryCrop: "Tea", primaryCropBn: "চা", soilType: "Acidic", farmerCount: 9800, productionTons: 45000 },
    { id: 6, district: "Barisal", districtBn: "বরিশাল", lat: 22.7010, lng: 90.3535, primaryCrop: "Rice", primaryCropBn: "ধান", soilType: "Alluvial", farmerCount: 20100, productionTons: 140000 },
    { id: 7, district: "Rangpur", districtBn: "রংপুর", lat: 25.7439, lng: 89.2752, primaryCrop: "Potato", primaryCropBn: "আলু", soilType: "Sandy Loam", farmerCount: 25000, productionTons: 180000 },
    { id: 8, district: "Mymensingh", districtBn: "ময়মনসিংহ", lat: 24.7471, lng: 90.4203, primaryCrop: "Jute", primaryCropBn: "পাট", soilType: "Silt Loam", farmerCount: 17500, productionTons: 88000 },
    { id: 9, district: "Comilla", districtBn: "কুমিল্লা", lat: 23.4607, lng: 91.1809, primaryCrop: "Rice", primaryCropBn: "ধান", soilType: "Clay", farmerCount: 14200, productionTons: 98000 },
    { id: 10, district: "Dinajpur", districtBn: "দিনাজপুর", lat: 25.6279, lng: 88.6332, primaryCrop: "Wheat", primaryCropBn: "গম", soilType: "Sandy Loam", farmerCount: 19000, productionTons: 110000 },
  ];
  res.json(zones);
});

export default router;
