import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package, Search, Phone, MapPin, Clock, CheckCircle2,
  Truck, PackageCheck, XCircle, Leaf, ReceiptText, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

type OrderItem = { productId: number; name: string; nameBn: string; price: number; qty: number; unit: string };
type Order = {
  id: number;
  trackingCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};

const STATUS_STEPS = [
  { key: "pending",   label: "অর্ডার প্রাপ্ত",     icon: ReceiptText,   color: "text-yellow-500" },
  { key: "confirmed", label: "নিশ্চিত হয়েছে",      icon: CheckCircle2,  color: "text-blue-500" },
  { key: "shipped",   label: "পাঠানো হয়েছে",       icon: Truck,         color: "text-purple-500" },
  { key: "delivered", label: "পৌঁছে গেছে",         icon: PackageCheck,  color: "text-green-500" },
];

function statusIndex(status: string) {
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:   { label: "অপেক্ষমান",      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    confirmed: { label: "নিশ্চিত",        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    shipped:   { label: "পাঠানো হয়েছে",  className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    delivered: { label: "পৌঁছে গেছে",    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    cancelled: { label: "বাতিল",          className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  };
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.className}`}>{s.label}</span>;
}

function OrderCard({ order }: { order: Order }) {
  const idx = statusIndex(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">ট্র্যাকিং কোড</p>
              <p className="font-mono font-bold text-lg tracking-widest text-primary">{order.trackingCode}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <p className="text-xs text-muted-foreground mt-1.5">
                {new Date(order.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Progress stepper */}
            {!cancelled && (
              <div className="flex items-center gap-1">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done = i <= idx;
                  const active = i === idx;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? "bg-primary border-primary text-primary-foreground"
                               : "bg-background border-muted-foreground/30 text-muted-foreground"
                        } ${active ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <p className={`text-[10px] text-center leading-tight ${done ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${done && i < idx ? "bg-primary" : "bg-muted"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {cancelled && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg px-4 py-3">
                <XCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">এই অর্ডারটি বাতিল করা হয়েছে।</p>
              </div>
            )}

            <Separator />

            {/* Items */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">পণ্য তালিকা</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Leaf className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{item.nameBn}</p>
                      <p className="text-xs text-muted-foreground">{item.qty} {item.unit} × ৳{item.price}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">৳{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{order.buyerPhone}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{order.buyerAddress}</div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">মোট মূল্য</p>
                <p className="text-xl font-bold text-primary">৳{order.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchByCode(code: string): Promise<Order> {
  const res = await fetch(`${BASE}/api/orders/track/${code.trim().toUpperCase()}`);
  if (!res.ok) throw new Error("not_found");
  return res.json();
}

async function fetchByPhone(phone: string): Promise<Order[]> {
  const res = await fetch(`${BASE}/api/orders/phone/${phone.trim()}`);
  if (!res.ok) throw new Error("failed");
  return res.json();
}

export default function OrderTracking() {
  const [mode, setMode] = useState<"code" | "phone">("code");
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) { toast.error("ট্র্যাকিং কোড বা ফোন নম্বর দিন"); return; }
    setLoading(true);
    setSearched(false);
    try {
      if (mode === "code") {
        const o = await fetchByCode(input);
        setOrders([o]);
      } else {
        const os = await fetchByPhone(input);
        setOrders(os);
        if (!os.length) toast.info("এই নম্বরে কোনো অর্ডার পাওয়া যায়নি");
      }
    } catch {
      toast.error("অর্ডার খুঁজে পাওয়া যায়নি");
      setOrders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">অর্ডার ট্র্যাকিং</h1>
        <p className="text-muted-foreground text-sm">আপনার অর্ডারের বর্তমান অবস্থা জানুন</p>
      </div>

      {/* Search box */}
      <Card className="mb-8">
        <CardContent className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              size="sm" variant={mode === "code" ? "default" : "outline"}
              onClick={() => { setMode("code"); setInput(""); setOrders([]); setSearched(false); }}
              className="flex-1"
            >
              <Package className="w-3.5 h-3.5 mr-1.5" /> ট্র্যাকিং কোড
            </Button>
            <Button
              size="sm" variant={mode === "phone" ? "default" : "outline"}
              onClick={() => { setMode("phone"); setInput(""); setOrders([]); setSearched(false); }}
              className="flex-1"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" /> ফোন নম্বর
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>{mode === "code" ? "ট্র্যাকিং কোড (যেমন: AGR123456)" : "মোবাইল নম্বর (যেমন: 01712345678)"}</Label>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder={mode === "code" ? "AGR123456" : "01XXXXXXXXX"}
                className={mode === "code" ? "font-mono tracking-widest uppercase" : ""}
              />
              <Button onClick={handleSearch} disabled={loading} className="gap-1.5 shrink-0">
                <Search className="w-4 h-4" />
                {loading ? "খুঁজছি..." : "খুঁজুন"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {orders.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">{orders.length}টি অর্ডার পাওয়া গেছে</p>
            {orders.map(o => <OrderCard key={o.id} order={o} />)}
          </motion.div>
        )}
        {searched && orders.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-semibold mb-1">কোনো অর্ডার পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground">ট্র্যাকিং কোড বা ফোন নম্বর সঠিক কিনা যাচাই করুন</p>
            </Card>
          </motion.div>
        )}
        {!searched && orders.length === 0 && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ReceiptText, label: "অর্ডার প্রাপ্ত", desc: "বিক্রেতার কাছে অর্ডার পাঠানো হয়েছে" },
                { icon: CheckCircle2, label: "নিশ্চিত হয়েছে", desc: "বিক্রেতা অর্ডার গ্রহণ করেছেন" },
                { icon: Truck, label: "পাঠানো হয়েছে", desc: "পণ্য পথে আছে" },
                { icon: PackageCheck, label: "পৌঁছে গেছে", desc: "পণ্য সফলভাবে পৌঁছেছে" },
              ].map(({ icon: Icon, label, desc }) => (
                <Card key={label} className="p-4">
                  <Icon className="w-6 h-6 text-primary mb-2" />
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
