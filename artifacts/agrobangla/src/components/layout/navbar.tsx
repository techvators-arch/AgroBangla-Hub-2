import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Moon, Sun, Menu, Leaf, Map, Activity, MessageSquare, TestTube,
  Users, Sprout, ShoppingBag, CreditCard, Bell, PackageSearch,
  LogIn, LogOut, Settings, ChevronDown, CheckCheck, Loader2,
  AlertCircle, Bot, Home, BarChart3, X,
  CloudRain, Gauge, Heart, Radio,
  Plane, TrendingUp, Droplets, Sliders,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

// ── রিয়েল টাইম তথ্য (IoT) dropdown ────────────────────────────────
const realtimeLinks = [
  { href: "/weather", label: "আবহাওয়া", icon: CloudRain },
  { href: "/sensor-dashboard", label: "সেন্সর ড্যাশবোর্ড", icon: Gauge },
  { href: "/animal-health", label: "পশু স্বাস্থ্য", icon: Heart },
  { href: "/live-chat", label: "AI লাইভ চ্যাট", icon: Radio },
  { href: "/precision-ag", label: "নির্ভুল কৃষি", icon: Sprout },
  { href: "/drone-monitoring", label: "ড্রোন পর্যবেক্ষণ", icon: Plane },
  { href: "/market-intelligence", label: "বাজার গোয়েন্দা", icon: TrendingUp },
  { href: "/smart-irrigation", label: "স্মার্ট সেচ", icon: Droplets },
  { href: "/iot-admin", label: "ম্যানুয়াল কন্ট্রোল", icon: Sliders },
];

// ── Ordered flat nav ─────────────────────────────────────────────────
const flatNav = [
  { href: "/", label: "হোম", icon: Home },
  { href: "/agro-map", label: "মানচিত্র", icon: Map },
  { href: "/disease-detector", label: "রোগ নির্ণয়", icon: Activity },
  { href: "/consultancy", label: "বিশেষজ্ঞ পরামর্শ", icon: Users },
  { href: "/marketplace", label: "বাজার", icon: ShoppingBag },
  { href: "/crop-recommendation", label: "ফসল সুপারিশ", icon: Sprout },
  { href: "/fertilizer-guide", label: "সার নির্দেশিকা", icon: TestTube },
  { href: "/ai-assistant", label: "AI সহকারী", icon: Bot, badge: "NEW" },
  { href: "/qa", label: "কৃষক কমিউনিটি", icon: MessageSquare },
  { href: "/krishok-card", label: "কৃষক কার্ড", icon: CreditCard },
  { href: "/dashboard", label: "ডিজিটাল ড্যাশবোর্ড", icon: BarChart3 },
];

