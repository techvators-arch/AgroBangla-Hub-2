import { useState } from "react";
import { useRecommendCrops, useGetCrops } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sprout, TrendingUp, Clock, Coins } from "lucide-react";
import { toast } from "sonner";

const SOIL_TYPES = ["Clay", "Sandy Loam", "Alluvial", "Silt Loam", "Loam", "Acidic", "Saline"];
const DISTRICTS_BN = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ", "কুমিল্লা", "দিনাজপুর"];
const SEASONS = ["Kharif", "Rabi", "Year-round"];

export default function CropRecommendation() {
  const [form, setForm] = useState({ soilType: "", district: "", season: "", rainfall: "", temperature: "", landSize: "" });
  const [results, setResults] = useState<ReturnType<typeof useRecommendCrops>["data"] | null>(null);

  const { mutate: recommend, isPending } = useRecommendCrops({
    mutation: {
      onSuccess: (data) => {
        setResults(data);
        toast.success("ফসল সুপারিশ তৈরি হয়েছে!");
      },
      onError: () => toast.error("সুপারিশ তৈরি ব্যর্থ হয়েছে।"),
    },
  });

  const { data: crops } = useGetCrops();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.soilType || !form.district || !form.season) {
      toast.error("মাটির ধরন, জেলা ও মৌসুম দেওয়া আবশ্যক।");
      return;
    }
    recommend({
      data: {
        soilType: form.soilType,
        district: form.district,
        season: form.season,
        rainfall: form.rainfall || undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        landSize: form.landSize ? Number(form.landSize) : undefined,
      },
    });
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 0.9) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 0.75) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ফসল সুপারিশ ব্যবস্থা</h1>
        <p className="text-muted-foreground">আপনার জমির মাটি, আবহাওয়া ও মৌসুমের ভিত্তিতে সবচেয়ে উপযুক্ত ফসল বেছে নিন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-primary" />
                তথ্য প্রদান করুন
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>মাটির ধরন *</Label>
                    <Select value={form.soilType} onValueChange={v => setForm(p => ({ ...p, soilType: v }))}>
                      <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                      <SelectContent>{SOIL_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>মৌসুম *</Label>
                    <Select value={form.season} onValueChange={v => setForm(p => ({ ...p, season: v }))}>
                      <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                      <SelectContent>{SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>জেলা *</Label>
                  <Select value={form.district} onValueChange={v => setForm(p => ({ ...p, district: v }))}>
                    <SelectTrigger><SelectValue placeholder="জেলা নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>{DISTRICTS_BN.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>তাপমাত্রা (°C)</Label>
                    <Input type="number" value={form.temperature} onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))} placeholder="যেমন: 28" />
                  </div>
                  <div className="space-y-2">
                    <Label>জমির পরিমাণ (একর)</Label>
                    <Input type="number" value={form.landSize} onChange={e => setForm(p => ({ ...p, landSize: e.target.value }))} placeholder="যেমন: 2.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>বৃষ্টিপাত</Label>
                  <Select value={form.rainfall} onValueChange={v => setForm(p => ({ ...p, rainfall: v }))}>
                    <SelectTrigger><SelectValue placeholder="পরিমাণ নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">কম (০-৫০০ মিমি)</SelectItem>
                      <SelectItem value="medium">মাঝারি (৫০০-১৫০০ মিমি)</SelectItem>
                      <SelectItem value="high">বেশি (১৫০০+ মিমি)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "বিশ্লেষণ চলছে..." : "সুপারিশ পান"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {crops && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">আমাদের ডেটাবেসে {crops.length}টি ফসলের তথ্য</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {crops.slice(0, 10).map(c => (
                    <Badge key={c.id} variant="secondary">{c.nameBn}</Badge>
                  ))}
                  {crops.length > 10 && <Badge variant="outline">+{crops.length - 10} আরো</Badge>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">সুপারিশকৃত ফসল</h2>
          <AnimatePresence>
            {isPending && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
            )}
            {!isPending && results && results.map((rec, i) => (
              <motion.div
                key={rec.cropName}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="mb-4"
              >
                <Card className={i === 0 ? "border-primary ring-1 ring-primary/20" : ""}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {i === 0 && <Badge className="text-xs">সেরা পছন্দ</Badge>}
                        </div>
                        <h3 className="text-xl font-bold mt-1">{rec.cropNameBn}</h3>
                        <p className="text-sm text-muted-foreground">{rec.cropName}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getSuitabilityColor(rec.suitabilityScore)}`}>
                        {(rec.suitabilityScore * 100).toFixed(0)}% উপযুক্ত
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${rec.suitabilityScore * 100}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">প্রত্যাশিত ফলন</p>
                        <p className="text-sm font-semibold">{rec.expectedYieldBn}</p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">বৃদ্ধির সময়</p>
                        <p className="text-sm font-semibold">{rec.growingPeriod}</p>
                      </div>
                      <div className="text-center">
                        <Coins className="w-4 h-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">আনুমানিক লাভ</p>
                        <p className="text-sm font-semibold">৳{rec.estimatedProfit.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {rec.reasons.map((reason, ri) => (
                        <p key={ri} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {reason}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {!isPending && !results && (
              <Card className="p-12 text-center">
                <Sprout className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">তথ্য প্রদান করে সুপারিশ পান</p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
