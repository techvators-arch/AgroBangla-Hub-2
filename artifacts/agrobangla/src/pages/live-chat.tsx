import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, Send, User, Bot, Loader2, CircleDot,
  ChevronRight, Trash2, Volume2, VolumeX, Mic, MicOff,
  Users, Square, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type Message = {
  id: number;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  isAi: boolean;
  createdAt: string;
};

type Room = { id: string; name: string; type: string };

// ── Voice input hook ──
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "bn-BD";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final) { onResult(final.trim()); setInterimText(""); }
    };
    recognition.onerror = (e) => {
      if (e.error === "no-speech") toast.error("কোনো কথা শোনা যায়নি।");
      else if (e.error === "not-allowed") toast.error("মাইক্রোফোনের অনুমতি দিন।");
      setListening(false); setInterimText("");
    };
    recognition.onend = () => { setListening(false); setInterimText(""); };
    recognitionRef.current = recognition;
  }, [onResult]);

  const start = useCallback(() => {
    if (!recognitionRef.current) { toast.error("ভয়েস ইনপুট সমর্থিত নয়।"); return; }
    try { recognitionRef.current.start(); setListening(true); toast("শুনছি...", { duration: 2500 }); }
    catch { toast.error("মাইক্রোফোন চালু করা যায়নি।"); }
  }, []);
  const stop = useCallback(() => { recognitionRef.current?.stop(); setListening(false); }, []);
  return { listening, interimText, supported, start, stop };
}

// ── TTS ──
let activeUtter: SpeechSynthesisUtterance | null = null;
function speak(text: string, onDone?: () => void) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text.replace(/[\*_`#]/g, "").replace(/\n/g, " "));
  const voices = window.speechSynthesis.getVoices();
  const bn = voices.find(v => v.lang.startsWith("bn")) || voices.find(v => v.lang.startsWith("hi")) || null;
  if (bn) utter.voice = bn;
  utter.lang = "bn-BD"; utter.rate = 0.9;
  utter.onend = () => { activeUtter = null; onDone?.(); };
  utter.onerror = () => { activeUtter = null; onDone?.(); };
  activeUtter = utter;
  window.speechSynthesis.speak(utter);
}
function stopSpeak() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  activeUtter = null;
}

// ── Main page ──
export default function LiveChat() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>("সাদার্ন");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("কৃষক");
  const [suggestions, setSuggestions] = useState<string[]>([
    "ধানের রোগ কী করব?",
    "সারের সঠিক ব্যবহার জানতে চাই?",
    "বর্ষার সময় দরান?",
    "মাটির pH মান কম হলে কী করব?",
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [ttsOn, setTtsOn] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/live-chat/rooms`).then(r => r.json()).then(setRooms).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${BASE}/api/live-chat/history?roomId=${encodeURIComponent(activeRoom)}`)
      .then(r => r.json()).then((data: Message[]) => {
        setMessages(data);
      }).catch(() => {});
  }, [activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => prev.trim() ? `${prev.trim()} ${text}` : text);
    toast.success(`"${text}" যোগ হয়েছে`, { duration: 2000 });
  }, []);

  const { listening, interimText, supported: micSupported, start: startMic, stop: stopMic } = useVoiceInput(handleVoiceResult);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const userMsg: Message = {
      id: Date.now(), roomId: activeRoom, senderId: "user-001", senderName: userName,
      senderRole: "কৃষক", message: text, isAi: false, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const [msgRes, aiRes] = await Promise.all([
        fetch(`${BASE}/api/live-chat/message`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: activeRoom, senderId: "user-001", senderName: userName, senderRole: "কৃষক", message: text, isAi: false }),
        }),
        fetch(`${BASE}/api/live-chat/ai-reply`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }),
      ]);
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const aiMsg: Message = {
          id: Date.now() + 1, roomId: activeRoom, senderId: "agri-ai", senderName: "Agri AI",
          senderRole: "এআই", message: aiData.reply, isAi: true, createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
        if (ttsOn) speak(aiData.reply);
      }
    } catch {
      toast.error("সংযোগে সমস্যা। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-6 max-w-4xl flex flex-col"
      style={{ height: "calc(100vh - 80px)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Agri AI লাইভ চ্যাট</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              বাংলাদেশ কৃষি বিশেষজ্শ AI সহকারী
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge variant="secondary" className="gap-1 text-xs"><Sparkles className="w-3 h-3" /> AI সহকারী</Badge>
          {!isEmpty && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setMessages([]); stopSpeak(); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Room selector */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {rooms.map(room => (
          <button key={room.id}
            onClick={() => setActiveRoom(room.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
              activeRoom === room.id
                ? "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border-border hover:bg-muted/60"
            }`}>
            <Users className="w-3 h-3" /> {room.name}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border/50">
        <ScrollArea className="flex-1 px-4 py-4">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 gap-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl">
                <Bot className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold mb-2">আমি কীভাবে সাহায্য করতে পারি?</h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  ধান, গম, সবুজি, সার, রোগ নির্ণয়, সরকারি সুবিধা — যেকোনো কৃষি বিষয়ে বাংলায় প্রশ্ন করুন।
                </p>
              </motion.div>
              {suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="w-full max-w-2xl">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">জনপ্রিয় প্রশ্ন:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((s, i) => (
                      <motion.button key={i}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        onClick={() => { setInput(s); }}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left">
                        <ChevronRight className="w-3 h-3 text-primary shrink-0" />{s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.isAi ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.isAi ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      {msg.isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] flex flex-col gap-1 ${msg.isAi ? "items-start" : "items-end"}`}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.isAi ? "bg-muted/60 dark:bg-muted/40 rounded-tl-sm"
                          : "bg-primary text-primary-foreground rounded-tr-sm"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</span>
                        {msg.isAi && (
                          <button onClick={() => speak(msg.message)}
                            className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                            <Volume2 className="w-3 h-3" /> শুনুন
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3">
                    <span className="inline-flex items-center gap-0.5 h-4">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-current"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <CardContent className="p-3 border-t bg-background/50">
          <AnimatePresence>
            {listening && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 flex-1 min-h-[20px]">
                  {interimText || "শুনছি... বাংলায় বলুন"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening ? "শুনছি..." : "আপনার কৃষি প্রশ্ন লিখুন..."}
              rows={2}
              disabled={loading}
              className="resize-none text-sm flex-1 rounded-xl border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex flex-col gap-2">
              <Button onClick={sendMessage} disabled={!input.trim() || loading}
                size="icon" className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
              {micSupported && (
                <Button onClick={listening ? stopMic : startMic} disabled={loading}
                  size="icon" variant={listening ? "default" : "outline"}
                  className={`h-10 w-10 rounded-xl shrink-0 transition-all ${
                    listening ? "bg-red-500 hover:bg-red-600 border-red-500 text-white animate-pulse"
                      : "hover:border-emerald-500 hover:text-emerald-600"
                  }`}>
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Button onClick={stopSpeak} size="icon" variant="outline"
                className="h-10 w-10 rounded-xl shrink-0 hover:border-red-400 hover:text-red-500">
                <VolumeX className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={ttsOn} onChange={e => setTtsOn(e.target.checked)} className="w-3 h-3" />
              <Volume2 className="w-3 h-3" /> AI উত্তর শুনুন
            </label>
            <span className="text-[10px] text-muted-foreground ml-auto">আপনার নাম: {userName}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