const NOTIFICATIONS = [
  { id: 1, icon: Activity, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", title: "রোগ সতর্কতা", body: "ধান ব্লাস্ট রোগের প্রাদুর্ভাব ময়মনসিংহে বাড়ছে", time: "৫ মিনিট আগে", read: false },
  { id: 2, icon: Sprout, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", title: "ফসল পরামর্শ", body: "এখন বোরো ধান রোপণের উপযুক্ত সময়", time: "২ ঘণ্টা আগে", read: false },
  { id: 3, icon: MessageSquare, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", title: "নতুন উত্তর", body: "আপনার প্রশ্নে বিশেষজ্ঞ উত্তর দিয়েছেন", time: "গতকাল", read: false },
  { id: 4, icon: BarChart3, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", title: "বাজারদর আপডেট", body: "ধানের বাজার মূল্য বৃদ্ধি পেয়েছে ৳৫/কেজি", time: "২ দিন আগে", read: true },
];

type KrishokUser = {
  name: string; cardNumber: string; nidNumber: string;
  district: string; upazila?: string | null; status: string;
};

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<KrishokUser | null>(null);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [realtimeOpen, setRealtimeOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setRealtimeOpen(false); setMobileOpen(false); }, [location]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isActive = (href: string) => location === href;
  const isRealtimeActive = realtimeLinks.some(l => isActive(l.href));

  const handleCardInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 16 || !nidNumber.trim()) { setError("১৬ সংখ্যার কার্ড নম্বর এবং NID নম্বর প্রয়োজন"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/krishok-card/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: rawCard, nidNumber: nidNumber.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "Card not found" ? "কার্ড নম্বরটি পাওয়া যায়নি"
          : data.error === "NID does not match" ? "NID নম্বর সঠিক নয়"
          : "যাচাইকরণ ব্যর্থ হয়েছে।");
        return;
      }
      const data = await res.json();
      setUser({ name: data.farmerNameBn || data.farmerName, cardNumber: data.cardNumber, nidNumber: data.nidNumber, district: data.district, upazila: data.upazila, status: data.status });
      setLoginOpen(false); setCardNumber(""); setNidNumber("");
    } catch { setError("সংযোগ সমস্যা। আবার চেষ্টা করুন।"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/96 backdrop-blur-xl border-b border-border/60 shadow-sm" : "bg-background/90 backdrop-blur-md border-b border-transparent"
      }`}>
        <div className="container mx-auto px-3 lg:px-4 h-14 flex items-center gap-2">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group mr-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Leaf className="h-[17px] w-[17px] text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight hidden sm:block">এগ্রোবাংলা</span>
          </Link>

          {/* ── Desktop nav — scrollable ── */}
          <nav className="hidden lg:flex items-center flex-1 overflow-x-auto scrollbar-none gap-px">

            {/* রিয়েল টাইম তথ্য dropdown */}
            <DropdownMenu open={realtimeOpen} onOpenChange={setRealtimeOpen}>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all outline-none shrink-0 ${
                  isRealtimeActive ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}>
                  <CloudRain className="w-3.5 h-3.5 shrink-0" />
                  রিয়েল টাইম তথ্য
                  <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${realtimeOpen ? "rotate-180" : ""}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="w-52 rounded-xl shadow-xl border-border/60 p-1">
                {realtimeLinks.map(link => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  const isAdmin = link.href === "/iot-admin";
                  return (
                    <DropdownMenuItem key={link.href} asChild className="rounded-lg p-0 focus:bg-transparent">
                      <Link href={link.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isAdmin ? "border-t mt-1 pt-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                          : active ? "bg-primary/8 text-primary" : "hover:bg-muted/60"
                        }`}>
                        <Icon className={`w-4 h-4 ${isAdmin ? "text-orange-500" : active ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">{link.label}</span>
                        {active && !isAdmin && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Flat nav links */}
            {flatNav.map(link => {
              const active = isActive(link.href);
              const isAI = link.href === "/ai-assistant";
              return (
                <Link key={link.href} href={link.href}
                  className={`relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    isAI
                      ? active ? "text-primary bg-primary/8" : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                      : active ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}>
                  {link.label}
                  {link.badge && (
                    <span className="text-[8px] px-1 py-0.5 rounded-full bg-emerald-500 text-white font-bold leading-none">{link.badge}</span>
                  )}
                  {active && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-xl">
                  <Bell className="h-[17px] w-[17px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="w-80 rounded-2xl shadow-2xl border-border/60 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div>
                    <p className="font-semibold text-sm">বিজ্ঞপ্তি</p>
                    {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount}টি অপঠিত</p>}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-xs text-primary hover:underline flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> সব পড়া হয়েছে
                    </button>
                  )}
                </div>
                <div className="divide-y">
                  {notifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id}
                        onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                        className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${!n.read ? "bg-primary/[0.03]" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">{n.title}</p>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t text-center">
                  <button className="text-xs text-primary hover:underline font-medium">সব বিজ্ঞপ্তি দেখুন</button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-[17px] w-[17px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[17px] w-[17px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Login / Profile */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 h-8 rounded-xl hover:bg-muted/60">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {user.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-xs font-medium max-w-20 truncate">{user.name}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-56 rounded-2xl shadow-2xl border-border/60 p-1">
                  <div className="px-3 py-2.5">
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.cardNumber}</p>
                    <p className="text-xs text-muted-foreground">{user.district}{user.upazila ? `, ${user.upazila}` : ""}</p>
                    <Badge variant="secondary" className={`mt-1.5 text-[10px] px-2 py-0.5 h-auto ${
                      user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700"
                    }`}>
                      {user.status === "active" ? "✓ সক্রিয়" : "⏳ অপেক্ষমান"}
                    </Badge>
                  </div>
                  <Separator className="my-1" />
                  <DropdownMenuItem asChild className="rounded-lg gap-2 cursor-pointer">
                    <Link href="/krishok-card"><CreditCard className="w-4 h-4" /> কৃষক কার্ড</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" /> সেটিংস
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  <DropdownMenuItem onClick={() => { setUser(null); setCardNumber(""); setNidNumber(""); }}
                    className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                    <LogOut className="w-4 h-4" /> লগ আউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="gap-1.5 font-semibold rounded-xl h-8 px-3 shadow-sm text-xs"
                onClick={() => { setError(""); setLoginOpen(true); }}>
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">লগইন</span>
              </Button>
            )}

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 rounded-xl">
                  <Menu className="h-4.5 w-4.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <SheetTitle className="sr-only">নেভিগেশন মেনু</SheetTitle>

                <div className="flex items-center justify-between px-4 py-4 border-b">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Leaf className="h-[17px] w-[17px] text-white" />
                    </div>
                    <span className="font-extrabold text-lg text-primary">এগ্রোবাংলা</span>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setMobileOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">

                  {/* রিয়েল টাইম তথ্য section */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 pt-2 pb-1">রিয়েল টাইম তথ্য</p>
                  {realtimeLinks.map(link => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    const isAdmin = link.href === "/iot-admin";
                    return (
                      <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                          isAdmin ? "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                          : active ? "text-primary bg-primary/8" : "text-foreground hover:bg-muted/60"
                        }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAdmin ? "bg-orange-100 dark:bg-orange-900/30"
                          : active ? "bg-primary/15" : "bg-muted"
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${isAdmin ? "text-orange-500" : active ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        {link.label}
                        {active && !isAdmin && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}

                  <Separator className="my-2" />

                  {/* Flat nav */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 pb-1">সকল পাতা</p>
                  {flatNav.map(link => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    const isAI = link.href === "/ai-assistant";
                    return (
                      <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                          isAI ? (active ? "text-primary bg-primary/8" : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30")
                          : active ? "text-primary bg-primary/8" : "text-foreground hover:bg-muted/60"
                        }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAI ? "bg-emerald-100 dark:bg-emerald-900/40"
                          : active ? "bg-primary/15" : "bg-muted"
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${isAI ? "text-emerald-600 dark:text-emerald-400" : active ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        {link.label}
                        {link.badge && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold">{link.badge}</span>}
                        {active && !link.badge && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>

                {!user && (
                  <div className="p-3 border-t">
                    <Button className="w-full gap-2 rounded-xl font-semibold" onClick={() => { setMobileOpen(false); setLoginOpen(true); }}>
                      <LogIn className="w-4 h-4" /> কৃষক কার্ড দিয়ে লগইন
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ── Login Dialog ── */}
      <Dialog open={loginOpen} onOpenChange={v => { setLoginOpen(v); if (!v) setError(""); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              কৃষক কার্ড দিয়ে লগইন
            </DialogTitle>
            <DialogDescription>নিবন্ধিত কৃষক কার্ড নম্বর ও NID দিয়ে প্রবেশ করুন।</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="card">কৃষক কার্ড নম্বর</Label>
              <Input id="card" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => handleCardInput(e.target.value)}
                disabled={loading} autoComplete="off" inputMode="numeric" maxLength={19}
                className="font-mono tracking-widest text-lg rounded-xl h-12" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nid">জাতীয় পরিচয়পত্র (NID) নম্বর</Label>
              <Input id="nid" placeholder="১৩ বা ১৭ সংখ্যার NID নম্বর" value={nidNumber}
                onChange={e => { setNidNumber(e.target.value); setError(""); }}
                disabled={loading} autoComplete="off" className="font-mono rounded-xl h-12" />
            </div>
            {error && (
              <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <div className="bg-muted/50 rounded-xl px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">পরীক্ষামূলক তথ্য:</p>
              <p>কার্ড: <span className="font-mono text-foreground bg-background px-1.5 py-0.5 rounded">1234 5678 9012 3456</span></p>
              <p>NID: <span className="font-mono text-foreground bg-background px-1.5 py-0.5 rounded">1990123456789</span></p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setLoginOpen(false)} disabled={loading}>বাতিল</Button>
              <Button type="submit" className="flex-1 gap-2 rounded-xl h-11 font-semibold" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />যাচাই হচ্ছে...</> : <><LogIn className="w-4 h-4" />লগইন</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
