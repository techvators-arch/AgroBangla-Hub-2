import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Plane, Battery, BatteryWarning, BatteryCharging, BatteryLow,
  MapPin, Wind, Gauge, Crosshair, Image, ArrowRight,
  Activity, Zap, Droplets,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function fetchDrones() {
  return fetch(`${BASE}/api/drones`).then(r => r.json());
}

const statusMeta: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "হারিয়ে মশন": { color: "text-emerald-700", bg: "bg-emerald-100", icon: <Zap className="w-4 h-4" /> },
  "হারিয়ে দশ": { color: "text-amber-700", bg: "bg-amber-100", icon: <BatteryWarning className="w-4 h-4" /> },
  "রিসেশ্ন": { color: "text-red-700", bg: "bg-red-100", icon: <BatteryLow className="w-4 h-4" /> },
};

function batteryColor(pct: number) {
  if (pct > 60) return "bg-emerald-500";
  if (pct > 30) return "bg-amber-500";
  return "bg-red-500";
}

export default function DroneMonitoring() {
  const { data: drones, isLoading } = useQuery({ queryKey: ["drones"], queryFn: fetchDrones });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">ড্রোন পর্যবেক্ষণ</h1>
          <p className="text-muted-foreground">বায়ুরেস স্঵য়ুংখরে সদরাস দশ সহ সরসরে সদরাস ফলরিখাস মশন</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Activity className="w-3 h-3" /> সারসরে সদরাস মশন
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : drones?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drones.map((d: any) => {
            const st = statusMeta[d.status] || { color: "text-slate-700", bg: "bg-slate-100", icon: <Plane className="w-4 h-4" /> };
            return (
              <motion.div key={d.id} whileHover={{ scale: 1.01 }}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white">
                          <Plane className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{d.droneId}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.lastMission ? `শেষ মশন: ${d.lastMission}` : "মশন সম্ন নেই"}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${st.bg} ${st.color} text-[10px] gap-1`}>
                        {st.icon} {d.status}
                      </Badge>
                    </div>

                    {/* Battery */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Battery className="w-3 h-3" /> বাতারি
                        </span>
                        <span className="font-medium">{d.battery?.toFixed(0) || "—"}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${batteryColor(d.battery || 0)}`}
                          style={{ width: `${Math.min(100, d.battery || 0)}%` }} />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Crosshair className="w-3 h-3" /> উল্লনননত
                        </p>
                        <p className="text-sm font-semibold">{d.altitude?.toFixed(0) || "—"} মিটার</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Wind className="w-3 h-3" /> বেগ
                        </p>
                        <p className="text-sm font-semibold">{d.speed?.toFixed(1) || "—"} কিমি/ঘ</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> অন্তসরদ
                        </p>
                        <p className="text-sm font-semibold">{d.lat?.toFixed(4) || "—"}, {d.lon?.toFixed(4) || "—"}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Gauge className="w-3 h-3" /> পরিদর্শন
                        </p>
                        <p className="text-sm font-semibold">{d.coverageArea?.toFixed(1) || "—"} বিঘা</p>
                      </div>
                    </div>

                    {/* Next mission */}
                    {d.nextMission && (
                      <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 mb-3">
                        <p className="text-xs text-sky-700 dark:text-sky-400 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> পরবর্তী মশন: {d.nextMission}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <BatteryCharging className="w-3 h-3" />
                      {new Date(d.updatedAt).toLocaleString("bn-BD")}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Plane className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো ড্রোন ডেটা পাওয়া যায়নি</p>
        </Card>
      )}
    </motion.div>
  );
}
