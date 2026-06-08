import { useState, useRef, useCallback } from "react";
import { useDetectDisease, useGetDiseaseHistory } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, AlertTriangle, CheckCircle, Clock, Leaf, Upload,
  ImageIcon, Loader2, Camera, BarChart3, Droplets
} from "lucide-react";
import { toast } from "sonner";

const CROPS = [
  { value: "rice", label: "ধান (Rice)" },
  { value: "wheat", label: "গম (Wheat)" },
  { value: "potato", label: "আলু (Potato)" },
  { value: "tomato", label: "টমেটো (Tomato)" },
  { value: "jute", label: "পাট (Jute)" },
  { value: "mustard", label: "সরিষা (Mustard)" },
  { value: "sugarcane", label: "আখ (Sugarcane)" },
];

const severityConfig = {
  low:    { label: "কম",    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",  icon: CheckCircle },
  medium: { label: "মধ্যম", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  high:   { label: "বেশি",  color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",          icon: AlertTriangle },
};

const COLOR_LABELS: Record<string, { label: string; bg: string }> = {
  green:  { label: "সবুজ (সুস্থ)", bg: "bg-green-500" },
  brown:  { label: "বাদামি (রোগ)", bg: "bg-amber-700" },
  yellow: { label: "হলুদ (ভাইরাস)", bg: "bg-yellow-400" },
  white:  { label: "সাদা (ছত্রাক)", bg: "bg-gray-300" },
  dark:   { label: "কালো (পচন)", bg: "bg-gray-800" },
};

interface ImageResult {
  id: number; cropType: string; diseaseName: string; diseaseNameBn: string;
  severity: string; treatment: string; treatmentBn: string;
  symptoms: string; symptomsBn: string; confidence: number;
  dominantColor: string;
  colorAnalysis: { green: number; brown: number; yellow: number; white: number; dark: number };
  detectedAt: string;
  additionalInfo?: string;
  additionalInfoBn?: string;
  analyzedBy?: string;
}

function ResultCard({ result }: { result: ImageResult }) {
  const sev = severityConfig[result.severity as keyof typeof severityConfig] ?? severityConfig.medium;
  const Icon = sev.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-xl">{result.diseaseNameBn}</p>
              <p className="text-muted-foreground text-sm">{result.diseaseName}</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium shrink-0 ${sev.color}`}>
              <Icon className="w-3.5 h-3.5" />{sev.label}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence bar */}
          <div className="bg-background/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground font-medium">নির্ভরযোগ্যতা (Confidence)</p>
              <span className="text-sm font-bold">{(result.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

          {/* Color analysis */}
          <div className="bg-background/80 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-2">
              <BarChart3 className="w-3.5 h-3.5" /> পিক্সেল রঙ বিশ্লেষণ
            </p>
            <div className="space-y-1.5">
              {Object.entries(result.colorAnalysis).map(([color, pct]) => {
                const cfg = COLOR_LABELS[color];
                return (
                  <div key={color} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">{cfg?.label ?? color}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg?.bg ?? "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <p className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" /> লক্ষণ
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.symptomsBn}</p>
          </div>

          {/* Treatment */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-green-800 dark:text-green-300">
              <Droplets className="w-4 h-4" /> প্রতিকার ও চিকিৎসা
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">{result.treatmentBn}</p>
          </div>

          {/* Additional info */}
          {result.additionalInfoBn && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                <Leaf className="w-4 h-4" /> অতিরিক্ত পরামর্শ
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">{result.additionalInfoBn}</p>
            </div>
          )}

          {/* Analyzed by badge */}
          {result.analyzedBy === "gemini" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                ✦ Gemini AI দ্বারা বিশ্লেষণ করা হয়েছে
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DiseaseDetector() {
  /* ── Image upload state ── */
  const [cropType, setCropType] = useState("rice");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Text symptom state (legacy) ── */
  const [textCropType, setTextCropType] = useState("rice");
  const [symptoms, setSymptoms] = useState("");
  const [textResult, setTextResult] = useState<ReturnType<typeof useDetectDisease>["data"] | null>(null);

  const { mutate: detectByText, isPending: textPending } = useDetectDisease({
    mutation: {
      onSuccess: (d) => { setTextResult(d); toast.success("রোগ নির্ণয় সম্পন্ন!"); },
      onError: () => toast.error("রোগ নির্ণয় ব্যর্থ হয়েছে।"),
    },
  });

  const { data: history, isLoading: historyLoading } = useGetDiseaseHistory();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("শুধু ছবি ফাইল দিন।"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("ছবির সাইজ সর্বোচ্চ ১০ MB।"); return; }
    setImageFile(file);
    setImageResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const analyzeImage = async () => {
    if (!imageFile) { toast.error("প্রথমে ছবি নির্বাচন করুন।"); return; }
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("cropType", cropType);
      const res = await fetch("/api/disease/detect-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setImageResult(data);
      toast.success("ছবি বিশ্লেষণ সম্পন্ন!");
    } catch {
      toast.error("ছবি বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ফসলের রোগ নির্ণয়</h1>
        <p className="text-muted-foreground">ছবি তুলে আপলোড করুন — Gemini AI দিয়ে যেকোনো ফসলের যেকোনো রোগ সনাক্ত করবে</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: detection ── */}
        <div>
          <Tabs defaultValue="image">
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="image" className="flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> ছবি দিয়ে নির্ণয়
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> লক্ষণ বর্ণনা
              </TabsTrigger>
            </TabsList>

            {/* ── IMAGE tab ── */}
            <TabsContent value="image" className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  {/* Crop selector */}
                  <div className="space-y-1.5">
                    <Label>ফসলের ধরন</Label>
                    <Select value={cropType} onValueChange={setCropType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CROPS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden
                      ${isDragOver ? "border-primary bg-primary/10 scale-[1.02]" : "border-border hover:border-primary/60 hover:bg-muted/50"}`}
                    style={{ minHeight: 200 }}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-white text-center">
                            <Camera className="w-8 h-8 mx-auto mb-1" />
                            <p className="text-sm">ছবি পরিবর্তন করুন</p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-600 text-white">
                            {imageFile?.name.slice(0, 20)}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-semibold mb-1">ছবি আপলোড করুন</p>
                        <p className="text-sm text-muted-foreground mb-3">ড্র্যাগ করুন অথবা ক্লিক করুন</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · সর্বোচ্চ ১০ MB</p>
                        <p className="text-xs text-primary mt-2 font-medium">আক্রান্ত পাতার স্পষ্ট ছবি তুলুন</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                  <Button className="w-full" disabled={!imageFile || analyzing} onClick={analyzeImage}>
                    {analyzing
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />বিশ্লেষণ চলছে...</>
                      : <><ImageIcon className="w-4 h-4 mr-2" />ছবি বিশ্লেষণ করুন</>}
                  </Button>
                </CardContent>
              </Card>

              <AnimatePresence>
                {imageResult && <ResultCard result={imageResult} />}
              </AnimatePresence>
            </TabsContent>

            {/* ── TEXT tab ── */}
            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label>ফসলের ধরন</Label>
                    <Select value={textCropType} onValueChange={setTextCropType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CROPS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>রোগের লক্ষণ বর্ণনা করুন</Label>
                    <textarea
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      rows={5}
                      placeholder="যেমন: পাতায় বাদামি দাগ, গাছ হলুদ হয়ে যাচ্ছে, ফলে পচন ধরছে..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <Button className="w-full" disabled={textPending || !textCropType || !symptoms}
                    onClick={() => detectByText({ data: { cropType: textCropType, symptoms } })}>
                    {textPending ? "বিশ্লেষণ চলছে..." : "রোগ নির্ণয় করুন"}
                  </Button>
                </CardContent>
              </Card>

              <AnimatePresence>
                {textResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-xl">{textResult.diseaseNameBn}</p>
                            <p className="text-muted-foreground text-sm">{textResult.diseaseName}</p>
                          </div>
                          {(() => {
                            const sev = severityConfig[textResult.severity as keyof typeof severityConfig];
                            const Icon = sev.icon;
                            return <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${sev.color}`}><Icon className="w-3.5 h-3.5" />{sev.label}</div>;
                          })()}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${textResult.confidence * 100}%` }} />
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">প্রতিকার</p>
                          <p className="text-sm text-green-700 dark:text-green-400">{textResult.treatmentBn}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right: history ── */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> সাম্প্রতিক নির্ণয় ইতিহাস
          </h2>
          {historyLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 mb-3" />)
            : !history?.length
              ? (
                <Card className="p-10 text-center">
                  <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">এখনো কোনো নির্ণয় করা হয়নি</p>
                  <p className="text-sm text-muted-foreground mt-1">উপরে ছবি আপলোড করে শুরু করুন</p>
                </Card>
              )
              : (
                <div className="space-y-3">
                  {history.map(item => {
                    const sev = severityConfig[item.severity as keyof typeof severityConfig];
                    return (
                      <Card key={item.id} className="hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{item.diseaseNameBn}</p>
                              <p className="text-sm text-muted-foreground">{item.cropType} — {item.diseaseName}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${sev?.color}`}>{sev?.label}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(item.detectedAt).toLocaleDateString("bn-BD")}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
        </div>
      </div>
    </motion.div>
  );
}
