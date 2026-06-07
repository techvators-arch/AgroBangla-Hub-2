import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Leaf, Sprout, MapPin, Beaker, Search, FlaskConical,
  Droplets, Sun, Wind, ArrowRight, CircleDot,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function fetchFields() {
  return fetch(`${BASE}/api/precision-ag`).then(r => r.json());
}

const cropMeta: Record<string, { color: string; icon: React.ReactNode }> = {
  "ধান": { color: "bg-emerald-100 text-emerald-700", icon: <Leaf className="w-4 h-4" /> },
  "গম": { color: "bg-amber-100 text-amber-700", icon: <Sprout className="w-4 h-4" /> },
  "সবজি": { color: "bg-green-100 text-green-700", icon: <Leaf className="w-4 h-4" /> },
  "ফল": { color: "bg-rose-100 text-rose-700", icon: <Sprout className="w-4 h-4" /> },
  "পাট": { color: "bg-sky-100 text-sky-700", icon: <Leaf className="w-4 h-4" /> },
};

function nutrientBar(value: number, max: number, label: string, color: string) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value?.toFixed(1) || "—"}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function PrecisionAg() {
  const { data: fields, isLoading } = useQuery({ queryKey: ["precision-ag"], queryFn: fetchFields });
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState<any | null>(null);

  const filtered = fields?.filter((f: any) => {
    const q = search.toLowerCase();
    return !q || f.fieldId?.toLowerCase().includes(q) || f.cropType?.toLowerCase().includes(q) || f.location?.toLowerCase().includes(q);
  }) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">নির্ভুল কৃষি</h1>
          <p className="text-muted-foreground">মাটি পরীক্ষা ভিত্তিক সার সুপারিশ এবং পরামর্শ</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="জমির ID বা ফসল দিয়ে খুঁজুন..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field list */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : filtered.length ? (
            filtered.map((f: any) => {
              const meta = cropMeta[f.cropType] || { color: "bg-slate-100 text-slate-700", icon: <CircleDot className="w-4 h-4" /> };
              return (
                <motion.div key={f.id} whileHover={{ scale: 1.005 }} className="cursor-pointer"
                  onClick={() => setSelectedField(f)}>
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.color}`}>
                            {meta.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{f.fieldId} • {f.cropType}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {f.location} • {f.fieldSize?.toFixed(1) || "—"} বিঘা
                            </p>
                          </div>
                        </div>
                        <Badge className="text-[10px]">{f.soilType || "মাটি"}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Beaker className="w-3 h-3 text-blue-500" />
                          <span className="text-muted-foreground">N:</span>
                          <span className="font-medium">{f.nitrogen?.toFixed(1) || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Beaker className="w-3 h-3 text-purple-500" />
                          <span className="text-muted-foreground">P:</span>
                          <span className="font-medium">{f.phosphorus?.toFixed(1) || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Beaker className="w-3 h-3 text-orange-500" />
                          <span className="text-muted-foreground">K:</span>
                          <span className="font-medium">{f.potassium?.toFixed(1) || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FlaskConical className="w-3 h-3 text-emerald-500" />
                          <span className="text-muted-foreground">জৈব:</span>
                          <span className="font-medium">{f.organicMatter?.toFixed(1) || "—"}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <Card className="p-12 text-center">
              <Sprout className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">কোনো জমির ডেটা পাওয়া যায়নি</p>
            </Card>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          <AnimatePresence>
            {selectedField ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="sticky top-20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-500" /> {selectedField.fieldId}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{selectedField.cropType} • {selectedField.soilType}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Nutrients */}
                    {nutrientBar(selectedField.nitrogen || 0, 200, "নাইট্রোজেন (N)", "#3b82f6")}
                    {nutrientBar(selectedField.phosphorus || 0, 60, "ফসফরাস (P)", "#8b5cf6")}
                    {nutrientBar(selectedField.potassium || 0, 300, "পটাসিয়াম (K)", "#f59e0b")}
                    {nutrientBar(selectedField.organicMatter || 0, 5, "জৈব সার", "#10b981")}

                    {/* Recommendation */}
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1">
                        <Sun className="w-3 h-3" /> সার সুপারিশ
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">{selectedField.recommendation || "কোনো সার সুপারিশ নেই"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> পরবর্তী পদক্ষেপ
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{selectedField.nextAction || "কোনো পদক্ষেপ নেই"}</p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedField(null)}>
                      সরিয়ে যান
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="p-8 text-center sticky top-20">
                <Sprout className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">জমি নির্বাচন করুন সার সুপারিশ দেখতে</p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
