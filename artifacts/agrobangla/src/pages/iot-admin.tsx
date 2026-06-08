import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CloudRain, Gauge, Heart, Droplets, Plane, TrendingUp, Thermometer,
  Wind, Eye, Save, RefreshCw, CheckCircle, AlertTriangle, Sliders,
} from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SectionKey = "weather" | "sensor" | "animal" | "irrigation" | "drone" | "market";

export default function IotAdmin() {
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [active, setActive] = useState<SectionKey>("weather");

  // ── Weather ──
  const [weather, setWeather] = useState({
    location: "ময়মনসিংহ", temperature: "32.5", humidity: "78",
    windSpeed: "12", rainfall: "2.5", sunlight: "850", pressure: "1012", uvIndex: "6.8",
  });

  // ── Sensor ──
  const [sensor, setSensor] = useState({
    sensorType: "soil_moisture", value: "65", unit: "%",
    deviceId: "rover-001", location: "ময়মনসিংহ",
  });
  const SENSOR_TYPES = [
    { value: "soil_moisture", label: "মাটির আর্দ্রতা", unit: "%" },
    { value: "ph", label: "pH মান", unit: "pH" },
    { value: "salinity", label: "লবণাক্ততা", unit: "dS/m" },
    { value: "tds", label: "TDS", unit: "ppm" },
    { value: "oxygen", label: "অক্সিজেন", unit: "mg/L" },
    { value: "turbidity", label: "ঘোলাটেতা", unit: "NTU" },
    { value: "water_level", label: "পানির স্তর", unit: "%" },
    { value: "temperature", label: "তাপমাত্রা", unit: "°C" },
  ];

  // ── Animal Health ──
  const [animal, setAnimal] = useState({
    animalId: "COW-001", species: "গরু", name: "লাল মিয়া",
    age: "4", weight: "380", temperature: "38.5",
    heartRate: "65", status: "সুস্থ", location: "ময়মনসিংহ",
    symptoms: "", lastVaccine: "এফএমডি",
  });

  // ── Irrigation ──
  const [irrigation, setIrrigation] = useState({
    zoneId: "ZONE-A1", zoneName: "ধান জমি", cropType: "বোরো ধান",
    soilMoisture: "42", waterFlow: "15.5", status: "সক্রিয়",
    scheduledDuration: "45", nextSchedule: "০৬:০০",
    location: "ময়মনসিংহ",
  });

  // ── Drone ──
  const [drone, setDrone] = useState({
    droneId: "DRN-001", model: "AgriDrone X200", status: "অপেক্ষায়",
    battery: "87", altitude: "0", speed: "0",
    coverage: "0", mission: "—", location: "ময়মনসিংহ",
  });

  // ── Market Price ──
  const [market, setMarket] = useState({
    crop: "ধান", unit: "মণ", wholesalePrice: "1100", retailPrice: "1280",
    change: "+5", market: "ময়মনসিংহ হাট",
  });

  const markSaved = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2500);
  };

  const save = async (key: SectionKey) => {
    setSaving(key);
    try {
      let url = "", body: Record<string, unknown> = {};
      if (key === "weather") {
        url = `${BASE}/api/weather/ingest`;
        body = { location: weather.location, temperature: +weather.temperature, humidity: +weather.humidity, windSpeed: +weather.windSpeed, rainfall: +weather.rainfall, sunlight: +weather.sunlight, pressure: +weather.pressure, uvIndex: +weather.uvIndex };
      } else if (key === "sensor") {
        url = `${BASE}/api/sensor/ingest`;
        const st = SENSOR_TYPES.find(s => s.value === sensor.sensorType);
        body = { deviceId: sensor.deviceId, sensorType: sensor.sensorType, value: +sensor.value, unit: st?.unit || sensor.unit, location: sensor.location };
      } else if (key === "animal") {
        url = `${BASE}/api/animal-health/upsert`;
        body = { animalId: animal.animalId, species: animal.species, name: animal.name, age: +animal.age, weight: +animal.weight, temperature: +animal.temperature, heartRate: +animal.heartRate, status: animal.status, location: animal.location, symptoms: animal.symptoms || null, lastVaccine: animal.lastVaccine || null };
      } else if (key === "irrigation") {
        url = `${BASE}/api/irrigation/upsert`;
        body = { zoneId: irrigation.zoneId, zoneName: irrigation.zoneName, cropType: irrigation.cropType, soilMoisture: +irrigation.soilMoisture, waterFlow: +irrigation.waterFlow, status: irrigation.status, scheduledDuration: +irrigation.scheduledDuration, nextSchedule: irrigation.nextSchedule, location: irrigation.location };
      } else if (key === "drone") {
        url = `${BASE}/api/drones/upsert`;
        body = { droneId: drone.droneId, model: drone.model, status: drone.status, battery: +drone.battery, altitude: +drone.altitude, speed: +drone.speed, coverage: +drone.coverage, mission: drone.mission, location: drone.location };
      } else if (key === "market") {
        url = `${BASE}/api/market-prices/upsert`;
        body = { crop: market.crop, unit: market.unit, wholesalePrice: +market.wholesalePrice, retailPrice: +market.retailPrice, change: market.change, market: market.market };
      }
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      markSaved(key);
      toast.success("তথ্য সফলভাবে আপডেট হয়েছে!");
    } catch {
      toast.error("সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally { setSaving(null); }
  };

  const sections: { key: SectionKey; label: string; icon: React.ElementType; color: string }[] = [
    { key: "weather", label: "আবহাওয়া", icon: CloudRain, color: "text-sky-600" },
    { key: "sensor", label: "সেন্সর", icon: Gauge, color: "text-violet-600" },
    { key: "animal", label: "পশু স্বাস্থ্য", icon: Heart, color: "text-rose-600" },
    { key: "irrigation", label: "সেচ ব্যবস্থা", icon: Droplets, color: "text-blue-600" },
    { key: "drone", label: "ড্রোন", icon: Plane, color: "text-amber-600" },
    { key: "market", label: "বাজারদর", icon: TrendingUp, color: "text-green-600" },
  ];

  const SaveBtn = ({ k }: { k: SectionKey }) => (
    <Button className="gap-2" onClick={() => save(k)} disabled={saving === k}>
      {saving === k ? <><RefreshCw className="w-4 h-4 animate-spin" />সংরক্ষণ হচ্ছে...</>
        : saved === k ? <><CheckCircle className="w-4 h-4" />সংরক্ষিত!</>
        : <><Save className="w-4 h-4" />সংরক্ষণ করুন</>}
    </Button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ম্যানুয়াল কন্ট্রোল প্যানেল</h1>
            <p className="text-sm text-muted-foreground">রিয়েল টাইম তথ্য সরাসরি পরিবর্তন ও আপডেট করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0 gap-1">
            <AlertTriangle className="w-3 h-3" />Admin Mode
          </Badge>
          <span className="text-xs text-muted-foreground">পরিবর্তন তাৎক্ষণিকভাবে লাইভ ড্যাশবোর্ডে প্রতিফলিত হবে</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="space-y-1.5">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => setActive(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  active === s.key ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/60"
                }`}>
                <Icon className={`w-4 h-4 ${active === s.key ? "text-primary-foreground" : s.color}`} />
                {s.label}
                {saved === s.key && <CheckCircle className="w-3.5 h-3.5 ml-auto text-green-400" />}
              </button>
            );
          })}
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3">

          {/* ── Weather ── */}
          {active === "weather" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CloudRain className="w-5 h-5 text-sky-600" />আবহাওয়া তথ্য আপডেট</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>অবস্থান</Label><Input value={weather.location} onChange={e => setWeather(p => ({ ...p, location: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>তাপমাত্রা (°C)</Label><Input type="number" value={weather.temperature} onChange={e => setWeather(p => ({ ...p, temperature: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>আর্দ্রতা (%)</Label><Input type="number" value={weather.humidity} onChange={e => setWeather(p => ({ ...p, humidity: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>বায়ুর গতি (km/h)</Label><Input type="number" value={weather.windSpeed} onChange={e => setWeather(p => ({ ...p, windSpeed: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>বৃষ্টিপাত (mm)</Label><Input type="number" value={weather.rainfall} onChange={e => setWeather(p => ({ ...p, rainfall: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>সূর্যালোক (lux)</Label><Input type="number" value={weather.sunlight} onChange={e => setWeather(p => ({ ...p, sunlight: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>বায়ুচাপ (hPa)</Label><Input type="number" value={weather.pressure} onChange={e => setWeather(p => ({ ...p, pressure: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>UV সূচক</Label><Input type="number" step="0.1" value={weather.uvIndex} onChange={e => setWeather(p => ({ ...p, uvIndex: e.target.value }))} /></div>
                </div>
                <Separator />
                <div className="flex justify-end"><SaveBtn k="weather" /></div>
              </CardContent>
            </Card>
          )}

          {/* ── Sensor ── */}
          {active === "sensor" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="w-5 h-5 text-violet-600" />সেন্সর রিডিং আপডেট</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>সেন্সরের ধরন</Label>
                    <Select value={sensor.sensorType} onValueChange={v => {
                      const st = SENSOR_TYPES.find(s => s.value === v);
                      setSensor(p => ({ ...p, sensorType: v, unit: st?.unit || "%" }));
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SENSOR_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>মান</Label><Input type="number" step="0.1" value={sensor.value} onChange={e => setSensor(p => ({ ...p, value: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>ডিভাইস ID</Label><Input value={sensor.deviceId} onChange={e => setSensor(p => ({ ...p, deviceId: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>অবস্থান</Label><Input value={sensor.location} onChange={e => setSensor(p => ({ ...p, location: e.target.value }))} /></div>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 text-sm">
                  <p className="font-medium mb-1">নির্বাচিত সেন্সর: <span className="text-primary">{SENSOR_TYPES.find(s => s.value === sensor.sensorType)?.label}</span></p>
                  <p className="text-muted-foreground">একক: {SENSOR_TYPES.find(s => s.value === sensor.sensorType)?.unit}</p>
                </div>
                <Separator />
                <div className="flex justify-end"><SaveBtn k="sensor" /></div>
              </CardContent>
            </Card>
          )}

          {/* ── Animal Health ── */}
          {active === "animal" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-rose-600" />পশু স্বাস্থ্য তথ্য আপডেট</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>পশু ID</Label><Input value={animal.animalId} onChange={e => setAnimal(p => ({ ...p, animalId: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>প্রজাতি</Label><Input value={animal.species} onChange={e => setAnimal(p => ({ ...p, species: e.target.value }))} placeholder="গরু, ছাগল, মহিষ..." /></div>
                  <div className="space-y-1.5"><Label>নাম</Label><Input value={animal.name} onChange={e => setAnimal(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>বয়স (বছর)</Label><Input type="number" value={animal.age} onChange={e => setAnimal(p => ({ ...p, age: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>ওজন (কেজি)</Label><Input type="number" value={animal.weight} onChange={e => setAnimal(p => ({ ...p, weight: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>তাপমাত্রা (°C)</Label><Input type="number" step="0.1" value={animal.temperature} onChange={e => setAnimal(p => ({ ...p, temperature: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>হৃদস্পন্দন (bpm)</Label><Input type="number" value={animal.heartRate} onChange={e => setAnimal(p => ({ ...p, heartRate: e.target.value }))} /></div>
                  <div className="space-y-1.5">
                    <Label>স্বাস্থ্য অবস্থা</Label>
                    <Select value={animal.status} onValueChange={v => setAnimal(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="সুস্থ">সুস্থ</SelectItem>
                        <SelectItem value="সতর্ক">সতর্ক</SelectItem>
                        <SelectItem value="বিপদজনক">বিপদজনক</SelectItem>
                        <SelectItem value="রোগাক্রান্ত">রোগাক্রান্ত</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>শেষ টিকা</Label><Input value={animal.lastVaccine} onChange={e => setAnimal(p => ({ ...p, lastVaccine: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>অবস্থান</Label><Input value={animal.location} onChange={e => setAnimal(p => ({ ...p, location: e.target.value }))} /></div>
                </div>
                <div className="space-y-1.5"><Label>লক্ষণ / মন্তব্য</Label><Input value={animal.symptoms} onChange={e => setAnimal(p => ({ ...p, symptoms: e.target.value }))} placeholder="প্রযোজ্য হলে লিখুন..." /></div>
                <Separator />
                <div className="flex justify-end"><SaveBtn k="animal" /></div>
              </CardContent>
            </Card>
          )}

          {/* ── Irrigation ── */}
          {active === "irrigation" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-600" />সেচ ব্যবস্থা আপডেট</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>জোন ID</Label><Input value={irrigation.zoneId} onChange={e => setIrrigation(p => ({ ...p, zoneId: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>জোনের নাম</Label><Input value={irrigation.zoneName} onChange={e => setIrrigation(p => ({ ...p, zoneName: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>ফসলের ধরন</Label><Input value={irrigation.cropType} onChange={e => setIrrigation(p => ({ ...p, cropType: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>মাটির আর্দ্রতা (%)</Label><Input type="number" value={irrigation.soilMoisture} onChange={e => setIrrigation(p => ({ ...p, soilMoisture: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>পানির প্রবাহ (L/min)</Label><Input type="number" step="0.1" value={irrigation.waterFlow} onChange={e => setIrrigation(p => ({ ...p, waterFlow: e.target.value }))} /></div>
                  <div className="space-y-1.5">
                    <Label>সেচের অবস্থা</Label>
                    <Select value={irrigation.status} onValueChange={v => setIrrigation(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="সক্রিয়">সক্রিয়</SelectItem>
                        <SelectItem value="চলমান">চলমান</SelectItem>
                        <SelectItem value="বন্ধ">বন্ধ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>সময়কাল (মিনিট)</Label><Input type="number" value={irrigation.scheduledDuration} onChange={e => setIrrigation(p => ({ ...p, scheduledDuration: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>পরবর্তী সময়সূচি</Label><Input value={irrigation.nextSchedule} onChange={e => setIrrigation(p => ({ ...p, nextSchedule: e.target.value }))} placeholder="যেমন: ০৬:০০" /></div>
                </div>
                <Separator />
                <div className="flex justify-end"><SaveBtn k="irrigation" /></div>
              </CardContent>
            </Card>
          )}

          {/* ── Drone ── */}
          {active === "drone" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Plane className="w-5 h-5 text-amber-600" />ড্রোন তথ্য আপডেট</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>ড্রোন ID</Label><Input value={drone.droneId} onChange={e => setDrone(p => ({ ...p, droneId: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>মডেল</Label><Input value={drone.model} onChange={e => setDrone(p => ({ ...p, model: e.target.value }))} /></div>
                  <div className="space-y-1.5">
                    <Label>অবস্থা</Label>
                    <Select value={drone.status} onValueChange={v => setDrone(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="মিশনে আছে">মিশনে আছে</SelectItem>
                        <SelectItem value="অপেক্ষায়">অপেক্ষায়</SelectItem>
                        <SelectItem value="চার্জিং">চার্জিং</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>ব্যাটারি (%)</Label><Input type="number" min="0" max="100" value={drone.battery} onChange={e => setDrone(p => ({ ...p, battery: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>উচ্চতা (মিটার)</Label><Input type="number" value={drone.altitude} onChange={e => setDrone(p => ({ ...p, altitude: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>গতি (km/h)</Label><Input type="number" value={drone.speed} onChange={e => setDrone(p => ({ ...p, speed: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>কভারেজ (হেক্টর)</Label><Input type="number" step="0.1" value={drone.coverage} onChange={e => setDrone(p => ({ ...p, coverage: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>মিশনের বিবরণ</Label><Input value={drone.mission} onChange={e => setDrone(p => ({ ...p, mission: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>অবস্থান</Label><Input value={drone.location} onChange={e => setDrone(p => ({ ...p, location: e.target.value }))} /></div>
                </div>
                <Separator />
                <div className="flex justify-end"><SaveBtn k="drone" /></div>
              </CardContent>
            </Card>
          )}

          {/* ── Market Price ── */}
          {active === "market" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" />বাজারদর আপডেট</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>ফসলের নাম</Label><Input value={market.crop} onChange={e => setMarket(p => ({ ...p, crop: e.target.value }))} placeholder="যেমন: ধান, গম..." /></div>
                  <div className="space-y-1.5"><Label>একক</Label><Input value={market.unit} onChange={e => setMarket(p => ({ ...p, unit: e.target.value }))} placeholder="মণ, কেজি, টন..." /></div>
                  <div className="space-y-1.5"><Label>পাইকারি মূল্য (৳)</Label><Input type="number" value={market.wholesalePrice} onChange={e => setMarket(p => ({ ...p, wholesalePrice: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>খুচরা মূল্য (৳)</Label><Input type="number" value={market.retailPrice} onChange={e => setMarket(p => ({ ...p, retailPrice: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>পরিবর্তন</Label><Input value={market.change} onChange={e => setMarket(p => ({ ...p, change: e.target.value }))} placeholder="+5 বা -3" /></div>
                  <div className="space-y-1.5"><Label>বাজারের নাম</Label><Input value={market.market} onChange={e => setMarket(p => ({ ...p, market: e.target.value }))} /></div>
                </div>
                <Separator />
                <div className="flex justify-end"><SaveBtn k="market" /></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
