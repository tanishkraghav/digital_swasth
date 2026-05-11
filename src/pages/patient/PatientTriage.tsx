import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Send, Keyboard, ChevronLeft, Loader2, RotateCcw, AlertTriangle, Settings, Phone, ShieldCheck, Camera, X } from 'lucide-react';
import { PatientLayout } from '@/components/PatientLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { useApp, useTriage, type TriageResult } from '@/lib/store';
import { LANGUAGES, t } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NEAREST_PHC } from '@/lib/mockData';

interface Msg { role: 'assistant' | 'user'; text: string }

const Waveform = () => (
  <div className="flex items-center gap-1 h-8">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <span
        key={i}
        className="w-1 bg-primary-foreground/80 rounded-full waveform-bar"
        style={{ height: '24px', animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);

const PatientTriage = () => {
  const navigate = useNavigate();
  const { language, autoRetry, setAutoRetry, voiceConsent, setVoiceConsent } = useApp();
  const { setResult } = useTriage();
  const { toast } = useToast();
  const langName = LANGUAGES.find((l) => l.code === language)?.label ?? 'Hindi';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [errorState, setErrorState] = useState<{ kind: 'fallback' | 'rate' | 'network'; history: Msg[] } | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attemptRef = useRef(0);
  const lastVoiceRef = useRef<string>('');
  const retryTimerRef = useRef<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  // Initial greeting (only after consent)
  useEffect(() => {
    if (!voiceConsent) return;
    if (messages.length > 0) return;
    sendToAI([]);
    return () => { if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceConsent]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  function clearRetryTimer() {
    if (retryTimerRef.current) { window.clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    setRetryCountdown(0);
  }

  function scheduleAutoRetry(history: Msg[], baseDelayMs: number) {
    clearRetryTimer();
    let secs = Math.ceil(baseDelayMs / 1000);
    setRetryCountdown(secs);
    const tick = () => {
      secs -= 1;
      if (secs <= 0) {
        setRetryCountdown(0);
        retryTimerRef.current = null;
        sendToAI(history, { isRetry: true });
      } else {
        setRetryCountdown(secs);
        retryTimerRef.current = window.setTimeout(tick, 1000);
      }
    };
    retryTimerRef.current = window.setTimeout(tick, 1000);
  }

  async function sendToAI(history: Msg[], opts: { isRetry?: boolean } = {}) {
    if (!opts.isRetry) attemptRef.current = 0;
    setLoading(true);
    setErrorState(null);
    clearRetryTimer();
    try {
      const { data, error } = await supabase.functions.invoke('triage-chat', {
        body: { messages: history, language: langName },
      });

      if (error) {
        const isRate = error.message?.includes('429');
        const kind = isRate ? 'rate' : 'network';
        toast({
          title: isRate ? t('rateLimited', language) : t('technicalIssue', language),
          variant: 'destructive',
        });
        setErrorState({ kind, history });
        if (history.length === 0) {
          setMessages([{ role: 'assistant', text: t('technicalIssue', language) }]);
        }
        // Exponential backoff: 2s, 4s, 8s (max 3 auto retries) — only if user has it enabled
        if (autoRetry && attemptRef.current < 3) {
          attemptRef.current += 1;
          scheduleAutoRetry(history, Math.min(8000, 2000 * 2 ** (attemptRef.current - 1)));
        }
        return;
      }

      if (data?.done && data?.result) {
        const transcript = [...history];
        const r: TriageResult = {
          ...data.result,
          transcript,
          symptoms_summary: history.filter((m) => m.role === 'user').map((m) => m.text).join('; '),
          photo: photo ?? undefined,
        };
        setResult(r);
        navigate('/patient/result');
        return;
      }

      // Server returned a soft fallback (HTTP 200 with fallback flag)
      if (data?.fallback) {
        setErrorState({ kind: 'fallback', history });
        if (data?.message) {
          setMessages((m) => (m.length === 0 ? [{ role: 'assistant', text: data.message }] : m));
        }
        if (autoRetry && attemptRef.current < 3) {
          attemptRef.current += 1;
          scheduleAutoRetry(history, Math.min(8000, 2000 * 2 ** (attemptRef.current - 1)));
        }
        return;
      }

      if (data?.message) {
        setMessages((m) => [...m, { role: 'assistant', text: data.message }]);
      }
    } catch (e: any) {
      toast({ title: t('technicalIssue', language), variant: 'destructive' });
      setErrorState({ kind: 'network', history });
      if (history.length === 0) {
        setMessages([{ role: 'assistant', text: t('technicalIssue', language) }]);
      }
      if (autoRetry && attemptRef.current < 3) {
        attemptRef.current += 1;
        scheduleAutoRetry(history, Math.min(8000, 2000 * 2 ** (attemptRef.current - 1)));
      }
    } finally {
      setLoading(false);
    }
  }

  function manualRetry() {
    if (!errorState) return;
    attemptRef.current = 0;
    sendToAI(errorState.history);
  }

  function submitUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next: Msg[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(next);
    setInput('');
    lastVoiceRef.current = '';
    sendToAI(next);
  }

  function fallbackToText(prefill: string, reason?: 'voice') {
    setTextMode(true);
    setRecording(false);
    if (prefill) setInput(prefill);
    if (reason === 'voice') {
      toast({ title: t('voiceFailed', language) });
    }
  }

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      fallbackToText(lastVoiceRef.current, 'voice');
      return;
    }
    if (recording) { setRecording(false); return; }
    const rec = new SR();
    const langMap: Record<string, string> = {
      hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', or: 'or-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bho: 'hi-IN',
    };
    rec.lang = langMap[language] ?? 'hi-IN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      const captured = (finalText || interim).trim();
      if (captured) lastVoiceRef.current = captured;
      if (finalText.trim()) submitUser(finalText.trim());
    };
    rec.onerror = () => {
      setRecording(false);
      // Pre-fill anything we caught so the user can edit instead of retyping
      fallbackToText(lastVoiceRef.current, 'voice');
    };
    rec.onend = () => setRecording(false);
    try { rec.start(); setRecording(true); } catch { fallbackToText(lastVoiceRef.current, 'voice'); }
  }

  function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: 'Photo too large (max 4MB)', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(typeof reader.result === 'string' ? reader.result : null);
      toast({ title: t('photoAttached', language) });
    };
    reader.readAsDataURL(file);
  }

  const showRetryBanner = !!errorState && !loading;

  // Consent gate — must be shown before sending voice/text to AI
  if (!voiceConsent) {
    return (
      <PatientLayout>
        <div className="flex flex-col min-h-screen px-5 py-6">
          <button onClick={() => navigate('/patient/home')} className="flex items-center gap-1 text-muted-foreground text-sm mb-6">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <Card className="p-6 border-border shadow-card max-w-md w-full mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t('consentTitle', language)}</h2>
            </div>
            <p className="text-base leading-relaxed text-foreground mb-6">{t('consentBody', language)}</p>
            <div className="flex flex-col gap-2">
              <Button className="h-12 bg-primary hover:bg-primary/90" onClick={() => setVoiceConsent(true)}>
                {t('agreeContinue', language)}
              </Button>
              <Button variant="outline" className="h-12" onClick={() => navigate('/patient/home')}>
                {t('cancel', language)}
              </Button>
            </div>
          </Card>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="flex flex-col h-screen max-h-screen">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/80 backdrop-blur">
          <button onClick={() => navigate('/patient/home')} className="flex items-center gap-1 text-muted-foreground text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-sm font-medium">Voice triage</span>
          <div className="flex items-center gap-1">
            <a
              href={`tel:${NEAREST_PHC.ambulance}`}
              className="flex items-center gap-1 text-destructive bg-destructive-soft px-2 py-1.5 rounded-md text-xs font-semibold hover:bg-destructive/15 transition-colors"
              aria-label={t('call108', language)}
            >
              <Phone className="w-3.5 h-3.5" /> 108
            </a>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="text-muted-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label={t('autoRetry', language)}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{t('autoRetry', language)}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{t('autoRetryHint', language)}</p>
                  </div>
                  <Switch
                    checked={autoRetry}
                    onCheckedChange={setAutoRetry}
                    aria-label={t('autoRetry', language)}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <button onClick={() => setTextMode((v) => !v)} className="text-muted-foreground p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Toggle text">
              <Keyboard className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-base leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border border-border text-foreground rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {showRetryBanner && (errorState?.kind === 'fallback' || errorState?.kind === 'rate') && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="max-w-[92%] w-full bg-warning-soft border border-warning/40 rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm">
                <div className="flex items-start gap-2.5 text-sm text-foreground">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug font-medium">
                      {errorState.kind === 'rate' ? t('rateLimited', language) : t('technicalIssue', language)}
                    </p>
                    {retryCountdown > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('retryingIn', language).replace('{s}', String(retryCountdown))}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={manualRetry}
                        className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t('retry', language)}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fallbackToText(lastVoiceRef.current)}
                        className="h-9"
                      >
                        {t('switchToText', language)}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showRetryBanner && errorState?.kind === 'network' && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="max-w-[90%] w-full bg-accent-soft border border-accent/30 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="leading-snug">{t('technicalIssue', language)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Button size="sm" variant="outline" onClick={manualRetry} className="h-8 gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t('retry', language)}
                      </Button>
                      {retryCountdown > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {t('retryingIn', language).replace('{s}', String(retryCountdown))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-background p-4 pb-6 space-y-3">
          {/* Photo attach row */}
          <div className="flex items-center justify-center">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhotoSelected}
            />
            {photo ? (
              <div className="flex items-center gap-2 bg-accent-soft border border-accent/30 rounded-lg pl-2 pr-1 py-1">
                <img src={photo} alt="symptom" className="w-9 h-9 rounded object-cover" />
                <span className="text-xs text-accent font-medium">{t('photoAttached', language)}</span>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label={t('removePhoto', language)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                {t('attachPhoto', language)}
              </button>
            )}
          </div>

          {textMode ? (
            <form onSubmit={(e) => { e.preventDefault(); submitUser(input); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your symptoms…"
                className="h-12 text-base"
                disabled={loading}
                autoFocus
              />
              <Button type="submit" size="icon" className="h-12 w-12 bg-primary" disabled={loading || !input.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={toggleMic}
                disabled={loading}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  recording ? 'bg-destructive text-destructive-foreground' : 'bg-gradient-green text-primary-foreground shadow-glow'
                }`}
              >
                {recording && <span className="pulse-ring" />}
                {recording ? <Waveform /> : <Mic className="w-9 h-9" />}
              </button>
              <p className="text-sm text-muted-foreground">
                {recording ? t('listening', language) : t('tapAndSpeak', language)}
              </p>
              <button onClick={() => fallbackToText(lastVoiceRef.current)} className="text-xs text-primary font-medium underline-offset-2 hover:underline">
                {t('switchToText', language)}
              </button>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientTriage;
