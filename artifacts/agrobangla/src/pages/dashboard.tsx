import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Minus,
  Users, ShoppingBag, Sprout, CloudRain, Gauge,
  Heart, Plane, Droplets, Leaf, Zap, Shield,
  BarChart3, Activity, Star, Map, Clock,
  ArrowUpRight, Wifi, AlertTriangle, CheckCircle2,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useApi<T>(path: string, interval = 0) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    const fetch_ = () =>
      fetch(`${BASE}${path}`)
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    fetch_();
    if (interval > 0) {
      const id = setInterval(fetch_, interval);
      return () => clearInterval(id);
    }
  }, [path, interval]);
  return data;
}

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [inView, value]);
  return <span ref={ref}>{prefix}{display.toLocaleString("bn-BD")}{suffix}</span>;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-sm text-muted-foreground">
      {time.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

const COLORS = ["#22c55e","#3b82f6","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#f97316","#14b8a6"];

const impactData = [
  { name: "উৎপাদন বৃদ্ধি", value: 30, fill: "#22c55e" },
  { name: "খরচ সাশ্রয়", value: 25, fill: "#3b82f6" },
  { name: "রোগ প্রতিরোধ", value: 85, fill: "#f59e0b" },
  { name: "বাজার সংযোগ", value: 60, fill: "#8b5cf6" },
];

const serviceUsage = [
  { name: "রোগ নির্ণয়", value: 34, color: "#ef4444" },
  { name: "বাজার মূল্য", value: 22, color: "#3b82f6" },
  { name: "আবহাওয়া", value: 18, color: "#06b6d4" },
  { name: "সার নির্দেশ", value: 12, color: "#8b5cf6" },
  { name: "সেন্সর", value: 8, color: "#22c55e" },
  { name: "অন্যান্য", value: 6, color: "#f59e0b" },
];

const weeklyFarmers = [
  { day: "সোম", কৃষক: 320 },
  { day: "মঙ্গল", কৃষক: 480 },
  { day: "বুধ", কৃষক: 410 },
  { day: "বৃহ", কৃষক: 560 },
  { day: "শুক্র", কৃষক: 620 },
  { day: "শনি", কৃষক: 740 },
  { day: "রবি", কৃষক: 680 },
];

const yieldTrend = [
  { month: "জানু", ধান: 4.2, গম: 2.8, সরিষা: 1.5 },
  { month: "ফেব্র", ধান: 4.5, গম: 3.1, সরিষা: 1.8 },
  { month: "মার্চ", ধান: 4.8, গম: 3.4, সরিষা: 2.1 },
  { month: "এপ্রিল", ধান: 5.1, গম: 3.2, সরিষা: 2.0 },
  { month: "মে", ধান: 5.4, গম: 3.0, সরিষা: 1.9 },
  { month: "জুন", ধান: 5.8, গম: 2.9, সরিষা: 1.7 },
];

const kpiCards = [
  { label: "নিবন্ধিত কৃষক", value: 2420, suffix: "+", icon: Users, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", change: "+১২%", up: true },
  { label: "সক্রিয় সেন্সর", value: 48, suffix: "টি", icon: Gauge, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", change: "+৫টি", up: true },
  { label: "বাজার পণ্য", value: 156, suffix: "টি", icon: ShoppingBag, color: "from-orange-500 to-amber-500", bg: "bg-orange-500/10", change: "+৮%", up: true },
  { label: "বিশেষজ্ঞ পরামর্শদাতা", value: 38, suffix: "জন", icon: Star, color: "from-purple-500 to-violet-500", bg: "bg-purple-500/10", change: "+৩জন", up: true },
  { label: "সক্রিয় ড্রোন", value: 3, suffix: "টি", icon: Plane, color: "from-indigo-500 to-blue-500", bg: "bg-indigo-500/10", change: "লাইভ", up: null },
  { label: "সেচ সক্রিয়", value: 2, suffix: "টি", icon: Droplets, color: "from-cyan-500 to-teal-500", bg: "bg-cyan-500/10", change: "চলমান", up: null },
  { label: "পশু পর্যবেক্ষণ", value: 4, suffix: "টি", icon: Heart, color: "from-rose-500 to-pink-500", bg: "bg-rose-500/10", change: "১টি সতর্ক", up: false },
  { label: "জেলা কভারেজ", value: 64, suffix: "টি", icon: Map, color: "from-teal-500 to-green-500", bg: "bg-teal-500/10", change: "সারাদেশ", up: null },
];

const whyItems = [
  { icon: TrendingUp, title: "উৎপাদন ৩০% বেশি", desc: "স্মার্ট সার ও সেচ ব্যবস্থাপনায় প্রতি বিঘায় গড়ে ৩০% বেশি ফসল", color: "text-emerald-500", bg: "bg-emerald-500/10", stat: "৩০%" },
  { icon: Shield, title: "ফসল রক্ষা AI", desc: "রোগ লক্ষণ দেখামাত্র AI স্বয়ংক্রিয়ভাবে সনাক্ত ও প্রতিকার জানায়", color: "text-blue-500", bg: "bg-blue-500/10", stat: "৯২%" },
  { icon: Zap, title: "রিয়েল-টাইম সতর্কতা", desc: "মাটি, পানি, আবহাওয়ার ডেটা ২৪/৭ পর্যবেক্ষণ এবং তাৎক্ষণিক alert", color: "text-amber-500", bg: "bg-amber-500/10", stat: "২৪/৭" },
  { icon: ShoppingBag, title: "সরাসরি বাজার মূল্য", desc: "মধ্যস্বত্বভোগী ছাড়া সরাসরি বাজার মূল্য ও ক্রেতার সাথে যোগাযোগ", color: "text-orange-500", bg: "bg-orange-500/10", stat: "৬৪টি বাজার" },
  { icon: Users, title: "বিশেষজ্ঞ নেটওয়ার্ক", desc: "৩৮ জন অভিজ্ঞ কৃষিবিদের সাথে সরাসরি পরামর্শের সুযোগ", color: "text-purple-500", bg: "bg-purple-500/10", stat: "৩৮জন" },
  { icon: CloudRain, title: "আবহাওয়া পূর্বাভাস", desc: "স্থানীয় ৫ দিনের আবহাওয়া পূর্বাভাস এবং বন্যা ঝুঁকি সতর্কতা", color: "text-cyan-500", bg: "bg-cyan-500/10", stat: "৫ দিন" },
];

const CustomTooltipBn = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl shadow-xl p-3 text-sm">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value?.toLocaleString("bn-BD")}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const marketData = useApi<any[]>("/api/market-prices", 30000);
  const weatherData = useApi<any>("/api/weather/current", 60000);
  const forecastData = useApi<any[]>("/api/weather/forecast", 60000);
  const sensorData = useApi<any[]>("/api/sensor/dashboard", 15000);
  const animalData = useApi<any[]>("/api/animal-health", 30000);
  const droneData = useApi<any[]>("/api/drones", 30000);

  const marketChartData = (marketData || []).slice(0, 8).map((m: any) => ({
    name: m.cropName,
    পাইকারি: m.wholesalePrice,
    খুচরা: m.retailPrice,
    trend: m.trend,
  }));

  const forecastChartData = (forecastData || []).map((f: any) => ({
    name: f.label || f.date,
    তাপমাত্রা: f.temperature,
    আর্দ্রতা: f.humidity,
    বৃষ্টি: f.rainfall,
  }));

  const sensorChartData = (sensorData || []).map((s: any) => {
    const labelMap: Record<string, string> = {
      soil_moisture: "মাটি আর্দ্রতা",
      ph: "pH মান",
      salinity: "লবণাক্ততা",
      tds: "TDS",
      oxygen: "অক্সিজেন",
      turbidity: "ঘোলাত্ব",
      water_level: "পানি স্তর",
      temperature: "তাপমাত্রা",
    };
    return { name: labelMap[s.sensorType] || s.sensorType, মান: parseFloat(s.value?.toFixed(1)) };
  });

  const alertCount = (animalData || []).filter((a: any) => a.status === "বিপদজনক" || a.status === "সতর্ক").length;
  const healthyCount = (animalData || []).filter((a: any) => a.status === "সুস্থ").length;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">লাইভ ড্যাশবোর্ড</h1>
              <p className="text-[11px] text-muted-foreground">রিয়েল-টাইম কৃষি পর্যবেক্ষণ কেন্দ্র</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
              <Wifi className="w-3 h-3 animate-pulse" />
              লাইভ সংযুক্ত
            </div>
            <LiveClock />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* ── KPI Cards ── */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3"
        >
          {kpiCards.map((k) => (
            <motion.div
              key={k.label}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
            >
              <Card className="border border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                    <k.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-bold leading-tight">
                    <AnimatedNumber value={k.value} suffix={k.suffix} />
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{k.label}</p>
                  <div className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${k.up === true ? "text-emerald-500" : k.up === false ? "text-red-500" : "text-muted-foreground"}`}>
                    {k.up === true ? <TrendingUp className="w-3 h-3" /> : k.up === false ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {k.change}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Row 1: Market prices + Service usage ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Market Price Bar Chart */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border border-border/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">বাজার মূল্য তুলনা</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">পাইকারি ও খুচরা মূল্য (৳/মণ)</p>
                </div>
                <Badge variant="outline" className="text-[10px]">রিয়েল-টাইম</Badge>
              </CardHeader>
              <CardContent>
                {marketChartData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">ডেটা লোড হচ্ছে...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={marketChartData} barCategoryGap="25%" barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={45} />
                      <Tooltip content={<CustomTooltipBn />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="পাইকারি" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="খুচরা" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {/* Trend ticker */}
                {marketData && marketData.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {marketData.slice(0, 5).map((m: any) => (
                      <span key={m.id} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${m.trend === "বেশি" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : m.trend === "কম" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {m.trend === "বেশি" ? <TrendingUp className="w-2.5 h-2.5" /> : m.trend === "কম" ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                        {m.cropName} ৳{m.wholesalePrice?.toLocaleString("bn-BD")}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Service usage Pie */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">সেবা ব্যবহার বিতরণ</CardTitle>
                <p className="text-xs text-muted-foreground">মোট ব্যবহারকারীর %</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={serviceUsage} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value" nameKey="name">
                      {serviceUsage.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {serviceUsage.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-muted-foreground truncate">{s.name}</span>
                      <span className="font-semibold ml-auto">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Row 2: Weather forecast + Sensor readings ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Weather forecast line chart */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="border border-border/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">আবহাওয়া পূর্বাভাস</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">পরবর্তী ৫ দিন</p>
                </div>
                {weatherData && (
                  <div className="text-right">
                    <p className="text-lg font-bold">{weatherData.temperature?.toFixed(1)}°C</p>
                    <p className="text-[10px] text-muted-foreground">{weatherData.location}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {forecastChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">লোড হচ্ছে...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={forecastChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip content={<CustomTooltipBn />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="তাপমাত্রা" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="আর্দ্রতা" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="বৃষ্টি" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sensor radar bar */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">সেন্সর পাঠ (বর্তমান)</CardTitle>
                <p className="text-xs text-muted-foreground">রিয়েল-টাইম IoT ডেটা</p>
              </CardHeader>
              <CardContent>
                {sensorChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">সেন্সর সংযোগ হচ্ছে...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sensorChartData} layout="vertical" barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={72} />
                      <Tooltip content={<CustomTooltipBn />} />
                      <Bar dataKey="মান" radius={[0, 6, 6, 0]}>
                        {sensorChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Row 3: Yield trend + Impact radials + Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Yield trend area chart */}
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">ফসল উৎপাদন প্রবণতা</CardTitle>
                <p className="text-xs text-muted-foreground">টন/হেক্টর — ২০২৬ সাল</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={yieldTrend}>
                    <defs>
                      <linearGradient id="gDhan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gGom" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltipBn />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="ধান" stroke="#22c55e" strokeWidth={2.5} fill="url(#gDhan)" dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="গম" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gGom)" dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="সরিষা" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gSor)" dot={false} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live status panel */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border border-border/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">লাইভ স্ট্যাটাস</CardTitle>
                <p className="text-xs text-muted-foreground">সব সিস্টেমের অবস্থা</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Weather */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <CloudRain className="w-4 h-4 text-cyan-500" />
                    <div>
                      <p className="text-xs font-semibold">আবহাওয়া</p>
                      <p className="text-[10px] text-muted-foreground">{weatherData ? `${weatherData.temperature?.toFixed(1)}°C · ${weatherData.humidity}% আর্দ্রতা` : "লোড হচ্ছে..."}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Sensors */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <Gauge className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs font-semibold">সেন্সর নেটওয়ার্ক</p>
                      <p className="text-[10px] text-muted-foreground">{sensorData ? `${sensorData.length}টি সক্রিয় সেন্সর` : "সংযোগ হচ্ছে..."}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Animals */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <div>
                      <p className="text-xs font-semibold">পশু স্বাস্থ্য</p>
                      <p className="text-[10px] text-muted-foreground">{animalData ? `${healthyCount}টি সুস্থ · ${alertCount}টি সতর্ক` : "লোড হচ্ছে..."}</p>
                    </div>
                  </div>
                  {alertCount > 0 ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>

                {/* Drones */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <Plane className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-xs font-semibold">ড্রোন বহর</p>
                      <p className="text-[10px] text-muted-foreground">{droneData ? droneData.map((d: any) => d.status).join(" · ") : "লোড হচ্ছে..."}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Active farmers */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold">সক্রিয় কৃষক (আজ)</p>
                      <p className="text-[10px] text-muted-foreground">৬৮০ জন ব্যবহারকারী</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                    <ArrowUpRight className="w-3 h-3" />
                    +১২%
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Row 4: Weekly usage chart ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="border border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">সাপ্তাহিক কৃষক কার্যক্রম</CardTitle>
                <p className="text-xs text-muted-foreground">চলতি সপ্তাহে প্রতিদিনের সক্রিয় ব্যবহারকারী</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">এই সপ্তাহ</Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={weeklyFarmers}>
                  <defs>
                    <linearGradient id="gFarmers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip content={<CustomTooltipBn />} />
                  <Area type="monotone" dataKey="কৃষক" stroke="#22c55e" strokeWidth={2.5} fill="url(#gFarmers)" dot={{ r: 4, fill: "#22c55e" }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Why use this app — Infographic ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-emerald-600 to-teal-700 p-8 md:p-10">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/8 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/8 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-white/70" />
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">কেন এগ্রোবাংলা?</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">এই অ্যাপ কেন দরকার?</h2>
              <p className="text-white/70 text-sm mb-8 max-w-2xl">বাংলাদেশের ১ কোটি ৬০ লক্ষ কৃষক পরিবারের জন্য আধুনিক প্রযুক্তির মাধ্যমে কৃষি সমস্যার সমাধান</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {whyItems.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 + i * 0.07 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 hover:bg-white/15 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-extrabold text-white/90">{item.stat}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                    <p className="text-xs text-white/65 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Impact numbers */}
              <div className="mt-8 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "সাশ্রয়কৃত ফসল ক্ষতি", value: "৳৮.৫ কোটি" },
                  { label: "রোগ নির্ণয় সফলতা", value: "৯২%" },
                  { label: "গড় উৎপাদন বৃদ্ধি", value: "৩০%" },
                  { label: "সন্তুষ্ট কৃষক", value: "৯৭%" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl md:text-3xl font-extrabold text-white">{s.value}</p>
                    <p className="text-[11px] text-white/60 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Impact radial bars ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <Card className="border border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">প্ল্যাটফর্মের প্রভাব সূচক</CardTitle>
              <p className="text-xs text-muted-foreground">কৃষকদের জীবনে পরিমাপযোগ্য পরিবর্তন (%)</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {impactData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center">
                    <RadialBarChart width={120} height={120} cx={60} cy={60} innerRadius={34} outerRadius={52} data={[{ value: item.value, fill: item.fill }]} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "hsl(var(--muted))" }} />
                    </RadialBarChart>
                    <p className="text-xl font-extrabold mt-1" style={{ color: item.fill }}>{item.value}%</p>
                    <p className="text-xs text-muted-foreground text-center mt-0.5">{item.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          <Activity className="w-3 h-3 inline mr-1" />
          ড্যাশবোর্ড প্রতি ৩০ সেকেন্ডে স্বয়ংক্রিয়ভাবে আপডেট হয় · AgroBangla IoT নেটওয়ার্ক
        </p>
      </div>
    </div>
  );
}
