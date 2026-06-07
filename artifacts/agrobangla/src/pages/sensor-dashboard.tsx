import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Droplets, Gauge, Activity, FlaskConical, Wind, Waves,
  Thermometer, AlertTriangle, CheckCircle, Bell, MapPin,
  Wifi, WifiOff, CircleDot,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const sensorMeta: Record<string, { label: string; unit: string; icon: React.ReactNode; color: string; min: number; max: number }> = {
  soil_moisture: { label: "মাটির শিতষ্ণতা", unit: "%", icon: <Droplets className="w-5 h-5 text-blue-500" />, color: "bg-blue-500", min: 30, max: 80 },
  ph: { label: "pH মান", unit: "pH", icon: <FlaskConical className="w-5 h-5 text-purple-500" />, color: "bg-purple-500", min: 5.5, max: 8.5 },
  salinity: { label: "লবণাক্ততা", unit: "dS/m", icon: <Waves className="w-5 h-5 text-cyan-500" />, color: "bg-cyan-500", min: 0, max: 4 },
  tds: { label: "TDS", unit: "ppm", icon: <Gauge className="w-5 h-5 text-slate-500" />, color: "bg-slate-500", min: 0, max: 1000 },
  oxygen: { label: "অক্সিজেন", unit: "mg/L", icon: <Wind className="w-5 h-5 text-sky-500" />, color: "bg-sky-500", min: 4, max: 15 },
  turbidity: { label: "টার্বিডিটি", unit: "NTU", icon: <Activity className="w-5 h-5 text-orange-500" />, color: "bg-orange-500", min: 0, max: 5 },
  water_level: { label: "পানির স্তর", unit: "%", icon: <Waves className="w-5 h-5 text-teal-500" />, color: "bg-teal-500", min: 20, max: 100 },
  temperature: { label: "তাপমাত্রা", unit: "°C", icon: <Thermometer className="w-5 h-5 text-red-500" />, color: "bg-red-500", min: 15, max: 40 },
};

function fetchDashboard() {
  return fetch(`${BASE}/api/sensor/dashboard`).then(r => r.json());
}
function fetchAlerts() {
  return fetch(`${BASE}/api/sensor/alerts`).then(r => r.json());
}
function fetchReadings(type: string) {
  return fetch(`${BASE}/api/sensor/readings?type=${encodeURIComponent(type)}&limit=50`).then(r => r.json());
}

function statusOf(value: number, meta: typeof sensorMeta[string]) {
  if (value < meta.min * 0.5 || value > meta.max * 1.5) return { label: "সরাসরি", color: "bg-red-500" };
  if (value < meta.min || value > meta.max) return { label: "সরতকর", color: "bg-amber-500" };
  return { label: "সাবাবিক", color: "bg-emerald-500" };
}

function percentWithin(value: number, min: number, max: number) {
  const p = ((value - min) / (max - min)) * 100;
  return Math.max(5, Math.min(95, p));
}

export default function SensorDashboard() {
  const { data: dashboard, isLoading: dLoading } = useQuery({ queryKey: ["sensor", "dashboard"], queryFn: fetchDashboard });
  const { data: alerts, isLoading: aLoading } = useQuery({ queryKey: ["sensor", "alerts"], queryFn: fetchAlerts });
  const [activeSensor, setActiveSensor] = useState<string | null>(null);

  const { data: readings, isLoading: rLoading } = useQuery({
    queryKey: ["sensor", "readings", activeSensor],
    queryFn: () => fetchReadings(activeSensor!),
    enabled: !!activeSensor,
  });

  const unreadAlerts = alerts?.filter((a: any) => !a.isRead) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">সেনসর ডেশবোর্ড</h1>
          <p className="text-muted-foreground">তাত্ক্ষণিক সেনসর রিডিং এবং সতর্কতা মোনিটরিং</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Wifi className="w-3 h-3" /> সাদেরাবাদ
          </Badge>
          {unreadAlerts.length > 0 && (
            <Badge className="bg-red-100 text-red-700 gap-1">
              <Bell className="w-3 h-3" /> {unreadAlerts.length} অপপাঠিত
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="live">তাত্ক্ষণিক ডেটা</TabsTrigger>
          <TabsTrigger value="alerts">সতর্কতা ({alerts?.length || 0})</TabsTrigger>
          <TabsTrigger value="history">সেনসর তথ্য (নির্বাচন)</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          {dLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : dashboard?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboard.map((s: any) => {
                const meta = sensorMeta[s.type] || { label: s.type, unit: "", icon: <CircleDot className="w-5 h-5" />, color: "bg-slate-500", min: 0, max: 100 };
                const st = statusOf(s.value, meta);
                return (
                  <motion.div key={s.type} whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setActiveSensor(s.type)}>
                    <Card className={`hover:border-primary/30 transition-colors ${st.label === "সরাসরি" ? "border-red-300" : st.label === "সরতকর" ? "border-amber-300" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-opacity-15`} style={{ backgroundColor: "var(--muted)" }}>
                              {meta.icon}
                            </div>
                            <span className="text-sm font-medium">{meta.label}</span>
                          </div>
                          <Badge className={`text-[10px] ${st.color} text-white`}>{st.label}</Badge>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-3xl font-bold">{s.value}</span>
                          <span className="text-sm text-muted-foreground">{meta.unit}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${percentWithin(s.value, meta.min, meta.max)}%`,
                            backgroundColor: st.color.replace("bg-", "") === "red-500" ? "#ef4444" : st.color.replace("bg-", "") === "amber-500" ? "#f59e0b" : "#10b981"
                          }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>{meta.min} {meta.unit}</span>
                          <span>{meta.max} {meta.unit}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {s.location}
                          <span className="ml-auto">{new Date(s.createdAt).toLocaleTimeString("bn-BD")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <WifiOff className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">ডেটা পাওয়া যায়নি — সেনসর সার্ভারে সাংশদ হতে পারে না।</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          {aLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : alerts?.length ? (
            <div className="space-y-3">
              {alerts.map((a: any, i: number) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`${a.severity === "সরাসরি" ? "border-red-300 bg-red-50/30 dark:bg-red-900/10" : "border-amber-200 bg-amber-50/30 dark:bg-amber-900/10"}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.severity === "সরাসরি" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{a.title}</span>
                          <Badge className="text-[10px]" variant={a.severity === "সরাসরি" ? "destructive" : "secondary"}>{a.severity}</Badge>
                          {!a.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString("bn-BD")}</p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => {
                        fetch(`${BASE}/api/sensor/alerts/${a.id}/read`, { method: "PATCH" });
                      }}>
                        <CheckCircle className="w-3 h-3 mr-1" /> পড়া
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো সতর্কতা নেই</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <AnimatePresence>
            {activeSensor ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{sensorMeta[activeSensor]?.label || activeSensor} — সর্বশেষ রিডিং</h3>
                  <Button size="sm" variant="ghost" onClick={() => setActiveSensor(null)}>সরিয়ে যান</Button>
                </div>
                {rLoading ? (
                  <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : readings?.length ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {readings.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{r.value} {r.unit}</span>
                            <span className="text-xs text-muted-foreground">{r.deviceId}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("bn-BD")}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-8">রিডিং নেই</p>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">সেনসর নির্বাচন করুন তথ্য দেখতে</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {Object.keys(sensorMeta).map(type => (
                    <Button key={type} size="sm" variant="outline" onClick={() => setActiveSensor(type)}>
                      {sensorMeta[type].label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
