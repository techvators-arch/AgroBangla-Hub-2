import { useState } from "react";
import { useGetProducts, useCreateProduct, useDeleteProduct, useGetMarketplaceStats, getGetProductsQueryKey, getGetMarketplaceStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag, Plus, Phone, MapPin, Leaf, Trash2, Search, Package,
  ShoppingCart, Minus, X, CheckCircle,
  Zap, CreditCard, PackageCheck, Copy, TrendingUp, TrendingDown, Building2, Info, PackageSearch,
  ImagePlus, Smartphone, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CATEGORIES = ["ধান", "গম", "সবজি", "ফল", "মসলা", "ডাল", "তেলবীজ", "সার", "বীজ", "সরঞ্জাম"];
const UNITS = ["কেজি", "মণ", "টন", "পিস", "লিটার", "বস্তা"];
const DISTRICTS_BN = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Bangladesh Government Official Support Prices (DAM / কৃষি বিপণন অধিদপ্তর, ২০২৪-২৫) ──
// Source: Department of Agricultural Marketing (DAM), Ministry of Agriculture, Bangladesh
const GOV_PRICES: Record<string, { price: number; unit: string; source: string }> = {
  "ধান":      { price: 1100, unit: "মণ",  source: "ধান ক্রয় মূল্য ২০২৪ (খাদ্য অধিদপ্তর)" },
  "গম":       { price: 1250, unit: "মণ",  source: "গম ক্রয় মূল্য ২০২৪ (খাদ্য অধিদপ্তর)" },
  "আলু":      { price: 20,   unit: "কেজি", source: "টিসিবি নির্ধারিত মূল্য ২০২৪" },
  "টমেটো":    { price: 30,   unit: "কেজি", source: "DAM সংগৃহীত বাজার মূল্য (রাজশাহী)" },
  "সরিষা":    { price: 3000, unit: "মণ",  source: "সরিষা সহায়তা মূল্য ২০২৪" },
  "কাঁচা মরিচ":{ price: 60,  unit: "কেজি", source: "DAM প্রচলিত বাজার মূল্য" },
  "মসুর ডাল": { price: 105,  unit: "কেজি", source: "টিসিবি ন্যায্য মূল্যে বিক্রয় ২০২৪" },
  "বেগুন":    { price: 25,   unit: "কেজি", source: "DAM প্রচলিত বাজার মূল্য" },
  "রসুন":     { price: 140,  unit: "কেজি", source: "টিসিবি নির্ধারিত মূল্য ২০২৪" },
  "পেঁয়াজ":  { price: 40,   unit: "কেজি", source: "টিসিবি নির্ধারিত মূল্য ২০২৪" },
  "আম":       { price: 55,   unit: "কেজি", source: "DAM প্রচলিত বাজার মূল্য" },
  "পাট":      { price: 2500, unit: "মণ",  source: "পাট ক্রয় মূল্য ২০২৪ (পাট অধিদপ্তর)" },
};

// Match a product's Bengali name to a gov price key
function getGovPrice(nameBn: string, category: string) {
  for (const [key, val] of Object.entries(GOV_PRICES)) {
    if (nameBn.includes(key) || key.includes(nameBn)) return val;
  }
  // Fallback by category
  const catMap: Record<string, string> = { "ধান": "ধান", "গম": "গম", "তেলবীজ": "সরিষা", "ডাল": "মসুর ডাল" };
  if (catMap[category]) return GOV_PRICES[catMap[category]];
  return null;
}

type Product = {
  id: number; name: string; nameBn: string; category: string;
  price: number; unit: string; quantity: number; district: string;
  sellerName: string; sellerPhone: string; description?: string | null;
  imageUrl?: string | null; isOrganic: boolean; createdAt: string;
};

type CartItem = { product: Product; qty: number };
type BuyerForm = { name: string; phone: string; address: string };

function toBn(n: number) {
  return n.toFixed(0).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
}

async function submitOrder(items: Array<{ productId: number; name: string; nameBn: string; price: number; qty: number; unit: string }>, buyer: BuyerForm, total: number) {
  const res = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyerName: buyer.name, buyerPhone: buyer.phone, buyerAddress: buyer.address, items, total }),
  });
  if (!res.ok) throw new Error("failed");
  return res.json() as Promise<{ trackingCode: string }>;
}

