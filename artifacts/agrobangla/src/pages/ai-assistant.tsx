import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot, Send, User, Sparkles, RefreshCw, Copy, CheckCheck,
  Leaf, ChevronRight, Loader2, Trash2, Mic, MicOff,
  Volume2, VolumeX, Square,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

// ── Strip markdown to plain text for TTS ──
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")     // bold
    .replace(/\*(.+?)\*/g, "$1")          // italic
    .replace(/`(.+?)`/g, "$1")            // code
    .replace(/#{1,6}\s+/g, "")            // headings
    .replace(/\|.+\|/g, "")              // table rows
    .replace(/[-–—]{2,}/g, "")           // dashes
    .replace(/^\s*[-•]\s+/gm, "")        // bullet points
    .replace(/\n{2,}/g, "। ")            // double newlines → pause
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Global TTS state (only one utterance at a time) ──
let activeSpeakId: string | null = null;
const ttsListeners = new Map<string, (speaking: boolean) => void>();

function registerTTSListener(id: string, cb: (speaking: boolean) => void) {
  ttsListeners.set(id, cb);
}
function unregisterTTSListener(id: string) {
  ttsListeners.delete(id);
}
function notifyAll(activeId: string | null) {
  ttsListeners.forEach((cb, id) => cb(id === activeId));
}

function speakText(id: string, text: string, onEnd: () => void) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  activeSpeakId = id;
  notifyAll(id);

  const plain = stripMarkdown(text);
  const utter = new SpeechSynthesisUtterance(plain);

  // Try to find a Bengali voice, fall back to any available
  const voices = window.speechSynthesis.getVoices();
  const bnVoice = voices.find(v => v.lang.startsWith("bn")) ||
                  voices.find(v => v.lang.startsWith("hi")) || // Hindi as fallback
                  null;
  if (bnVoice) utter.voice = bnVoice;
  utter.lang = "bn-BD";
  utter.rate = 0.9;
  utter.pitch = 1;

  utter.onend = () => {
    activeSpeakId = null;
    notifyAll(null);
    onEnd();
  };
  utter.onerror = () => {
    activeSpeakId = null;
    notifyAll(null);
    onEnd();
  };

  window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  activeSpeakId = null;
  notifyAll(null);
}

// ── TTS button component ──
function TTSButton({ msgId, content }: { msgId: string; content: string }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    registerTTSListener(msgId, setSpeaking);
    return () => unregisterTTSListener(msgId);
  }, [msgId]);

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
    } else {
      speakText(msgId, content, () => setSpeaking(false));
    }
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? "থামান" : "শুনুন"}
      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all ${
        speaking
          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {speaking ? (
        <>
          <SpeakingWave />
          <Square className="w-2.5 h-2.5 fill-current" />
          <span>থামান</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3 h-3" />
          <span>শুনুন</span>
        </>
      )}
    </button>
  );
}

// ── Animated sound wave ──
function SpeakingWave() {
  return (
    <span className="inline-flex items-end gap-[2px] h-3">
      {[0.4, 0.8, 1, 0.6, 0.9].map((h, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-emerald-500"
          animate={{ scaleY: [h, 1, h * 0.5, 1, h] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
          style={{ height: "100%", transformOrigin: "bottom" }}
        />
      ))}
    </span>
  );
}

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
      if (e.error === "no-speech") toast.error("কোনো কথা শোনা যায়নি।");
      else if (e.error === "not-allowed") toast.error("মাইক্রোফোনের অনুমতি দিন।");
      setListening(false); setInterimText("");
    };
    recognition.onend = () => { setListening(false); setInterimText(""); };
    recognitionRef.current = recognition;
  }, [onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) { toast.error("আপনার ব্রাউজার ভয়েস ইনপুট সমর্থন করে না।"); return; }
    stopSpeaking(); // stop any TTS before recording
    try { recognitionRef.current.start(); setListening(true); toast("🎤 বলুন...", { duration: 2500 }); }
    catch { toast.error("মাইক্রোফোন চালু করা যায়নি।"); }
  }, []);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setListening(false); }, []);

  return { listening, interimText, supported, startListening, stopListening };
}

// ── AI chat hook ──
function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const assistantId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE}/api/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) throw new Error("Server error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
              return;
            }
            if (json.content) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + json.content } : m
              ));
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setLoading(false);
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
    }
  }, [loading]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    stopSpeaking();
    setMessages([]);
    setLoading(false);
  }, []);

  return { messages, loading, sendMessage, clearChat };
}

// ── Typing dots ──
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 h-4">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </span>
  );
}

