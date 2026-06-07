import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CloudRain, Sun, Wind, Droplets, Thermometer, Umbrella, AlertTriangle,
  Waves, Eye, TrendingUp, MapPin, Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function fetchWeatherCurrent() {
  return fetch(`${BASE}/api/weather/current`).then(r => r.json());
}
function fetchWeatherForecast() {
  return fetch(`${BASE}/api/weather/forecast`).then(r => r.json());
}

const conditionIcons: Record<string, React.ReactNode> = {
  "বর্ষা": <CloudRain className="w-6 h-6 text-blue-500" />,
  "মেঘ মেঘ": <CloudRain className="w-6 h-6 text-slate-500" />,
  "রোদ্ধ": <Sun className="w-6 h-6 text-amber-500" />,
};

export default function WeatherPage() {
  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ["weather", "current"],
    queryFn: fetchWeatherCurrent,
  });
  const { data: forecast, isLoading: loadingForecast } = useQuery({
    queryKey: ["weather", "forecast"],
    queryFn: fetchWeatherForecast,
  });

  const [unit, setUnit] = useState<"c" | "f">("c");

  const temp = (t: number) => (unit === "f" ? `${(t * 9 / 5 + 32).toFixed(1)}°F` : `${t.toFixed(1)}°C`);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">আবহাওয়া পর্যবেক্ষণ</h1>
          <p className="text-muted-foreground">স্থানীয় এলাকার তাৎক্ষণিক আবহাওয়া ডেটা</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="cursor-pointer" onClick={() => setUnit("c")}>
            °C
          </Badge>
          <Badge variant="outline" className="cursor-pointer" onClick={() => setUnit("f")}>
            °F
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="current">বর্তমান</TabsTrigger>
          <TabsTrigger value="forecast">১ সপ্তাহের পূর্বাভাস</TabsTrigger>
          <TabsTrigger value="flood">বন্যা সতর্কতা</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {loadingCurrent ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : current ? (
            <div className="space-y-6">
              {/* Current overview card */}
              <Card className="bg-gradient-to-br from-sky-500/10 to-blue-600/5 border-sky-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/15 flex items-center justify-center">
                        <Sun className="w-8 h-8 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {current.location}
                        </p>
                        <p className="text-4xl font-bold">{temp(current.temperature)}</p>
                        <p className="text-sm text-muted-foreground">বর্তমান তাপমাত্রা</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {current.alertLevel !== "স্বাভাবিক" && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1">
                          <AlertTriangle className="w-3 h-3" /> {current.alertLevel}
                        </Badge>
                      )}
                      {current.floodRisk !== "স্বাভাবিক" && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
                          <Waves className="w-3 h-3" /> {current.floodRisk}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard icon={<Droplets className="w-5 h-5 text-blue-500" />}
                  label="আর্দ্রতা" value={`${current.humidity}%`} />
                <MetricCard icon={<Wind className="w-5 h-5 text-slate-500" />}
                  label="বায়ু বেগ" value={`${current.windSpeed} কিমি/ঘ`} />
                <MetricCard icon={<Umbrella className="w-5 h-5 text-blue-600" />}
                  label="বৃষ্টিপাত" value={`${current.rainfall} মিমি`} />
                <MetricCard icon={<Sun className="w-5 h-5 text-amber-500" />}
                  label="সূর্যপ্রকাশ" value={`${current.sunlight} lux`} />
                <MetricCard icon={<Thermometer className="w-5 h-5 text-red-500" />}
                  label="বারোমেত্রিক চাপ" value={`${current.pressure} hPa`} />
                <MetricCard icon={<Eye className="w-5 h-5 text-violet-500" />}
                  label="UV ইনডেক্স" value={`${current.uvIndex}`} />
                <MetricCard icon={<Waves className="w-5 h-5 text-cyan-500" />}
                  label="বন্যা ঝুঁকি" value={current.floodRisk} />
                <MetricCard icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
                  label="সতর্কতা স্তর" value={current.alertLevel} />
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center"><p className="text-muted-foreground">ডেটা পাওয়া যায়নি</p></Card>
          )}
        </TabsContent>

        <TabsContent value="forecast">
          {loadingForecast ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : forecast?.length ? (
            <div className="space-y-3">
              {forecast.map((day: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                          {conditionIcons[day.condition] || <Sun className="w-5 h-5 text-amber-500" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" /> {day.label} • {day.date}
                          </p>
                          <p className="text-xs text-muted-foreground">{day.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-red-500" /> {temp(day.temperature)}</span>
                        <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500" /> {day.humidity}%</span>
                        <span className="flex items-center gap-1"><Umbrella className="w-3.5 h-3.5 text-blue-600" /> {day.rainfall} মিমি</span>
                        <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-slate-500" /> {day.windSpeed} কিমি/ঘ</span>
                        <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-500" /> {day.sunlight} lux</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {day.floodRisk !== "স্বাভাবিক" && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">{day.floodRisk}</Badge>
                        )}
                        {day.alertLevel !== "স্বাভাবিক" && (
                          <Badge variant="outline" className="text-red-600 border-red-300">{day.alertLevel}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center"><p className="text-muted-foreground">পূর্বাভাস ডেটা পাওয়া যায়নি</p></Card>
          )}
        </TabsContent>

        <TabsContent value="flood">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Waves className="w-5 h-5 text-cyan-600" /> বন্যা ঝুঁকি সতর্কতা
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <p className="text-muted-foreground text-sm mb-4">
                বর্ষার পরিমাণ, নদীর স্তর এবং তাপমাত্রা বিশ্লেষণ করে বন্যা ঝুঁকি নির্ণয় করা হয়।
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-sm">স্বাভাবিক</p>
                    <p className="text-xs text-muted-foreground">বৃষ্টিপাত ২৫ মিমি এর কম থাকলে স্বাভাবিক</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div>
                    <p className="font-medium text-sm">মাঝারি</p>
                    <p className="text-xs text-muted-foreground">বৃষ্টিপাত ২৫-৮০ মিমি হলে মাঝারি যুক্তি</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium text-sm">উচ্চ ঝুঁকি</p>
                    <p className="text-xs text-muted-foreground">বৃষ্টিপাত ৮০ মিমি এর বেশি হলে উচ্চ ঝুঁকি</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                সর্বশেষ ডেটা স্তেশন সেনসর হতে আপডেট হয় না।
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="hover:border-primary/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