export default function Marketplace() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [buyProduct, setBuyProduct] = useState<Product | null>(null);
  const [buyQty, setBuyQty] = useState(1);
  const [buyStep, setBuyStep] = useState<"details" | "done">("details");
  const [trackingCode, setTrackingCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [cartStep, setCartStep] = useState<"cart" | "buyer" | "payment" | "done">("cart");
  const [cartTrackingCode, setCartTrackingCode] = useState("");
  const [buyerForm, setBuyerForm] = useState<BuyerForm>({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<"" | "bkash" | "nagad" | "card">("");
  const [imagePreview, setImagePreview] = useState("");
  const [form, setForm] = useState({
    name: "", nameBn: "", category: "ধান", price: "", unit: "কেজি",
    quantity: "", district: "ঢাকা", sellerName: "", sellerPhone: "",
    description: "", imageUrl: "", isOrganic: false,
  });

  const queryClient = useQueryClient();
  const { data: products, isLoading } = useGetProducts(
    { category, search: search || undefined },
    { query: { queryKey: getGetProductsQueryKey({ category, search: search || undefined }) } }
  );
  const { data: stats } = useGetMarketplaceStats({ query: { queryKey: getGetMarketplaceStatsQueryKey() } });
  const { mutate: createProduct, isPending: creating } = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMarketplaceStatsQueryKey() });
        setAddOpen(false);
        setForm({ name: "", nameBn: "", category: "ধান", price: "", unit: "কেজি", quantity: "", district: "ঢাকা", sellerName: "", sellerPhone: "", description: "", imageUrl: "", isOrganic: false });
        toast.success("পণ্য তালিকাভুক্ত হয়েছে!");
      },
      onError: () => toast.error("পণ্য যোগ করতে ব্যর্থ হয়েছে।"),
    },
  });
  const { mutate: deleteProduct } = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMarketplaceStatsQueryKey() });
        toast.success("পণ্য মুছে ফেলা হয়েছে।");
      },
    },
  });

  // ── Cart helpers ──
  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, i) => s + i.product.price * i.qty, 0);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev[p.id];
      return { ...prev, [p.id]: { product: p, qty: (existing?.qty ?? 0) + 1 } };
    });
    toast.success(`${p.nameBn} কার্টে যোগ হয়েছে`);
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: { ...item, qty: newQty } };
    });
  };

  const clearCart = () => { setCart({}); setCartStep("cart"); setCartTrackingCode(""); };

  const handleSubmit = () => {
    if (!form.name || !form.nameBn || !form.price || !form.quantity || !form.sellerName || !form.sellerPhone) {
      toast.error("সকল আবশ্যিক ক্ষেত্র পূরণ করুন।");
      return;
    }
    createProduct({
      data: { ...form, price: Number(form.price), quantity: Number(form.quantity), description: form.description || null, imageUrl: form.imageUrl || null },
    });
  };

  const handleBuyNow = (p: Product) => {
    setBuyProduct(p);
    setBuyQty(1);
    setBuyStep("details");
    setBuyerForm({ name: "", phone: "", address: "" });
    setTrackingCode("");
  };

  const confirmBuyNow = async () => {
    if (!buyerForm.name || !buyerForm.phone || !buyerForm.address) { toast.error("সকল তথ্য পূরণ করুন।"); return; }
    if (!buyProduct) return;
    setSubmitting(true);
    try {
      const items = [{ productId: buyProduct.id, name: buyProduct.name, nameBn: buyProduct.nameBn, price: buyProduct.price, qty: buyQty, unit: buyProduct.unit }];
      const result = await submitOrder(items, buyerForm, buyProduct.price * buyQty);
      setTrackingCode(result.trackingCode);
      setBuyStep("done");
      toast.success("অর্ডার সম্পন্ন!");
    } catch { toast.error("অর্ডার করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"); }
    finally { setSubmitting(false); }
  };

  const confirmCartOrder = async () => {
    if (!buyerForm.name || !buyerForm.phone || !buyerForm.address) { toast.error("সকল তথ্য পূরণ করুন।"); return; }
    setSubmitting(true);
    try {
      const items = Object.values(cart).map(({ product: p, qty }) => ({ productId: p.id, name: p.name, nameBn: p.nameBn, price: p.price, qty, unit: p.unit }));
      const result = await submitOrder(items, buyerForm, cartTotal);
      setCartTrackingCode(result.trackingCode);
      setCartStep("done");
      setCart({});
      toast.success("অর্ডার সম্পন্ন!");
    } catch { toast.error("অর্ডার করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"); }
    finally { setSubmitting(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success("ট্র্যাকিং কোড কপি হয়েছে"));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("ছবির আকার সর্বোচ্চ ২MB হতে হবে"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      setForm(p => ({ ...p, imageUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">কৃষি বাজার</h1>
            <p className="text-muted-foreground text-sm">সরাসরি কৃষকের কাছ থেকে কিনুন, ন্যায্য মূল্যে বিক্রি করুন</p>
          </div>
          <div className="flex items-center gap-2">
            {/* আমার অর্ডার */}
            <Button variant="outline" className="gap-2" onClick={() => navigate("/orders")}>
              <PackageSearch className="w-4 h-4" />আমার অর্ডার
            </Button>

            {/* Cart */}
            <Sheet open={cartOpen} onOpenChange={v => { setCartOpen(v); if (!v) { setCartStep("cart"); setBuyerForm({ name: "", phone: "", address: "" }); } }}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative gap-2">
                  <ShoppingCart className="w-4 h-4" />কার্ট
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader><SheetTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> আমার কার্ট {cartCount > 0 && <Badge>{cartCount}টি পণ্য</Badge>}</SheetTitle></SheetHeader>
                {cartStep === "cart" && (
                  cartCount === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ShoppingBag className="w-16 h-16 opacity-20" /><p>কার্ট খালি আছে</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto space-y-3 py-4">
                        {Object.values(cart).map(({ product: p, qty }) => (
                          <div key={p.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.nameBn} className="w-full h-full object-cover" /> : <Leaf className="w-5 h-5 text-primary" />}
                          </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{p.nameBn}</p>
                              <p className="text-xs text-muted-foreground">৳{p.price}/{p.unit}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQty(p.id, -1)}><Minus className="w-3 h-3" /></Button>
                              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQty(p.id, 1)}><Plus className="w-3 h-3" /></Button>
                            </div>
                            <p className="text-sm font-bold text-primary shrink-0">৳{(p.price * qty).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground"><span>মোট পণ্য</span><span>{cartCount}টি</span></div>
                        <div className="flex justify-between font-bold text-lg"><span>মোট মূল্য</span><span className="text-primary">৳{cartTotal.toLocaleString()}</span></div>
                        <Button className="w-full gap-2 h-11 text-base font-semibold" onClick={() => { setCartStep("buyer"); setBuyerForm({ name: "", phone: "", address: "" }); }}>
                          <CreditCard className="w-4 h-4" /> অর্ডার করুন
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={clearCart}><X className="w-3.5 h-3.5 mr-1.5" /> কার্ট খালি করুন</Button>
                      </div>
                    </>
                  )
                )}
                {cartStep === "buyer" && (
                  <div className="flex-1 flex flex-col py-4 space-y-4 overflow-y-auto">
                    <p className="text-sm text-muted-foreground">ডেলিভারির তথ্য দিন</p>
                    <div className="space-y-3">
                      <div className="space-y-1.5"><Label>আপনার নাম</Label><Input value={buyerForm.name} onChange={e => setBuyerForm(p => ({ ...p, name: e.target.value }))} placeholder="নাম লিখুন" /></div>
                      <div className="space-y-1.5"><Label>মোবাইল নম্বর</Label><Input value={buyerForm.phone} onChange={e => setBuyerForm(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" inputMode="tel" /></div>
                      <div className="space-y-1.5"><Label>ডেলিভারির ঠিকানা</Label><Textarea value={buyerForm.address} onChange={e => setBuyerForm(p => ({ ...p, address: e.target.value }))} placeholder="পূর্ণ ঠিকানা লিখুন..." rows={3} /></div>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>মোট মূল্য</span><span className="text-primary">৳{cartTotal.toLocaleString()}</span></div>
                    <Button className="w-full h-11 font-semibold gap-2" onClick={() => { if (!buyerForm.name || !buyerForm.phone || !buyerForm.address) { toast.error("নাম, মোবাইল ও ঠিকানা পূরণ করুন"); return; } setCartStep("payment"); setPaymentMethod(""); }}>
                      <CreditCard className="w-4 h-4" /> পেমেন্ট পদ্ধতি বেছে নিন
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setCartStep("cart")}>ফিরে যান</Button>
                  </div>
                )}
                {cartStep === "payment" && (
                  <div className="flex-1 flex flex-col py-4 space-y-4 overflow-y-auto">
                    <div>
                      <p className="font-semibold mb-1">পেমেন্ট পদ্ধতি বেছে নিন</p>
                      <p className="text-xs text-muted-foreground">মোট পরিশোধযোগ্য: <span className="font-bold text-primary text-sm">৳{cartTotal.toLocaleString()}</span></p>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { id: "bkash", label: "bKash", color: "bg-pink-600", textColor: "text-white", desc: "বিকাশ মোবাইল ব্যাংকিং", icon: Smartphone },
                        { id: "nagad", label: "Nagad", color: "bg-orange-500", textColor: "text-white", desc: "নগদ মোবাইল ব্যাংকিং", icon: Wallet },
                        { id: "card", label: "কার্ড পেমেন্ট", color: "bg-primary", textColor: "text-white", desc: "ডেবিট/ক্রেডিট কার্ড", icon: CreditCard },
                      ].map(pm => (
                        <button key={pm.id} onClick={() => setPaymentMethod(pm.id as "bkash" | "nagad" | "card")}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}>
                          <div className={`w-10 h-10 rounded-xl ${pm.color} flex items-center justify-center shrink-0`}>
                            <pm.icon className={`w-5 h-5 ${pm.textColor}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{pm.label}</p>
                            <p className="text-xs text-muted-foreground">{pm.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${paymentMethod === pm.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                    {paymentMethod === "bkash" && (
                      <div className="bg-pink-50 dark:bg-pink-950/20 rounded-xl p-3 text-sm border border-pink-200 dark:border-pink-800">
                        <p className="font-semibold text-pink-700 dark:text-pink-400 mb-1">বিকাশ নম্বর</p>
                        <p className="font-mono text-lg text-pink-700 dark:text-pink-300">01712-345678</p>
                        <p className="text-xs text-pink-600 dark:text-pink-500 mt-1">Send Money করুন, তারপর নিশ্চিত করুন</p>
                      </div>
                    )}
                    {paymentMethod === "nagad" && (
                      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 text-sm border border-orange-200 dark:border-orange-800">
                        <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">নগদ নম্বর</p>
                        <p className="font-mono text-lg text-orange-700 dark:text-orange-300">01812-345678</p>
                        <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Send Money করুন, তারপর নিশ্চিত করুন</p>
                      </div>
                    )}
                    {paymentMethod === "card" && (
                      <div className="space-y-2 text-sm">
                        <Input placeholder="কার্ড নম্বর (1234 5678 9012 3456)" inputMode="numeric" className="font-mono" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="MM/YY" />
                          <Input placeholder="CVV" inputMode="numeric" maxLength={3} />
                        </div>
                      </div>
                    )}
                    <div className="mt-auto space-y-2 pt-2">
                      <Button className="w-full h-11 font-semibold gap-2" onClick={confirmCartOrder} disabled={!paymentMethod || submitting}>
                        <PackageCheck className="w-4 h-4" />{submitting ? "অর্ডার হচ্ছে..." : `৳${cartTotal.toLocaleString()} পরিশোধ করুন`}
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setCartStep("buyer")}>ফিরে যান</Button>
                    </div>
                  </div>
                )}
                {cartStep === "done" && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4 }}><CheckCircle className="w-16 h-16 text-green-500" /></motion.div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">অর্ডার সম্পন্ন!</h3>
                      <p className="text-sm text-muted-foreground mb-4">আপনার ট্র্যাকিং কোড সংরক্ষণ করুন</p>
                      <div className="bg-muted/50 rounded-xl px-6 py-4 flex items-center gap-3 justify-center">
                        <span className="font-mono font-bold text-2xl tracking-widest text-primary">{cartTrackingCode}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copyCode(cartTrackingCode)}><Copy className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => { setCartOpen(false); navigate("/orders"); }}><PackageCheck className="w-4 h-4 mr-2" /> অর্ডার ট্র্যাক করুন</Button>
                    <Button variant="ghost" className="w-full" onClick={() => { setCartOpen(false); clearCart(); }}>বাজারে ফিরুন</Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Add product */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button className="flex items-center gap-2"><Plus className="w-4 h-4" />পণ্য যোগ করুন</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>নতুন পণ্য তালিকাভুক্ত করুন</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>পণ্যের নাম (বাংলা)</Label><Input value={form.nameBn} onChange={e => setForm(p => ({ ...p, nameBn: e.target.value }))} placeholder="যেমন: বোরো ধান" /></div>
                    <div className="space-y-1"><Label>Product Name (English)</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Boro Rice" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>বিভাগ</Label>
                      <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1"><Label>জেলা</Label>
                      <Select value={form.district} onValueChange={v => setForm(p => ({ ...p, district: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DISTRICTS_BN.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label>মূল্য (৳)</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0" /></div>
                    <div className="space-y-1"><Label>একক</Label>
                      <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1"><Label>পরিমাণ</Label><Input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>বিক্রেতার নাম</Label><Input value={form.sellerName} onChange={e => setForm(p => ({ ...p, sellerName: e.target.value }))} placeholder="নাম" /></div>
                    <div className="space-y-1"><Label>মোবাইল</Label><Input value={form.sellerPhone} onChange={e => setForm(p => ({ ...p, sellerPhone: e.target.value }))} placeholder="01XXXXXXXXX" /></div>
                  </div>
                  <div className="space-y-1"><Label>বিবরণ (ঐচ্ছিক)</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="পণ্য সম্পর্কে বিস্তারিত..." /></div>

                  {/* Image upload */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><ImagePlus className="w-3.5 h-3.5" />পণ্যের ছবি (ঐচ্ছিক)</Label>
                    {imagePreview && (
                      <div className="relative">
                        <img src={imagePreview} alt="preview" className="w-full h-36 object-cover rounded-lg border" />
                        <button onClick={() => { setImagePreview(""); setForm(p => ({ ...p, imageUrl: "" })); }}
                          className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80">✕</button>
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-border/60 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                      <ImagePlus className="w-4 h-4 shrink-0" />
                      <span>{imagePreview ? "অন্য ছবি বেছে নিন" : "ছবি আপলোড করুন (সর্বোচ্চ ২MB)"}</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch id="organic" checked={form.isOrganic} onCheckedChange={v => setForm(p => ({ ...p, isOrganic: v }))} />
                    <Label htmlFor="organic">জৈব পণ্য (Organic)</Label>
                  </div>
                  <Button className="w-full" disabled={creating} onClick={handleSubmit}>{creating ? "যোগ হচ্ছে..." : "পণ্য তালিকাভুক্ত করুন"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "মোট পণ্য", value: stats.totalProducts },
              { label: "বিক্রেতা", value: stats.totalSellers },
              { label: "জেলা", value: stats.totalDistricts },
              { label: "গড় মূল্য (৳)", value: stats.avgPrice.toFixed(0) },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Government price notice */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">সরকারি নির্ধারিত মূল্য</span> — কৃষি বিপণন অধিদপ্তর (DAM) ও টিসিবি নির্ধারিত ২০২৪-২৫ অর্থবছরের সহায়তামূল্য প্রতিটি পণ্যে দেখানো হচ্ছে।
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="পণ্য খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={category || "all"} onValueChange={v => setCategory(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="সকল বিভাগ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল বিভাগ</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : !products?.length ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো পণ্য পাওয়া যায়নি</p>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(products as Product[]).map((product, i) => {
                const govData = getGovPrice(product.nameBn, product.category);
                const sameUnit = govData && govData.unit === product.unit;
                const priceDiff = govData && sameUnit ? product.price - govData.price : null;
                const isAboveGov = priceDiff !== null && priceDiff > 0;
                const isBelowGov = priceDiff !== null && priceDiff < 0;
                const inCart = cart[product.id]?.qty ?? 0;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all group flex flex-col overflow-hidden">
                      {/* Product image */}
                      {product.imageUrl && (
                        <div className="w-full h-40 bg-muted/30 overflow-hidden">
                          <img src={product.imageUrl} alt={product.nameBn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <CardContent className="p-4 flex flex-col h-full">

                        {/* Top badges + delete */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                              {product.isOrganic && (
                                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  <Leaf className="w-2.5 h-2.5 mr-1" />জৈব
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold leading-tight">{product.nameBn}</h3>
                            <p className="text-xs text-muted-foreground">{product.name}</p>
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-destructive hover:text-destructive shrink-0"
                            onClick={() => deleteProduct({ id: product.id })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {product.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                        )}

                        <div className="mt-auto space-y-3">
                          {/* Seller price */}
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-bold text-primary">৳{toBn(product.price)}</p>
                              <p className="text-xs text-muted-foreground">প্রতি {product.unit}</p>
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{toBn(product.quantity)} {product.unit}</p>
                          </div>

                          {/* Government fixed price row */}
                          {govData && (
                            <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                              isAboveGov
                                ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                                : isBelowGov
                                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                : "bg-muted/50 border border-border/50"
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground font-medium">সরকারি মূল্য</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-52 text-xs">
                                    {govData.source}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">
                                  ৳{toBn(govData.price)}/{govData.unit}
                                </span>
                                {sameUnit && priceDiff !== null && priceDiff !== 0 && (
                                  <span className={`flex items-center gap-0.5 font-semibold ${isAboveGov ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                    {isAboveGov
                                      ? <><TrendingUp className="w-3 h-3" />+{toBn(Math.abs(priceDiff))}</>
                                      : <><TrendingDown className="w-3 h-3" />-{toBn(Math.abs(priceDiff))}</>
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Seller */}
                          <div className="border-t pt-2 space-y-1">
                            <p className="text-sm font-medium">{product.sellerName}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{product.district}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{product.sellerPhone}</span>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => addToCart(product)}>
                              {inCart > 0
                                ? <><ShoppingCart className="w-3.5 h-3.5" />কার্টে ({inCart})</>
                                : <><ShoppingCart className="w-3.5 h-3.5" />কার্টে যোগ</>
                              }
                            </Button>
                            <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleBuyNow(product)}>
                              <Zap className="w-3.5 h-3.5" />এখনই কিনুন
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Buy Now Dialog */}
        <Dialog open={!!buyProduct} onOpenChange={v => { if (!v) setBuyProduct(null); }}>
          <DialogContent className="sm:max-w-sm">
            {buyProduct && buyStep === "details" && (
              <>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> এখনই কিনুন</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{buyProduct.nameBn}</span>
                      <Badge variant="secondary">{buyProduct.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{buyProduct.sellerName} · {buyProduct.district}</p>
                    {(() => {
                      const gov = getGovPrice(buyProduct.nameBn, buyProduct.category);
                      if (!gov) return null;
                      return (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Building2 className="w-3 h-3" />
                          <span>সরকারি মূল্য: ৳{gov.price}/{gov.unit}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-1.5">
                    <Label>পরিমাণ ({buyProduct.unit})</Label>
                    <div className="flex items-center gap-3">
                      <Button size="icon" variant="outline" onClick={() => setBuyQty(q => Math.max(1, q - 1))}><Minus className="w-4 h-4" /></Button>
                      <span className="w-10 text-center font-bold text-lg">{buyQty}</span>
                      <Button size="icon" variant="outline" onClick={() => setBuyQty(q => Math.min(buyProduct.quantity, q + 1))}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">ডেলিভারির তথ্য</p>
                    <div className="space-y-1.5"><Label>আপনার নাম</Label><Input value={buyerForm.name} onChange={e => setBuyerForm(p => ({ ...p, name: e.target.value }))} placeholder="নাম লিখুন" /></div>
                    <div className="space-y-1.5"><Label>মোবাইল নম্বর</Label><Input value={buyerForm.phone} onChange={e => setBuyerForm(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" inputMode="tel" /></div>
                    <div className="space-y-1.5"><Label>ডেলিভারির ঠিকানা</Label><Textarea value={buyerForm.address} onChange={e => setBuyerForm(p => ({ ...p, address: e.target.value }))} placeholder="পূর্ণ ঠিকানা..." rows={2} /></div>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                    <span>মোট মূল্য</span>
                    <span className="text-primary">৳{(buyProduct.price * buyQty).toLocaleString()}</span>
                  </div>
                  <Button className="w-full h-11 text-base font-semibold gap-2" onClick={confirmBuyNow} disabled={submitting}>
                    <CreditCard className="w-4 h-4" />{submitting ? "অর্ডার হচ্ছে..." : "অর্ডার নিশ্চিত করুন"}
                  </Button>
                </div>
              </>
            )}
            {buyStep === "done" && (
              <div className="py-6 text-center space-y-5">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4 }}>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold mb-1">অর্ডার সম্পন্ন!</h3>
                  <p className="text-sm text-muted-foreground mb-4">আপনার ট্র্যাকিং কোড:</p>
                  <div className="bg-muted/50 rounded-xl px-6 py-4 flex items-center gap-3 justify-center">
                    <span className="font-mono font-bold text-2xl tracking-widest text-primary">{trackingCode}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copyCode(trackingCode)}><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={() => { setBuyProduct(null); navigate("/orders"); }}><PackageCheck className="w-4 h-4" /> অর্ডার ট্র্যাক করুন</Button>
                <Button variant="ghost" className="w-full" onClick={() => setBuyProduct(null)}>বাজারে ফিরুন</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </motion.div>
    </TooltipProvider>
  );
}
