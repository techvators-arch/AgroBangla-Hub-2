import { useState } from "react";
import { useVerifyKrishokCard, useRegisterKrishokCard } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle, XCircle, ShieldCheck, User, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import cardFrontImg from "@assets/card_front_1780548022924.jpeg";

const DISTRICTS_BN = [
  "ঢাকা","চট্টগ্রাম","রাজশাহী","খুলনা","বরিশাল","সিলেট","রংপুর","ময়মনসিংহ",
  "কুমিল্লা","দিনাজপুর","টাঙ্গাইল","ফরিদপুর","যশোর","পাবনা","বগুড়া","নোয়াখালী",
];
const CROP_TYPES = ["ধান","গম","পাট","আলু","টমেটো","সরিষা","আখ","সবজি","ফল","চা","পেঁয়াজ","মসুর"];

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function GovernmentCard({ card }: {
  card: {
    farmerNameBn: string; farmerName: string; fatherName?: string;
    cardNumber: string; district: string; upazila: string;
    phone: string; landSize: number; status: string; issuedAt?: string | null;
    cropTypes?: string[] | string;
  }
}) {
  const cardNum = card.cardNumber.replace(/\D/g, "").slice(0, 16);
  const formatted = cardNum.replace(/(.{4})/g, "$1 ").trim() || card.cardNumber;
  const location = `${card.upazila}, ${card.district}`;
  const expiry = card.issuedAt
    ? new Date(new Date(card.issuedAt).setFullYear(new Date(card.issuedAt).getFullYear() + 5))
        .toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" }).replace("/", "/")
    : "০৩/২০৩২";
  const crops = Array.isArray(card.cropTypes)
    ? card.cropTypes
    : card.cropTypes ? JSON.parse(card.cropTypes as string) : [];

  const statusBadge = {
    pending:  { label: "প্রক্রিয়াধীন",  bg: "bg-amber-400 text-amber-900" },
    verified: { label: "সক্রিয়",         bg: "bg-green-300 text-green-900" },
    rejected: { label: "প্রত্যাখ্যাত",  bg: "bg-red-400 text-red-900" },
  }[card.status as "pending" | "verified" | "rejected"] ?? { label: card.status, bg: "bg-gray-300 text-gray-800" };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* ── Official-style card ── */}
      <div
        className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-2xl select-none"
        style={{ aspectRatio: "85.6/53.98", background: "linear-gradient(135deg, #1a6b2f 0%, #0f4a1f 40%, #1e7a35 70%, #145a28 100%)" }}
      >
        {/* dotted Bangladesh map watermark */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-4">
          <svg viewBox="0 0 120 100" className="h-4/5 w-auto fill-white">
            <ellipse cx="60" cy="50" rx="30" ry="40" />
            <ellipse cx="75" cy="35" rx="12" ry="18" />
            <ellipse cx="45" cy="65" rx="10" ry="14" />
          </svg>
        </div>
        {/* farm silhouette strip at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-full fill-white">
            <path d="M0,40 L0,25 Q20,10 40,22 Q60,34 80,20 Q100,6 120,18 Q140,30 160,15 Q180,0 200,12 Q220,24 240,10 Q260,-2 280,14 Q300,30 320,18 Q340,6 360,20 Q380,34 400,22 L400,40 Z"/>
          </svg>
        </div>

        <div className="relative z-10 p-4 h-full flex flex-col">
          {/* Header row */}
          <div className="flex items-start gap-2 mb-2">
            {/* Govt seal placeholder */}
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-yellow-400/60 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 40 40" className="w-7 h-7 fill-yellow-300">
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 8 L22 16 L30 16 L24 21 L26 29 L20 24 L14 29 L16 21 L10 16 L18 16 Z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-xs leading-tight">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
              <p className="text-white/70 text-[9px] leading-tight">Government of the People's Republic of Bangladesh</p>
            </div>
            <div className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 ${statusBadge.bg}`}>
              {statusBadge.label}
            </div>
          </div>

          {/* Title */}
          <div className="mb-2">
            <p className="text-yellow-300 font-extrabold text-sm tracking-wide">কৃষক কার্ড — Farmers Card</p>
          </div>

          {/* Chip + Name + Photo row */}
          <div className="flex items-start gap-3 flex-1">
            <div className="flex flex-col gap-2">
              {/* EMV Chip */}
              <div className="w-9 h-7 rounded-sm bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow border border-yellow-300/50 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-px w-6 h-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-yellow-600/40 rounded-sm" />
                  ))}
                </div>
              </div>
              {/* Info */}
              <div className="text-white space-y-0.5">
                <p className="font-bold text-sm leading-tight">{card.farmerNameBn}</p>
                <p className="text-white/60 text-[9px]">{card.farmerName}</p>
                {card.fatherName && <p className="text-white/80 text-[10px]">{card.fatherName}</p>}
                <p className="text-white/80 text-[10px]">{location}</p>
                <p className="text-white/60 text-[9px]">{expiry}</p>
              </div>
            </div>

            <div className="ml-auto">
              {/* Photo placeholder */}
              <div className="w-14 h-16 bg-white/20 border border-white/30 rounded flex items-center justify-center">
                <User className="w-8 h-8 text-white/40" />
              </div>
            </div>
          </div>

          {/* Card number at bottom */}
          <div className="mt-2 pt-1.5 border-t border-white/20">
            <p className="font-mono text-white font-bold text-sm tracking-[0.2em]">{formatted || "XXXX XXXX XXXX XXXX"}</p>
          </div>
        </div>
      </div>

      {/* Crops info */}
      {crops.length > 0 && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2">নিবন্ধিত ফসল</p>
            <div className="flex flex-wrap gap-1.5">
              {crops.map((c: string) => <Badge key={c} variant="secondary">{c}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default function KrishokCard() {
  /* ── Verify state ── */
  const [cardNumber, setCardNumber] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [verifiedCard, setVerifiedCard] = useState<ReturnType<typeof useVerifyKrishokCard>["data"] | null>(null);

  /* ── Register state ── */
  const [step, setStep] = useState<1 | 2>(1);
  const [govCardNum, setGovCardNum] = useState(""); // 16-digit from physical card
  const [regForm, setRegForm] = useState({
    farmerName: "", farmerNameBn: "", fatherName: "", nidNumber: "",
    district: "ঢাকা", upazila: "", village: "", phone: "",
    landSize: "", cropTypes: [] as string[],
  });
  const [registeredCard, setRegisteredCard] = useState<ReturnType<typeof useRegisterKrishokCard>["data"] | null>(null);

  const { mutate: verify, isPending: verifying } = useVerifyKrishokCard({
    mutation: {
      onSuccess: (data) => { setVerifiedCard(data); toast.success("কার্ড যাচাই সম্পন্ন!"); },
      onError: () => { setVerifiedCard(null); toast.error("কার্ড পাওয়া যায়নি। নম্বর সঠিক কিনা দেখুন।"); },
    },
  });

  const { mutate: register, isPending: registering } = useRegisterKrishokCard({
    mutation: {
      onSuccess: (data) => { setRegisteredCard(data); toast.success("নিবন্ধন সফল হয়েছে!"); },
      onError: () => toast.error("নিবন্ধন ব্যর্থ হয়েছে। তথ্য সঠিক কিনা যাচাই করুন।"),
    },
  });

  const toggleCrop = (c: string) =>
    setRegForm(p => ({ ...p, cropTypes: p.cropTypes.includes(c) ? p.cropTypes.filter(x => x !== c) : [...p.cropTypes, c] }));

  const handleVerify = () => {
    const raw = cardNumber.replace(/\s/g, "");
    verify({ data: { cardNumber: raw, nidNumber: nidNumber || undefined } });
  };

  const handleRegister = () => {
    if (!regForm.farmerNameBn || !regForm.nidNumber || !regForm.phone || !regForm.upazila || !regForm.landSize) {
      toast.error("সকল আবশ্যিক তথ্য পূরণ করুন।");
      return;
    }
    if (regForm.cropTypes.length === 0) {
      toast.error("কমপক্ষে একটি ফসলের ধরন বেছে নিন।");
      return;
    }
    register({ data: { ...regForm, landSize: Number(regForm.landSize) } });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">কৃষক কার্ড</h1>
        <p className="text-muted-foreground">সরকারি কৃষক কার্ড দিয়ে নিবন্ধন করুন অথবা কার্ড যাচাই করুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* ── Left: reference card + info ── */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের কৃষক কার্ড
            </h2>
            <img
              src={cardFrontImg}
              alt="Official Krishok Card"
              className="w-full max-w-md rounded-xl shadow-2xl border-2 border-green-200 dark:border-green-800"
            />
          </div>

          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">এগ্রোবাংলা ব্যবহার করতে প্রয়োজন:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
                  <li>সরকার কর্তৃক ইস্যুকৃত আসল কৃষক কার্ড</li>
                  <li>কার্ডের ১৬-সংখ্যার নম্বর</li>
                  <li>জাতীয় পরিচয়পত্র (NID) নম্বর</li>
                  <li>নিবন্ধিত মোবাইল নম্বর</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: tabs ── */}
        <div>
          <Tabs defaultValue="register">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="register">নিবন্ধন করুন</TabsTrigger>
              <TabsTrigger value="verify">কার্ড যাচাই</TabsTrigger>
            </TabsList>

            {/* ── REGISTER ── */}
            <TabsContent value="register">
              {registeredCard ? (
                <div className="space-y-5">
                  <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-3" />
                    <h3 className="font-bold text-xl mb-1">নিবন্ধন সফল!</h3>
                    <p className="text-muted-foreground text-sm">আপনার কৃষক কার্ড এগ্রোবাংলায় সংযুক্ত হয়েছে।</p>
                    <p className="mt-3 text-sm font-mono bg-muted rounded px-3 py-2 inline-block font-bold tracking-wider">
                      {registeredCard.cardNumber}
                    </p>
                  </div>
                  <GovernmentCard card={registeredCard} />
                  <Button variant="outline" className="w-full" onClick={() => { setRegisteredCard(null); setStep(1); setGovCardNum(""); }}>
                    আরেকটি কার্ড নিবন্ধন করুন
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-2">
                    {[1, 2].map(s => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</div>
                        <span className={`text-sm ${step === s ? "font-semibold" : "text-muted-foreground"}`}>
                          {s === 1 ? "কার্ড নম্বর" : "ব্যক্তিগত তথ্য"}
                        </span>
                        {s < 2 && <div className="w-8 h-px bg-border mx-1" />}
                      </div>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-primary" />
                              আপনার সরকারি কৃষক কার্ডের নম্বর দিন
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Animated card preview */}
                            <div className="relative h-12 bg-gradient-to-r from-green-800 to-green-700 rounded-lg flex items-center px-4 shadow-inner overflow-hidden">
                              <div className="absolute right-0 top-0 bottom-0 w-24 opacity-10">
                                <svg viewBox="0 0 100 50" className="h-full w-full fill-white">
                                  <ellipse cx="50" cy="25" rx="25" ry="22"/>
                                </svg>
                              </div>
                              <p className="font-mono text-white font-bold tracking-[0.3em] text-lg">
                                {govCardNum ? formatCardNumber(govCardNum) : <span className="opacity-40">XXXX XXXX XXXX XXXX</span>}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>কার্ডের নিচে লেখা ১৬-সংখ্যার নম্বর *</Label>
                              <Input
                                value={formatCardNumber(govCardNum)}
                                onChange={e => setGovCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
                                placeholder="1234 5678 9012 3456"
                                className="font-mono text-lg tracking-widest"
                                maxLength={19}
                              />
                              <p className="text-xs text-muted-foreground">কার্ডের সামনের দিকে নিচে থাকা ১৬টি সংখ্যা লিখুন</p>
                            </div>

                            <div className="space-y-2">
                              <Label>জাতীয় পরিচয়পত্র (NID) নম্বর *</Label>
                              <Input
                                value={regForm.nidNumber}
                                onChange={e => setRegForm(p => ({ ...p, nidNumber: e.target.value }))}
                                placeholder="১০ বা ১৭ সংখ্যার NID"
                              />
                            </div>

                            <Button
                              className="w-full"
                              disabled={govCardNum.length < 16 || !regForm.nidNumber}
                              onClick={() => setStep(2)}
                            >
                              পরবর্তী ধাপ →
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <User className="w-5 h-5 text-primary" />
                              কার্ডের তথ্য অনুযায়ী পূরণ করুন
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-1.5">
                                <Label>কৃষকের নাম (বাংলায়) *</Label>
                                <Input value={regForm.farmerNameBn} onChange={e => setRegForm(p => ({ ...p, farmerNameBn: e.target.value }))} placeholder="কার্ডে যেভাবে লেখা আছে" />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Farmer Name (English)</Label>
                                <Input value={regForm.farmerName} onChange={e => setRegForm(p => ({ ...p, farmerName: e.target.value }))} placeholder="As on card" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label>পিতার নাম</Label>
                              <Input value={regForm.fatherName} onChange={e => setRegForm(p => ({ ...p, fatherName: e.target.value }))} placeholder="পিতার নাম" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label>জেলা *</Label>
                                <Select value={regForm.district} onValueChange={v => setRegForm(p => ({ ...p, district: v }))}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>{DISTRICTS_BN.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label>উপজেলা *</Label>
                                <Input value={regForm.upazila} onChange={e => setRegForm(p => ({ ...p, upazila: e.target.value }))} placeholder="উপজেলার নাম" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label>গ্রাম</Label>
                                <Input value={regForm.village} onChange={e => setRegForm(p => ({ ...p, village: e.target.value }))} placeholder="গ্রাম / মহল্লা" />
                              </div>
                              <div className="space-y-1.5">
                                <Label>মোবাইল নম্বর *</Label>
                                <Input value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label>মোট জমির পরিমাণ (একর) *</Label>
                              <Input type="number" step="0.1" min="0.1" value={regForm.landSize} onChange={e => setRegForm(p => ({ ...p, landSize: e.target.value }))} placeholder="যেমন: ২.৫" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>চাষকৃত ফসল * (একাধিক বেছে নিন)</Label>
                              <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-lg">
                                {CROP_TYPES.map(c => (
                                  <button key={c} type="button" onClick={() => toggleCrop(c)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-all ${regForm.cropTypes.includes(c) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border bg-background hover:border-primary"}`}>
                                    {c}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← পেছনে</Button>
                              <Button className="flex-1" disabled={registering} onClick={handleRegister}>
                                {registering ? "নিবন্ধন হচ্ছে..." : "নিবন্ধন সম্পন্ন করুন"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* ── VERIFY ── */}
            <TabsContent value="verify">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    কার্ড যাচাইকরণ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>কার্ড নম্বর (১৬ সংখ্যা)</Label>
                    <Input
                      value={formatCardNumber(cardNumber)}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      placeholder="1234 5678 9012 3456"
                      className="font-mono tracking-widest"
                      maxLength={19}
                    />
                    <p className="text-xs text-muted-foreground">কার্ডের নিচের ১৬-সংখ্যার নম্বর লিখুন</p>
                  </div>
                  <div className="space-y-2">
                    <Label>NID নম্বর (ঐচ্ছিক — অতিরিক্ত যাচাই)</Label>
                    <Input value={nidNumber} onChange={e => setNidNumber(e.target.value)} placeholder="জাতীয় পরিচয়পত্র নম্বর" />
                  </div>
                  <Button className="w-full" disabled={verifying || cardNumber.length < 16} onClick={handleVerify}>
                    {verifying ? "যাচাই হচ্ছে..." : "কার্ড যাচাই করুন"}
                  </Button>
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>পরীক্ষার জন্য: কার্ড নম্বর <strong>KSK-2025-123456</strong> ব্যবহার করুন</span>
                  </div>
                </CardContent>
              </Card>

              <AnimatePresence>
                {verifiedCard && <GovernmentCard card={verifiedCard} />}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}
