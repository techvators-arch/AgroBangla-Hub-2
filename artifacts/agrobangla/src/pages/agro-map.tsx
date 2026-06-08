import { useGetAgroZones } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { MapPin, Sprout, Users, Phone, MessageCircle, Warehouse, Thermometer, Package, Clock, ChevronRight, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type ColdStorage = {
  id: number;
  nameBn: string;
  name: string;
  district: string;
  upazila: string;
  address: string;
  lat: number;
  lng: number;
  capacityTons: number;
  phone: string;
  whatsapp: string;
  commodities: string[];
  ratePerBag: number;
  openTime: string;
  status: string;
};

export default function AgroMap() {
  const { data: zones, isLoading } = useGetAgroZones();
  const [storages, setStorages] = useState<ColdStorage[]>([]);
  const [storagesLoading, setStoragesLoading] = useState(true);
  const [selectedStorage, setSelectedStorage] = useState<ColdStorage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const agriMapRef = useRef<HTMLDivElement>(null);
  const agriMapInstance = useRef<ReturnType<typeof window.L.map> | null>(null);

  const coldMapRef = useRef<HTMLDivElement>(null);
  const coldMapInstance = useRef<ReturnType<typeof window.L.map> | null>(null);
  const coldMarkersRef = useRef<Map<number, ReturnType<typeof window.L.marker>>>(new Map());

  useEffect(() => {
    fetch(`${BASE}/api/cold-storages`)
      .then(r => r.json())
      .then((data: ColdStorage[]) => { setStorages(data); setStoragesLoading(false); })
      .catch(() => setStoragesLoading(false));
  }, []);

  useEffect(() => {
    if (!agriMapRef.current || agriMapInstance.current) return;
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!agriMapRef.current || agriMapInstance.current) return;
      const map = L.map(agriMapRef.current, { center: [23.685, 90.356], zoom: 7, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 18,
      }).addTo(map);
      agriMapInstance.current = map;
      if (zones) {
        zones.forEach((zone) => {
          const color = zone.primaryCrop.toLowerCase().includes("rice") ? "#16a34a" :
            zone.primaryCrop.toLowerCase().includes("tea") ? "#65a30d" :
            zone.primaryCrop.toLowerCase().includes("mango") ? "#ca8a04" :
            zone.primaryCrop.toLowerCase().includes("potato") ? "#92400e" :
            zone.primaryCrop.toLowerCase().includes("shrimp") ? "#0e7490" : "#2563eb";
          L.circleMarker([zone.lat, zone.lng], {
            radius: Math.max(8, Math.min(20, zone.farmerCount / 1500)),
            fillColor: color, color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8,
          }).addTo(map).bindPopup(`
            <div style="font-family:sans-serif;min-width:180px;">
              <div style="font-size:16px;font-weight:bold;color:#16a34a;margin-bottom:8px;">${zone.districtBn}</div>
              <div style="margin-bottom:4px;"><strong>প্রধান ফসল:</strong> ${zone.primaryCropBn}</div>
              <div style="margin-bottom:4px;"><strong>মাটির ধরন:</strong> ${zone.soilType}</div>
              <div style="margin-bottom:4px;"><strong>কৃষক সংখ্যা:</strong> ${zone.farmerCount.toLocaleString()}</div>
              <div><strong>উৎপাদন:</strong> ${zone.productionTons.toLocaleString()} টন</div>
            </div>
          `);
        });
      }
    };
    loadLeaflet();
    return () => { if (agriMapInstance.current) { agriMapInstance.current.remove(); agriMapInstance.current = null; } };
  }, []);

  useEffect(() => {
    if (!coldMapRef.current || coldMapInstance.current || storages.length === 0) return;
    const loadColdMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!coldMapRef.current || coldMapInstance.current) return;
      const map = L.map(coldMapRef.current, { center: [23.8, 90.0], zoom: 7, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 18,
      }).addTo(map);
      coldMapInstance.current = map;

      storages.forEach((s) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:linear-gradient(135deg,#0ea5e9,#0284c7);
            width:34px;height:34px;border-radius:50% 50% 50% 4px;
            border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-size:16px;transform:rotate(-45deg);
          "><span style="transform:rotate(45deg);display:block;">🏭</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        const marker = L.marker([s.lat, s.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:220px;padding:4px;">
              <div style="font-size:15px;font-weight:bold;color:#0284c7;margin-bottom:6px;">🏭 ${s.nameBn}</div>
              <div style="margin-bottom:3px;font-size:13px;">📍 ${s.address}</div>
              <div style="margin-bottom:3px;font-size:13px;">⚖️ ধারণ ক্ষমতা: <strong>${s.capacityTons.toLocaleString()} টন</strong></div>
              <div style="margin-bottom:3px;font-size:13px;">💰 ভাড়া: <strong>৳${s.ratePerBag}/বস্তা</strong></div>
              <div style="margin-bottom:6px;font-size:13px;">⏰ ${s.openTime}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <a href="tel:${s.phone}" style="background:#16a34a;color:white;padding:5px 10px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:bold;">📞 কল করুন</a>
                <a href="https://wa.me/${s.whatsapp}" target="_blank" style="background:#25d366;color:white;padding:5px 10px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:bold;">💬 WhatsApp</a>
              </div>
            </div>
          `);
        coldMarkersRef.current.set(s.id, marker);
      });
    };
    loadColdMap();
    return () => {
      if (coldMapInstance.current) { coldMapInstance.current.remove(); coldMapInstance.current = null; }
      coldMarkersRef.current.clear();
    };
  }, [storages]);

  const filteredStorages = storages.filter(s =>
    !searchQuery ||
    s.nameBn.includes(searchQuery) ||
    s.district.includes(searchQuery) ||
    s.upazila.includes(searchQuery) ||
    s.commodities.some(c => c.includes(searchQuery))
  );

  const flyToStorage = (s: ColdStorage) => {
    setSelectedStorage(s);
    if (coldMapInstance.current) {
      coldMapInstance.current.flyTo([s.lat, s.lng], 12, { duration: 1.2 });
      const marker = coldMarkersRef.current.get(s.id);
      if (marker) marker.openPopup();
    }
    document.getElementById("cold-storage-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8 space-y-12">

      {/* ── Section 1: Agricultural Zones Map ── */}
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">কৃষি মানচিত্র</h1>
          <p className="text-muted-foreground">বাংলাদেশের জেলাভিত্তিক কৃষি অঞ্চল ও ফসল তথ্য</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div ref={agriMapRef} className="h-[500px] w-full bg-muted" style={{ zIndex: 1 }} />
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">কৃষি অঞ্চলসমূহ</h2>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {zones?.map((zone) => (
                  <Card key={zone.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{zone.districtBn}</p>
                          <p className="text-sm text-muted-foreground">{zone.district}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{zone.primaryCropBn}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{zone.farmerCount.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Sprout className="w-3 h-3" />{zone.productionTons.toLocaleString()} টন</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Cold Storage Map ── */}
      <div id="cold-storage-section">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">কোল্ড স্টোরেজ মানচিত্র</h2>
              <p className="text-muted-foreground text-sm">আপনার নিকটতম পণ্য সংরক্ষণাগার খুঁজুন ও সরাসরি যোগাযোগ করুন</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 rounded-full">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              মোট {storages.length}টি কোল্ড স্টোরেজ
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              সরাসরি Call ও WhatsApp সুবিধা
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cold Storage Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-sky-200 dark:border-sky-800">
              <CardHeader className="py-3 px-4 bg-sky-50 dark:bg-sky-950/30 border-b border-sky-100 dark:border-sky-800">
                <CardTitle className="text-sm font-medium text-sky-700 dark:text-sky-400 flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  মানচিত্রে ক্লিক করুন — Call ও WhatsApp বাটন দেখুন
                </CardTitle>
              </CardHeader>
              <div ref={coldMapRef} className="h-[520px] w-full bg-muted" style={{ zIndex: 1 }} />
            </Card>
          </div>

          {/* Cold Storage List */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 pr-9"
                placeholder="জেলা বা পণ্যের নাম লিখুন..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[475px] overflow-y-auto pr-1">
              {storagesLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
              ) : filteredStorages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">কোনো ফলাফল পাওয়া যায়নি</div>
              ) : (
                filteredStorages.map(s => (
                  <motion.div key={s.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedStorage?.id === s.id
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 shadow-md"
                          : "hover:border-sky-300 hover:shadow-sm"
                      }`}
                      onClick={() => flyToStorage(s)}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight line-clamp-1">{s.nameBn}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />{s.district}, {s.upazila}
                            </p>
                          </div>
                          <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 text-[10px] shrink-0 border-0">
                            {s.capacityTons.toLocaleString()} টন
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {s.commodities.slice(0, 3).map(c => (
                            <span key={c} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                              {c}
                            </span>
                          ))}
                          {s.commodities.length > 3 && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">+{s.commodities.length - 3}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Package className="w-3 h-3" />
                            <span>৳{s.ratePerBag}/বস্তা</span>
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-[11px] gap-1 bg-green-600 hover:bg-green-700"
                              onClick={e => { e.stopPropagation(); window.location.href = `tel:${s.phone}`; }}
                            >
                              <Phone className="w-3 h-3" />কল
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-[11px] gap-1 bg-[#25d366] hover:bg-[#20bc5a]"
                              onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${s.whatsapp}?text=আমি%20কোল্ড%20স্টোরেজ%20সম্পর্কে%20জানতে%20চাই`, "_blank"); }}
                            >
                              <MessageCircle className="w-3 h-3" />WA
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              onClick={e => { e.stopPropagation(); flyToStorage(s); }}
                            >
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Storage Detail Panel */}
        {selectedStorage && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <Card className="border-sky-300 dark:border-sky-700 overflow-hidden">
              <CardHeader className="py-4 px-5 bg-gradient-to-r from-sky-600 to-sky-500 text-white flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedStorage.nameBn}</CardTitle>
                  <p className="text-sky-100 text-sm mt-0.5">{selectedStorage.address}</p>
                </div>
                <button onClick={() => setSelectedStorage(null)} className="text-sky-200 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div className="bg-muted/50 rounded-xl p-3.5 text-center">
                    <p className="text-2xl font-bold text-sky-600">{selectedStorage.capacityTons.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">ধারণ ক্ষমতা (টন)</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3.5 text-center">
                    <p className="text-2xl font-bold text-green-600">৳{selectedStorage.ratePerBag}</p>
                    <p className="text-xs text-muted-foreground mt-1">ভাড়া / বস্তা</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3.5 text-center">
                    <p className="text-sm font-semibold text-foreground leading-tight">{selectedStorage.openTime}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />সময়সূচি</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3.5 text-center">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0">{selectedStorage.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">বর্তমান অবস্থা</p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-sm font-semibold mb-2">সংরক্ষণযোগ্য পণ্য</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStorage.commodities.map(c => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="gap-2 bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                    onClick={() => window.location.href = `tel:${selectedStorage.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                    সরাসরি কল করুন — {selectedStorage.phone}
                  </Button>
                  <Button
                    className="gap-2 flex-1 sm:flex-none"
                    style={{ background: "#25d366" }}
                    onClick={() => window.open(`https://wa.me/${selectedStorage.whatsapp}?text=${encodeURIComponent(`আমি ${selectedStorage.nameBn}-এ পণ্য সংরক্ষণ করতে চাই। আমাকে বিস্তারিত জানান।`)}`, "_blank")}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp করুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
