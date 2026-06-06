import { useGetPlatformStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Leaf, Map, Activity, MessageSquare, TestTube,
  Users, Sprout, ShoppingBag, CreditCard, ArrowRight,
  TrendingUp, Shield, Clock, Star, ChevronRight,
} from "lucide-react";
import heroImage from "@assets/pngtree-concept-use-of-the-smart-farmer-system-came-to-help-an_1780547943886.jpg";

const modules = [
  { href: "/agro-map", title: "কৃষি মানচিত্র", desc: "জেলাভিত্তিক কৃষি জোন ও মাটির তথ্য দেখুন", icon: Map, gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10" },
  { href: "/disease-detector", title: "রোগ নির্ণয়", desc: "এআই দিয়ে ফসলের রোগ মুহূর্তেই সনাক্ত করুন", icon: Activity, gradient: "from-red-500 to-rose-500", bg: "bg-red-500/10" },
  { href: "/qa", title: "কৃষক প্রশ্নমঞ্চ", desc: "বিশেষজ্ঞদের কাছে যেকোনো প্রশ্ন করুন", icon: MessageSquare, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
  { href: "/fertilizer-guide", title: "সার নির্দেশিকা", desc: "ফসল অনুযায়ী সঠিক সারের পরিমাণ জানুন", icon: TestTube, gradient: "from-purple-500 to-violet-500", bg: "bg-purple-500/10" },
  { href: "/consultancy", title: "পরামর্শদাতা", desc: "অভিজ্ঞ কৃষি বিশেষজ্ঞদের সাথে কথা বলুন", icon: Users, gradient: "from-indigo-500 to-blue-500", bg: "bg-indigo-500/10" },
  { href: "/crop-recommendation", title: "ফসল সুপারিশ", desc: "মাটি ও মৌসুম বিশ্লেষণ করে সেরা ফসল বাছুন", icon: Sprout, gradient: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10" },
  { href: "/marketplace", title: "কৃষি বাজার", desc: "সরাসরি কৃষকের কাছ থেকে পণ্য কিনুন বা বিক্রি করুন", icon: ShoppingBag, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-500/10" },
  { href: "/krishok-card", title: "কৃষক কার্ড", desc: "কৃষক পরিচয় কার্ড নিবন্ধন ও যাচাই করুন", icon: CreditCard, gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-500/10" },
];

const features = [
  { icon: TrendingUp, title: "উৎপাদন বৃদ্ধি", desc: "আধুনিক প্রযুক্তি ব্যবহার করে ফসলের উৎপাদন গড়ে ৩০% বাড়ান", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: Shield, title: "রোগ সুরক্ষা", desc: "সময়মতো রোগ সনাক্ত করে ফসল ক্ষতি থেকে রক্ষা করুন", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: Clock, title: "দ্রুত সেবা", desc: "যেকোনো সমস্যায় মুহূর্তেই বিশেষজ্ঞ পরামর্শ পান", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: Star, title: "বিশেষজ্ঞ নেটওয়ার্ক", desc: "সারাদেশের অভিজ্ঞ কৃষিবিদদের সাথে সরাসরি যুক্ত হন", color: "text-purple-500", bg: "bg-purple-500/10" },
];

const statItems = [
  { key: "totalFarmers" as const, label: "নিবন্ধিত কৃষক", suffix: "+", icon: Users, color: "from-emerald-400 to-green-500" },
  { key: "totalProducts" as const, label: "কৃষি পণ্য", suffix: "", icon: ShoppingBag, color: "from-blue-400 to-cyan-500" },
  { key: "totalConsultants" as const, label: "বিশেষজ্ঞ", suffix: "+", icon: Star, color: "from-amber-400 to-orange-500" },
  { key: "totalDistricts" as const, label: "জেলা কভারেজ", suffix: "টি", icon: Map, color: "from-purple-400 to-violet-500" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Home() {
  const { data: stats, isLoading } = useGetPlatformStats();

  const getStatValue = (key: typeof statItems[0]["key"], suffix: string) => {
    if (isLoading) return "—";
    if (key === "totalFarmers") return "২,৪২০" + suffix;
    if (key === "totalDistricts") return "৬৪" + suffix;
    return ((stats?.[key] ?? 0).toLocaleString("bn-BD")) + suffix;
  };

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative min-h-[96vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Bangladesh smart agriculture"
            className="w-full h-full object-cover object-center scale-105"
          />
          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
          {/* Subtle green tint on lower half */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/15 to-transparent" />
        </div>

        {/* Decorative floating circles */}
        <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="container relative z-10 mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-2xl">

            <motion.div
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-primary/90 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm ring-1 ring-white/20 shadow-lg shadow-primary/30"
              >
                <Leaf className="w-3.5 h-3.5" />
                বাংলাদেশের #১ ডিজিটাল কৃষি প্ল্যাটফর্ম
              </motion.span>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
                স্মার্ট কৃষি,
                <br />
                <span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  সমৃদ্ধ বাংলাদেশ
                </span>
              </h1>

              {/* Subhead */}
              <p className="text-lg md:text-xl text-white/75 leading-relaxed mb-10 max-w-lg">
                আধুনিক প্রযুক্তি, বিশেষজ্ঞ পরামর্শ এবং সঠিক তথ্যের সমন্বয়ে দেশের ১৬ মিলিয়ন কৃষক পরিবারের ক্ষমতায়ন।
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold rounded-xl shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:-translate-y-0.5 transition-all duration-200"
                  asChild
                >
                  <Link href="/disease-detector">
                    রোগ নির্ণয় করুন
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-semibold rounded-xl border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/50 backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-200"
                  asChild
                >
                  <Link href="/krishok-card">কৃষক নিবন্ধন</Link>
                </Button>
              </div>
            </motion.div>

            {/* Stats — glassmorphism cards */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {statItems.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.key}
                    className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-4 text-center group hover:bg-white/15 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {getStatValue(s.key, s.suffix)}
                    </p>
                    <p className="text-[11px] text-white/55 mt-1 font-medium uppercase tracking-wide">{s.label}</p>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Bottom fade to background */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Features strip ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="group flex gap-4 items-start p-5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/70 hover:border-border/70 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Modules grid ── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-[0.15em] bg-primary/8 px-3 py-1.5 rounded-full mb-4">
              <Leaf className="w-3 h-3" />
              আমাদের সেবাসমূহ
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4 tracking-tight">
              ডিজিটাল কৃষির সম্পূর্ণ সমাধান
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              বীজ বপন থেকে বাজারজাতকরণ — কৃষির প্রতিটি ধাপে এগ্রোবাংলা আপনার পাশে
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {modules.map((mod) => (
              <motion.div key={mod.href} variants={itemVariants}>
                <Link href={mod.href} className="group block h-full">
                  <Card className="h-full border border-border/50 hover:border-primary/25 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden bg-background/80 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-0">
                      <div className={`h-1 w-full bg-gradient-to-r ${mod.gradient}`} />
                      <div className="p-6">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                          <mod.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors duration-200">{mod.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mod.desc}</p>
                        <div className="flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200">
                          এখনই দেখুন <ChevronRight className="ml-1 w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 overflow-hidden">
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-teal-700" />
        {/* Texture / noise overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/8 blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/8 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-white/[0.02]" />

        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-[0.15em] bg-white/10 px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <Leaf className="w-3 h-3" />
              আজই শুরু করুন
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 tracking-tight leading-tight">
              আজই শুরু করুন<br />
              <span className="text-white/80">স্মার্ট কৃষি</span>
            </h2>
            <p className="text-white/65 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
              বিনামূল্যে নিবন্ধন করুন এবং বাংলাদেশের লক্ষাধিক কৃষকের সাথে যুক্ত হন।
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-10 text-base font-semibold bg-white text-primary hover:bg-white/92 rounded-xl shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
                asChild
              >
                <Link href="/krishok-card">কৃষক কার্ডের জন্য আবেদন করুন</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-10 text-base font-semibold border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/50 backdrop-blur-sm rounded-xl hover:-translate-y-0.5 transition-all duration-200"
                asChild
              >
                <Link href="/consultancy">বিশেষজ্ঞের সাথে কথা বলুন</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
