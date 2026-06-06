import { useState } from "react";
import { useGetQuestions, useCreateQuestion, useAddAnswer, getGetQuestionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Plus, CheckCircle, Search, ThumbsUp, User } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["ধান", "গম", "সবজি", "ফল", "পাট", "সার", "সেচ", "রোগবালাই", "অন্যান্য"];
const DISTRICTS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"];

export default function QA() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "ধান", farmerName: "", district: "ঢাকা" });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerForm, setAnswerForm] = useState({ body: "", authorName: "", isExpert: false });

  const queryClient = useQueryClient();
  const { data: questions, isLoading } = useGetQuestions(
    { category: category || undefined, search: search || undefined },
    { query: { queryKey: getGetQuestionsQueryKey({ category, search }) } }
  );

  const { mutate: createQuestion, isPending: creating } = useCreateQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQuestionsQueryKey() });
        setAskOpen(false);
        setForm({ title: "", body: "", category: "ধান", farmerName: "", district: "ঢাকা" });
        toast.success("প্রশ্ন পোস্ট করা হয়েছে!");
      },
      onError: () => toast.error("প্রশ্ন পোস্ট করতে ব্যর্থ হয়েছে।"),
    },
  });

  const { mutate: addAnswer, isPending: answering } = useAddAnswer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQuestionsQueryKey() });
        setExpandedId(null);
        setAnswerForm({ body: "", authorName: "", isExpert: false });
        toast.success("উত্তর যোগ করা হয়েছে!");
      },
      onError: () => toast.error("উত্তর দিতে ব্যর্থ হয়েছে।"),
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">কৃষক প্রশ্নমঞ্চ</h1>
          <p className="text-muted-foreground">কৃষি বিষয়ক যেকোনো প্রশ্ন করুন, বিশেষজ্ঞরা উত্তর দেবেন</p>
        </div>
        <Dialog open={askOpen} onOpenChange={setAskOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              প্রশ্ন করুন
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন প্রশ্ন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>প্রশ্নের শিরোনাম</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="সংক্ষিপ্ত প্রশ্ন লিখুন" />
              </div>
              <div className="space-y-2">
                <Label>বিস্তারিত বর্ণনা</Label>
                <Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="আপনার সমস্যা বিস্তারিত লিখুন..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>বিভাগ</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>জেলা</Label>
                  <Select value={form.district} onValueChange={v => setForm(p => ({ ...p, district: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>আপনার নাম</Label>
                <Input value={form.farmerName} onChange={e => setForm(p => ({ ...p, farmerName: e.target.value }))} placeholder="কৃষকের নাম" />
              </div>
              <Button className="w-full" disabled={creating} onClick={() => createQuestion({ data: form })}>
                {creating ? "পোস্ট হচ্ছে..." : "প্রশ্ন পোস্ট করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="প্রশ্ন খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={category || "all"} onValueChange={v => setCategory(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="সকল বিভাগ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল বিভাগ</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 mb-4" />)
      ) : !questions?.length ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো প্রশ্ন পাওয়া যায়নি</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <motion.div key={q.id} layout>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="secondary">{q.category}</Badge>
                        {q.isResolved && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">সমাধান হয়েছে</Badge>}
                        <span className="text-xs text-muted-foreground">{q.district}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{q.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{q.body}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{q.farmerName}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{q.answersCount} উত্তর</span>
                        <span>{new Date(q.createdAt).toLocaleDateString("bn-BD")}</span>
                      </div>
                    </div>
                  </div>

                  {q.answers && q.answers.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      {q.answers.map((a: { id: number; body: string; authorName: string; isExpert: boolean; createdAt: string }) => (
                        <div key={a.id} className="flex gap-3 bg-muted/40 rounded-lg p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{a.authorName}</span>
                              {a.isExpert && <Badge className="text-xs bg-primary/10 text-primary">বিশেষজ্ঞ</Badge>}
                            </div>
                            <p className="text-sm">{a.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-primary"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    {expandedId === q.id ? "বন্ধ করুন" : "উত্তর দিন"}
                  </Button>

                  <AnimatePresence>
                    {expandedId === q.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-3"
                      >
                        <Textarea
                          placeholder="আপনার উত্তর লিখুন..."
                          value={answerForm.body}
                          onChange={e => setAnswerForm(p => ({ ...p, body: e.target.value }))}
                          rows={3}
                        />
                        <div className="flex gap-3">
                          <Input
                            placeholder="আপনার নাম"
                            value={answerForm.authorName}
                            onChange={e => setAnswerForm(p => ({ ...p, authorName: e.target.value }))}
                          />
                          <Button
                            disabled={answering}
                            onClick={() => addAnswer({ id: q.id, data: answerForm })}
                          >
                            উত্তর দিন
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