// ── Message bubble ──
function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  const done = !msg.streaming && !!msg.content;

  const copy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? "bg-primary text-primary-foreground"
               : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble + actions */}
      <div className={`max-w-[80%] group flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-primary text-primary-foreground rounded-tr-sm"
                 : "bg-muted/60 dark:bg-muted/40 rounded-tl-sm"
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : msg.streaming && !msg.content ? (
            <TypingDots />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-table:text-xs">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.streaming && (
                <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Action row for assistant messages */}
        {!isUser && done && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            {/* TTS button */}
            <TTSButton msgId={msg.id} content={msg.content} />

            {/* Copy button */}
            <button onClick={copy}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "কপি হয়েছে" : "কপি"}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ──
export default function AIAssistant() {
  const { messages, loading, sendMessage, clearChat } = useAIChat();
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ttsSupported, setTtsSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTtsSupported("speechSynthesis" in window);
    // Pre-load voices
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => prev.trim() ? `${prev.trim()} ${text}` : text);
    toast.success(`"${text}" যোগ হয়েছে`, { duration: 2000 });
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const { listening, interimText, supported: micSupported, startListening, stopListening } =
    useVoiceInput(handleVoiceResult);

  useEffect(() => {
    fetch(`${BASE}/api/ai-suggestions`).then(r => r.json()).then(setSuggestions).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
    textareaRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">AI কৃষি সহকারী</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              বাংলাদেশ কৃষি বিশেষজ্ঞ সহকারী
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {micSupported && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Mic className="w-3 h-3" /> ভয়েস ইনপুট
            </Badge>
          )}
          {ttsSupported && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Volume2 className="w-3 h-3" /> ভয়েস আউটপুট
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="w-3 h-3" /> বিনামূল্যে
          </Badge>
          {!isEmpty && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border/50">
        <ScrollArea className="flex-1 px-4 py-4">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 gap-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl">
                <Leaf className="w-10 h-10 text-white" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold mb-2">আমি কীভাবে সাহায্য করতে পারি?</h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  ধান, গম, সবজি, সার, রোগ নির্ণয়, সরকারি সুবিধা — যেকোনো কৃষি বিষয়ে প্রশ্ন করুন বাংলায়।
                </p>
                <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
                  {micSupported && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" /> কথা বলে প্রশ্ন করুন
                    </p>
                  )}
                  {ttsSupported && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" /> উত্তর শুনতে পারবেন
                    </p>
                  )}
                </div>
              </motion.div>

              {suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="w-full max-w-2xl">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">জনপ্রিয় প্রশ্নসমূহ:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((s, i) => (
                      <motion.button key={i}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        onClick={() => { setInput(s); textareaRef.current?.focus(); }}
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
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <CardContent className="p-3 border-t bg-background/50">
          {!isEmpty && suggestions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {suggestions.slice(0, 5).map((s, i) => (
                <button key={i}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Listening preview */}
          <AnimatePresence>
            {listening && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 flex-1 min-h-[20px]">
                  {interimText || "শুনছি... বাংলায় বলুন"}
                </p>
                <SpeakingWave />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening ? "শুনছি..." : "আপনার কৃষি প্রশ্ন লিখুন... (Enter পাঠান)"}
              rows={2}
              disabled={loading}
              className="resize-none text-sm flex-1 focus:ring-primary/30"
            />

            <div className="flex flex-col gap-2">
              {/* Send */}
              <Button onClick={handleSend} disabled={!input.trim() || loading}
                size="icon" className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0" title="পাঠান">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>

              {/* Mic */}
              {micSupported && (
                <Button onClick={listening ? stopListening : startListening} disabled={loading}
                  size="icon" variant={listening ? "default" : "outline"}
                  className={`h-10 w-10 rounded-xl shrink-0 transition-all ${
                    listening ? "bg-red-500 hover:bg-red-600 border-red-500 text-white animate-pulse"
                              : "hover:border-emerald-500 hover:text-emerald-600"
                  }`}
                  title={listening ? "রেকর্ডিং বন্ধ করুন" : "ভয়েস ইনপুট"}>
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}

              {/* Stop TTS */}
              {ttsSupported && !isEmpty && (
                <Button onClick={stopSpeaking} size="icon" variant="outline"
                  className="h-10 w-10 rounded-xl shrink-0 hover:border-red-400 hover:text-red-500"
                  title="সব অডিও থামান">
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}

              {/* Clear */}
              {!isEmpty && (
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0"
                  onClick={clearChat} title="নতুন চ্যাট">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            BARI · BRRI · DAM · TCB তথ্যের ভিত্তিতে তৈরি
            {(micSupported || ttsSupported) && " · Chrome/Edge-এ ভয়েস সম্পূর্ণ সমর্থিত"}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
