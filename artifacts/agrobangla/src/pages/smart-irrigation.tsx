import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Droplets, Clock, MapPin, ToggleRight, ToggleLeft,
  Calendar, Sprout, Timer, Settings,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function fetchIrrigation() {
  return fetch(`${BASE}/api/irrigation`).then(r => r.json());
}

const statusMeta: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "সন্ধি": { color: "text-emerald-700", bg: "bg-emerald-100", icon: <Droplets className="w-3.5 h-3.5" /> },
  "চলুমান": { color: "text-blue-700", bg: "bg-blue-100", icon: <Droplets className="w-3.5 h-3.5" /> },
  "বন্দ": { color: "text-slate-700", bg: "bg-slate-100", icon: <Settings className="w-3.5 h-3.5" /> },
};

export default function SmartIrrigation() {
  const { data: schedules, isLoading, refetch } = useQuery({ queryKey: ["irrigation"], queryFn: fetchIrrigation });
  const [toggling, setToggling] = useState<number | null>(null);

  const toggle = async (id: number) => {
    setToggling(id);
    await fetch(`${BASE}/api/irrigation/${id}/toggle`, { method: "PATCH" });
    refetch();
    setToggling(null);
  };

  const activeCount = schedules?.filter((s: any) => s.isActive).length || 0;
  const runningCount = schedules?.filter((s: any) => s.status === "চলুমান").length || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">স্মার্ট সেচ</h1>
          <p className="text-muted-foreground">সেনসর-ভিত্তিক সাদেরাবাদ সেচ সরেসরদ নির্সসাদর</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-700 gap-1">
            <Droplets className="w-3 h-3" /> {activeCount} সন্ধি
          </Badge>
          {runningCount > 0 && (
            <Badge className="bg-blue-100 text-blue-700 gap-1">
              <Droplets className="w-3 h-3" /> {runningCount} চলুমান
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : schedules?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((s: any) => {
            const st = statusMeta[s.status] || statusMeta["সন্ধি"];
            return (
              <motion.div key={s.id} whileHover={{ scale: 1.01 }}>
                <Card className={`hover:border-primary/30 transition-colors ${!s.isActive ? "opacity-70" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                          <Droplets className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{s.fieldId} • {s.cropType}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {s.location}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${st.bg} ${st.color} text-[10px] gap-1`}>
                        {st.icon} {s.status}
                      </Badge>
                    </div>

                    {/* Schedule details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> সময়
                        </span>
                        <span className="font-medium">{s.startTime || "সময় নেই"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Timer className="w-3 h-3" /> সময়কাল
                        </span>
                        <span className="font-medium">{s.duration ? `${s.duration} মিনিট` : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Droplets className="w-3 h-3" /> সেচের পরিমাণ
                        </span>
                        <span className="font-medium">{s.waterAmount ? `${s.waterAmount} লিটার` : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Sprout className="w-3 h-3" /> মারিত শিতষ্ণতা সীমা
                        </span>
                        <span className="font-medium">{s.soilMoistureThreshold ? `${s.soilMoistureThreshold}%` : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> পরবর্তী সেচ
                        </span>
                        <span className="font-medium">{s.nextRun || "সময় নেই"}</span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <Button
                      size="sm"
                      variant={s.isActive ? "outline" : "default"}
                      className={`w-full gap-2 text-xs ${
                        s.isActive
                          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          : "bg-slate-600 hover:bg-slate-700"
                      }`}
                      disabled={toggling === s.id}
                      onClick={() => toggle(s.id)}
                    >
                      {toggling === s.id ? (
                        <>
                          <Timer className="w-3 h-3 animate-spin" /> থার্দ হলে...
                        </>
                      ) : s.isActive ? (
                        <>
                          <ToggleRight className="w-3 h-3" /> সন্ধি সর্সরসর সত্র হলে
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3" /> সন্ধি সর্সরসর সত্র হলে
                        </>
                      )}
                    </Button>

                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                      {new Date(s.createdAt).toLocaleString("bn-BD")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Droplets className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো সেচ সরেসরসর ডেটা পাওয়া যায়নি</p>
        </Card>
      )}
    </motion.div>
  );
}
