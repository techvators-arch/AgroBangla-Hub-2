import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart, Thermometer, Activity, Weight, Beef, Search,
  AlertTriangle, CheckCircle, Stethoscope, CircleDot,
  TrendingUp, TrendingDown, Filter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const speciesMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  cow: { label: "গাবি", icon: <Beef className="w-4 h-4" /> },
  goat: { label: "ছাগল", icon: <Beef className="w-4 h-4" /> },
  buffalo: { label: "মহিষ", icon: <Beef className="w-4 h-4" /> },
  chicken: { label: "মুরগি", icon: <Beef className="w-4 h-4" /> },
};

const statusMeta: Record<string, { color: string; bg: string }> = {
  "সুস্থ": { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  "সরতকর": { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  "সরাসরি": { color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  "রোগাক্রানত": { color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
};

function fetchAnimals(species?: string, status?: string) {
  const params = new URLSearchParams();
  if (species) params.set("species", species);
  if (status) params.set("status", status);
  return fetch(`${BASE}/api/animal-health?${params.toString()}`).then(r => r.json());
}
function fetchAlerts() {
  return fetch(`${BASE}/api/animal-health/alerts`).then(r => r.json());
}

function healthScoreColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

function healthScoreBg(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

export default function AnimalHealth() {
  const [speciesFilter, setSpeciesFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState<any | null>(null);

  const { data: animals, isLoading } = useQuery({
    queryKey: ["animal-health", speciesFilter, statusFilter],
    queryFn: () => fetchAnimals(speciesFilter || undefined, statusFilter || undefined),
  });
  const { data: alerts } = useQuery({ queryKey: ["animal-health", "alerts"], queryFn: fetchAlerts });

  const filtered = animals?.filter((a: any) => {
    const q = search.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.animalId?.toLowerCase().includes(q) || a.species?.toLowerCase().includes(q);
  }) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">পশু সুস্থ্য পর্যবেক্ষণ</h1>
          <p className="text-muted-foreground">তাত্ক্ষণিক IoT সেনসরের মাধ্যমে পশুর সুস্থ্য মোনিটরিং</p>
        </div>
        <div className="flex items-center gap-2">
          {alerts?.length > 0 && (
            <Badge className="bg-red-100 text-red-700 gap-1">
              <AlertTriangle className="w-3 h-3" /> {alerts.length} সরাসরি
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="পশু ID বা নাম দিয়ে খুনুন..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={speciesFilter === "" ? "default" : "outline"} onClick={() => setSpeciesFilter("")}>
            <Filter className="w-3 h-3 mr-1" />সব
          </Button>
          <Button size="sm" variant={speciesFilter === "cow" ? "default" : "outline"} onClick={() => setSpeciesFilter("cow")}>গাবি
          </Button>
          <Button size="sm" variant={speciesFilter === "goat" ? "default" : "outline"} onClick={() => setSpeciesFilter("goat")}>ছাগল
          </Button>
          <Button size="sm" variant={speciesFilter === "buffalo" ? "default" : "outline"} onClick={() => setSpeciesFilter("buffalo")}>মহিষ
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">সব পশু ({filtered.length})</TabsTrigger>
          <TabsTrigger value="alerts">সতর্কতা ({alerts?.length || 0})</TabsTrigger>
          <TabsTrigger value="detail">বিস্তারিত</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filtered.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a: any) => {
                const meta = speciesMeta[a.species] || { label: a.species, icon: <CircleDot className="w-4 h-4" /> };
                const st = statusMeta[a.status] || statusMeta["সুস্থ"];
                return (
                  <motion.div key={a.id} whileHover={{ scale: 1.01 }} className="cursor-pointer"
                    onClick={() => setSelectedAnimal(a)}>
                    <Card className="hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                              {meta.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{a.name || a.animalId}</p>
                              <p className="text-[10px] text-muted-foreground">{meta.label} • {a.animalId}</p>
                            </div>
                          </div>
                          <Badge className={`${st.bg} ${st.color} text-[10px]`}>{a.status}</Badge>
                        </div>
                        {/* Health score ring */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                                strokeDasharray={`${a.healthScore || 0}, 100`}
                                className={healthScoreColor(a.healthScore || 100)} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold">{Math.round(a.healthScore || 100)}</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Thermometer className="w-3 h-3 text-red-500" />
                              <span className="text-muted-foreground">তাপমাত্রা:</span>
                              <span className="font-medium">{a.temperature?.toFixed(1) || "—"}°C</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Heart className="w-3 h-3 text-rose-500" />
                              <span className="text-muted-foreground">হার্ট রেট:</span>
                              <span className="font-medium">{a.heartRate || "—"} bpm</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Activity className="w-3 h-3 text-blue-500" />
                              <span className="text-muted-foreground">শ্বাসকরেষ দর:</span>
                              <span className="font-medium">{a.respiratoryRate || "—"}/min</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Weight className="w-3 h-3 text-slate-500" />
                              <span className="text-muted-foreground">সরণদার:</span>
                              <span className="font-medium">{a.activity?.toFixed(0) || "—"}%</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{a.location} • {new Date(a.updatedAt).toLocaleString("bn-BD")}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো পশু ডেটা পাওয়া যায়নি</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          {alerts?.length ? (
            <div className="space-y-3">
              {alerts.map((a: any, i: number) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="border-red-300 bg-red-50/30 dark:bg-red-900/10">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{a.name || a.animalId} — সরাসরি সুস্থ্য সতর্কতা</p>
                        <p className="text-xs text-muted-foreground">সুস্থ্য স্কোর: {Math.round(a.healthScore || 0)} • স্থিতি: {a.status}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> {a.temperature?.toFixed(1)}°C</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {a.heartRate} bpm</span>
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {a.respiratoryRate}/min</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(a.updatedAt).toLocaleString("bn-BD")}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো সরাসরি সতর্কতা নেই</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detail">
          <AnimatePresence>
            {selectedAnimal ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{selectedAnimal.name || selectedAnimal.animalId} — বিস্তারিত তথ্য</h3>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedAnimal(null)}>সরিয়ে যান</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">মূল তথ্য</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">ID</span><span className="font-medium">{selectedAnimal.animalId}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">নাম</span><span className="font-medium">{selectedAnimal.name || "—"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">প্রাণী</span><span className="font-medium">{speciesMeta[selectedAnimal.species]?.label || selectedAnimal.species}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">বয়স</span><span className="font-medium">{selectedAnimal.age || "—"} বছর</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">অক্ষী</span><span className="font-medium">{selectedAnimal.weight || "—"} কিগ্রাম</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">অবস্থান</span><span className="font-medium">{selectedAnimal.location}</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">সুস্থ্য সূচক</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">সুস্থ্য স্কোর</span>
                        <Badge className={`${statusMeta[selectedAnimal.status]?.bg || ""} ${statusMeta[selectedAnimal.status]?.color || ""}`}>
                          {Math.round(selectedAnimal.healthScore || 100)}/100
                        </Badge>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${healthScoreBg(selectedAnimal.healthScore || 100)}`}
                          style={{ width: `${Math.min(100, selectedAnimal.healthScore || 0)}%` }} />
                      </div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">সীতি</span><span className="font-medium">{selectedAnimal.status}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">শেষ টিকাসন</span><span className="font-medium">{selectedAnimal.lastVaccination || "—"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">শেষ পরীক্ষা</span><span className="font-medium">{selectedAnimal.lastCheckup || "—"}</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">তাত্ক্ষণিক সূচক</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Thermometer className="w-3 h-3 text-red-500" /> তাপমাত্রা</span>
                        <span className="font-medium">{selectedAnimal.temperature?.toFixed(1) || "—"}°C</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" /> হার্ট রেট</span>
                        <span className="font-medium">{selectedAnimal.heartRate || "—"} bpm</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3 text-blue-500" /> শ্বাসকরেষ দর</span>
                        <span className="font-medium">{selectedAnimal.respiratoryRate || "—"}/min</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Weight className="w-3 h-3 text-slate-500" /> সরণদার</span>
                        <span className="font-medium">{selectedAnimal.activity?.toFixed(0) || "—"}%</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> খাদ্য গ্রহণ</span>
                        <span className="font-medium">{selectedAnimal.feedIntake || "—"} কিগ্রাম</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3 h-3 text-sky-500" /> পানি পান</span>
                        <span className="font-medium">{selectedAnimal.waterIntake || "—"} লিটার</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">সাধারণ নোট</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedAnimal.notes || "কোনো নোট নেই"}</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <Card className="p-12 text-center">
                <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">পশু নির্বাচন করুন বিস্তারিত তথ্য দেখতে</p>
              </Card>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
