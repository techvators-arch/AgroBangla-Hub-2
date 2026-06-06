import { useState } from "react";
import { useGetConsultants, useBookConsultancy, useGetMyBookings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Users, Calendar, Phone, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function Consultancy() {
  const { data: consultants, isLoading } = useGetConsultants();
  const { data: bookings } = useGetMyBookings();
  const queryClient = useQueryClient();

  const [selectedConsultant, setSelectedConsultant] = useState<{ id: number; name: string; nameBn: string } | null>(null);
  const [form, setForm] = useState({ farmerName: "", phone: "", topic: "", preferredDate: "", notes: "" });

  const { mutate: book, isPending } = useBookConsultancy({
    mutation: {
      onSuccess: () => {
        setSelectedConsultant(null);
        setForm({ farmerName: "", phone: "", topic: "", preferredDate: "", notes: "" });
        toast.success("পরামর্শ বুকিং সম্পন্ন হয়েছে!");
      },
      onError: () => toast.error("বুকিং ব্যর্থ হয়েছে।"),
    },
  });

  const statusConfig: Record<string, string> = {
    pending: "অপেক্ষারত",
    confirmed: "নিশ্চিত",
    completed: "সম্পন্ন",
    cancelled: "বাতিল",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">কৃষি পরামর্শদাতা</h1>
        <p className="text-muted-foreground">অভিজ্ঞ কৃষি বিশেষজ্ঞদের সাথে সরাসরি পরামর্শ করুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">পরামর্শদাতাগণ</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {consultants?.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-14 h-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                            {c.nameBn.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg leading-tight">{c.nameBn}</h3>
                          <p className="text-sm text-muted-foreground">{c.name}</p>
                          <p className="text-sm text-primary font-medium mt-1">{c.specializationBn}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {c.rating.toFixed(1)}
                        </span>
                        <span>{c.experience} বছর অভিজ্ঞতা</span>
                        <span>{c.totalSessions} পরামর্শ</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant={c.available ? "default" : "secondary"} className={c.available ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100" : ""}>
                            {c.available ? "উপলব্ধ" : "ব্যস্ত"}
                          </Badge>
                          <p className="text-sm font-semibold mt-1">৳{c.fee}/সেশন</p>
                        </div>
                        <Button
                          size="sm"
                          disabled={!c.available}
                          onClick={() => setSelectedConsultant({ id: c.id, name: c.name, nameBn: c.nameBn })}
                        >
                          বুকিং করুন
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">আমার বুকিংসমূহ</h2>
          {!bookings?.length ? (
            <Card className="p-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">কোনো বুকিং নেই</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => (
                <Card key={b.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{b.consultantName}</p>
                        <p className="text-xs text-muted-foreground">{b.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1">{b.preferredDate}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{statusConfig[b.status] || b.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedConsultant} onOpenChange={(open) => !open && setSelectedConsultant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedConsultant?.nameBn}-এর সাথে পরামর্শ বুক করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>আপনার নাম</Label>
                <Input value={form.farmerName} onChange={e => setForm(p => ({ ...p, farmerName: e.target.value }))} placeholder="কৃষকের নাম" />
              </div>
              <div className="space-y-2">
                <Label>মোবাইল নম্বর</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>পরামর্শের বিষয়</Label>
              <Input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="কী বিষয়ে পরামর্শ নিতে চান" />
            </div>
            <div className="space-y-2">
              <Label>পছন্দের তারিখ</Label>
              <Input type="date" value={form.preferredDate} onChange={e => setForm(p => ({ ...p, preferredDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>অতিরিক্ত তথ্য (ঐচ্ছিক)</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="বিস্তারিত জানান..." rows={2} />
            </div>
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => selectedConsultant && book({ data: { consultantId: selectedConsultant.id, ...form } })}
            >
              {isPending ? "বুকিং হচ্ছে..." : "বুকিং নিশ্চিত করুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
