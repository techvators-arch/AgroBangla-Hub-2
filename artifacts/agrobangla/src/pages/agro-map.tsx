import { useGetAgroZones } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { MapPin, Sprout, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

export default function AgroMap() {
  const { data: zones, isLoading } = useGetAgroZones();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<ReturnType<typeof window.L.map> | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dynamically import leaflet to avoid SSR issues
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current, {
        center: [23.685, 90.356],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      mapInstance.current = map;

      if (zones) {
        zones.forEach((zone) => {
          const color = zone.primaryCrop.toLowerCase().includes("rice") ? "#16a34a" :
            zone.primaryCrop.toLowerCase().includes("tea") ? "#65a30d" :
            zone.primaryCrop.toLowerCase().includes("mango") ? "#ca8a04" :
            zone.primaryCrop.toLowerCase().includes("potato") ? "#92400e" :
            zone.primaryCrop.toLowerCase().includes("shrimp") ? "#0e7490" : "#2563eb";

          L.circleMarker([zone.lat, zone.lng], {
            radius: Math.max(8, Math.min(20, zone.farmerCount / 1500)),
            fillColor: color,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: sans-serif; min-width: 180px;">
                <div style="font-size: 16px; font-weight: bold; color: #16a34a; margin-bottom: 8px;">${zone.districtBn} (${zone.district})</div>
                <div style="margin-bottom: 4px;"><strong>প্রধান ফসল:</strong> ${zone.primaryCropBn}</div>
                <div style="margin-bottom: 4px;"><strong>মাটির ধরন:</strong> ${zone.soilType}</div>
                <div style="margin-bottom: 4px;"><strong>কৃষক সংখ্যা:</strong> ${zone.farmerCount.toLocaleString()}</div>
                <div><strong>উৎপাদন:</strong> ${zone.productionTons.toLocaleString()} টন</div>
              </div>
            `);
        });
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !zones) return;
    // Markers are added on first load; zones rarely change
  }, [zones]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">কৃষি মানচিত্র</h1>
        <p className="text-muted-foreground">বাংলাদেশের জেলাভিত্তিক কৃষি অঞ্চল ও ফসল তথ্য</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div
              ref={mapRef}
              className="h-[500px] w-full bg-muted"
              style={{ zIndex: 1 }}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">কৃষি অঞ্চলসমূহ</h2>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
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
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {zone.farmerCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sprout className="w-3 h-3" />
                        {zone.productionTons.toLocaleString()} টন
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
