import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Minus, ShoppingCart, Search,
  MapPin, BarChart3, ArrowUpRight, ArrowDownRight, Wheat,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function fetchPrices() {
  return fetch(`${BASE}/api/market-prices`).then(r => r.json());
}

const trendMeta: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  "বেশি": { color: "text-emerald-700 bg-emerald-100", icon: <ArrowUpRight className="w-3 h-3" />, label: "বেশি" },
  "কম": { color: "text-red-700 bg-red-100", icon: <ArrowDownRight className="w-3 h-3" />, label: "কম" },
  "স্থির": { color: "text-slate-700 bg-slate-100", icon: <Minus className="w-3 h-3" />, label: "স্থির" },
};

const cropIcons: Record<string, React.ReactNode> = {
  "ধান": <Wheat className="w-4 h-4" />,
  "গম": <Wheat className="w-4 h-4" />,
  "সবুজি": <Wheat className="w-4 h-4" />,
  "ফল": <Wheat className="w-4 h-4" />,
  "তাল": <Wheat className="w-4 h-4" />,
  "ডাল": <Wheat className="w-4 h-4" />,
  "ধনিয়া": <Wheat className="w-4 h-4" />,
  "ধুনিয়া": <Wheat className="w-4 h-4" />,
};

export default function MarketIntelligence() {
  const { data: prices, isLoading } = useQuery({ queryKey: ["market-prices"], queryFn: fetchPrices });
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");

  const filtered = prices?.filter((p: any) => {
    const q = search.toLowerCase();
    const d = district.toLowerCase();
    return (!q || p.cropName?.toLowerCase().includes(q)) && (!d || p.district?.toLowerCase().includes(d));
  }) || [];

  const stats = {
    total: prices?.length || 0,
    up: prices?.filter((p: any) => p.trend === "বেশি").length || 0,
    down: prices?.filter((p: any) => p.trend === "কম").length || 0,
    stable: prices?.filter((p: any) => p.trend === "স্থির").length || 0,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">বাজার পর্যবেক্ষণ</h1>
          <p className="text-muted-foreground">তাত্ক্ষণিক বাজার দর এবং তরতর নির্রবাছ দদন</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">বেশি</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{stats.up}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-muted-foreground">কম</span>
            </div>
            <p className="text-xl font-bold text-red-700">{stats.down}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50/50 border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-muted-foreground">স্থির</span>
            </div>
            <p className="text-xl font-bold text-slate-700">{stats.stable}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">সরে সদন</span>
            </div>
            <p className="text-xl font-bold text-blue-700">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="ফসল দিয়ে খুনুন..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="জেলা দিয়ে সন্দ"
            value={district} onChange={e => setDistrict(e.target.value)} />
        </div>
      </div>

      {/* Price list */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((p: any, i: number) => {
            const tr = trendMeta[p.trend] || trendMeta["স্থির"];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        {cropIcons[p.cropName] || <Wheat className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{p.cropName}</p>
                          {p.variety && <Badge variant="secondary" className="text-[10px]">{p.variety}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {p.marketName} • {p.district}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">নিতি বিক্রি</p>
                        <p className="font-semibold text-sm">৳{p.wholesalePrice?.toFixed(0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">খুছ্রা বিক্রি</p>
                        <p className="font-semibold text-sm">৳{p.retailPrice?.toFixed(0)}</p>
                      </div>
                      <Badge className={`${tr.bg} ${tr.color} text-xs gap-1`}>
                        {tr.icon} {tr.label}
                      </Badge>
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-muted-foreground">সরেবরাহ</p>
                        <p className="text-xs font-medium">{p.volume?.toFixed(0) || "—"} {p.unit}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো দর পাওয়া যায়নি</p>
        </Card>
      )}
    </motion.div>
  );
}
