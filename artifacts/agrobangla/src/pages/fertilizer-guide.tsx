import { useState } from "react";
import { useGetFertilizerGuides, getGetFertilizerGuidesQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TestTube, Leaf } from "lucide-react";

const SEASONS = ["Rabi", "Kharif", "Year-round"];
const CROPS = ["Rice", "Wheat", "Potato", "Jute", "Tomato", "Mustard", "Sugarcane"];

export default function FertilizerGuide() {
  const [cropFilter, setCropFilter] = useState("");
  const [seasonFilter, setSeasonFilter] = useState<string | undefined>(undefined);

  const { data: guides, isLoading } = useGetFertilizerGuides(
    { crop: cropFilter || undefined, season: seasonFilter || undefined },
    { query: { queryKey: getGetFertilizerGuidesQueryKey({ crop: cropFilter || undefined, season: seasonFilter || undefined }) } }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">সার নির্দেশিকা</h1>
        <p className="text-muted-foreground">ফসল অনুযায়ী সঠিক সার ব্যবস্থাপনার তথ্য — প্রতি একরে প্রয়োজনীয় পরিমাণ</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={cropFilter || "all"} onValueChange={v => setCropFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="ফসল নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল ফসল</SelectItem>
            {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={seasonFilter || "all"} onValueChange={v => setSeasonFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="মৌসুম নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল মৌসুম</SelectItem>
            {SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : !guides?.length ? (
        <Card className="p-12 text-center">
          <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো তথ্য পাওয়া যায়নি</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {guides.map((guide) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <TestTube className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{guide.cropNameBn}</CardTitle>
                        <p className="text-sm text-muted-foreground">{guide.cropName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{guide.season}</Badge>
                      <Badge variant="outline">{guide.soilType}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">প্রতি একরে সার (কেজি)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{guide.nitrogenKgPerAcre}</p>
                          <p className="text-xs text-muted-foreground mt-1">নাইট্রোজেন (N)</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{guide.phosphorusKgPerAcre}</p>
                          <p className="text-xs text-muted-foreground mt-1">ফসফরাস (P)</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{guide.potassiumKgPerAcre}</p>
                          <p className="text-xs text-muted-foreground mt-1">পটাশিয়াম (K)</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">প্রয়োগ সময়সূচি</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{guide.applicationScheduleBn}</p>
                      {guide.notes && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            <span className="font-semibold">বিশেষ নোট: </span>{guide.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
