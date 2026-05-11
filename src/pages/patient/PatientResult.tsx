import { useNavigate } from 'react-router-dom';
import { Home, Heart, AlertTriangle, Phone, MapPin, Bell, Printer, ChevronLeft, ThumbsUp, ThumbsDown, Volume2, Square, MessageSquare, Share2, WifiOff } from 'lucide-react';
import { PatientLayout } from '@/components/PatientLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTriage, useApp } from '@/lib/store';
import { ASSIGNED_ASHA, NEAREST_PHC } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useMemo, useState } from 'react';
import { t } from '@/lib/i18n';

const LANG_TTS: Record<string, string> = {
  hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', or: 'or-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bho: 'hi-IN',
};

const PatientResult = () => {
  const navigate = useNavigate();
  const { result } = useTriage();
  const { language, patient } = useApp();
  const { toast } = useToast();
  const [speaking, setSpeaking] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (!result) navigate('/patient/home');
    return () => { try { window.speechSynthesis?.cancel(); } catch {} };
  }, [result, navigate]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const shareText = useMemo(() => {
    if (!result) return '';
    const tierLabel = result.urgency_tier === 1 ? 'Home care' : result.urgency_tier === 2 ? 'Visit ASHA' : 'URGENT - Hospital';
    return [
      `Swasthya Sathi triage`,
      `Patient: ${patient?.name || patient?.phone || '—'}`,
      `Tier ${result.urgency_tier} (${tierLabel})`,
      `Likely: ${result.condition_guess}`,
      result.referral_reason ? `Reason: ${result.referral_reason}` : '',
      result.home_remedy ? `Care: ${result.home_remedy}` : '',
      `Symptoms: ${result.symptoms_summary || '—'}`,
    ].filter(Boolean).join('\n');
  }, [result, patient]);

  if (!result) return null;
  const showOfflineBanner = !online && !!result.cachedAt;

  const tier = result.urgency_tier;

  function speakAdvice() {
    const synth = window.speechSynthesis;
    if (!synth) {
      toast({ title: 'Voice playback not supported on this device', variant: 'destructive' });
      return;
    }
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const parts = [result.condition_guess, result.home_remedy || result.referral_reason].filter(Boolean);
    const utter = new SpeechSynthesisUtterance(parts.join('. '));
    utter.lang = LANG_TTS[language] ?? 'hi-IN';
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utter);
    setSpeaking(true);
  }

  return (
    <PatientLayout>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2">
        <button onClick={() => navigate('/patient/home')} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ChevronLeft className="w-4 h-4" /> Home
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={speakAdvice}
          className="h-9 gap-1.5"
          aria-label={speaking ? t('stopListening', language) : t('listenAdvice', language)}
        >
          {speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {speaking ? t('stopListening', language) : t('listenAdvice', language)}
        </Button>
      </div>

      <div className="px-5 pb-10">
        {showOfflineBanner && (
          <Card className="mb-3 p-3 border-warning/30 bg-warning-soft flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-foreground leading-snug">{t('offlineCached', language)}</p>
          </Card>
        )}
        {tier === 1 && (
          <Card className="border-success/30 bg-success-soft p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-success text-success-foreground flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Home care</h2>
                <p className="text-sm text-success font-medium">Low urgency · Self-care</p>
              </div>
            </div>
            <div className="space-y-3 text-foreground">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Likely condition</p>
                <p className="text-base font-medium">{result.condition_guess}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">What to do</p>
                <p className="text-base leading-relaxed">{result.home_remedy}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-success/20 pt-4">
              <p className="text-sm font-medium mb-3">After 24 hours, how do you feel?</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-success/30 text-success hover:bg-success/10" onClick={() => { toast({ title: 'Great! Stay well.' }); navigate('/patient/home'); }}>
                  <ThumbsUp className="w-4 h-4" /> I feel better
                </Button>
                <Button variant="outline" className="flex-1 border-warning/30 text-warning hover:bg-warning/10" onClick={() => navigate('/patient/triage')}>
                  <ThumbsDown className="w-4 h-4" /> Worsened
                </Button>
              </div>
            </div>
          </Card>
        )}

        {tier === 2 && (
          <Card className="border-warning/30 bg-warning-soft p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-warning text-warning-foreground flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Visit ASHA worker</h2>
                <p className="text-sm text-warning font-medium">Moderate · Get checked today</p>
              </div>
            </div>

            <div className="bg-background rounded-xl p-4 border border-warning/20 flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-accent-soft flex items-center justify-center text-2xl font-bold text-accent">
                {ASSIGNED_ASHA.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">{ASSIGNED_ASHA.name}</p>
                <p className="text-sm text-muted-foreground">{ASSIGNED_ASHA.village} · {ASSIGNED_ASHA.workerId}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Reason</p>
              <p className="text-base">{result.referral_reason || result.condition_guess}</p>
            </div>

            <Button className="w-full h-12 bg-warning hover:bg-warning/90 text-warning-foreground" onClick={() => toast({ title: 'ASHA notified', description: `${ASSIGNED_ASHA.name} has been alerted.` })}>
              <Bell className="w-5 h-5" /> Notify her I'm coming
            </Button>
          </Card>
        )}

        {tier === 3 && (
          <Card className="border-destructive/30 bg-destructive-soft p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Go to hospital urgently</h2>
                <p className="text-sm text-destructive font-medium">High urgency · Act now</p>
              </div>
            </div>

            <div className="bg-background rounded-xl p-4 border border-destructive/20 mb-4">
              <p className="font-semibold text-base">{NEAREST_PHC.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" /> {NEAREST_PHC.distance} away
              </p>
              <a href={NEAREST_PHC.directions} target="_blank" rel="noreferrer" className="text-sm text-primary font-medium underline mt-2 inline-block">
                Open directions →
              </a>
            </div>

            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Reason</p>
              <p className="text-base">{result.referral_reason || result.condition_guess}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button className="h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse-slow" asChild>
                <a href={`tel:${NEAREST_PHC.ambulance}`} aria-label={t('call108', language)}>
                  <Phone className="w-5 h-5" /> {t('call108', language)}
                </a>
              </Button>
              <Button variant="outline" className="h-12 border-destructive/30" onClick={() => window.print()}>
                <Printer className="w-5 h-5" /> Print summary
              </Button>
            </div>
          </Card>
        )}

        {/* Symptom summary card (for handoff to doctor) */}
        <Card className="mt-4 p-5 border-border">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            Summary for doctor
          </p>
          <p className="text-sm leading-relaxed text-foreground">{result.symptoms_summary || '—'}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span>AI confidence: {Math.round((result.confidence_score || 0) * 100)}%</span>
            <span>·</span>
            <span>Tier {tier}</span>
          </div>
        </Card>

        {result.photo && (
          <Card className="mt-3 p-3 border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              {t('photoForReview', language)}
            </p>
            <img src={result.photo} alt="symptom" className="w-full max-h-64 object-contain rounded-md bg-muted" />
          </Card>
        )}

        {/* Share row — works offline via OS share sheet / SMS / WhatsApp deep links */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-11 gap-1.5 border-border"
            asChild
          >
            <a href={`sms:?body=${encodeURIComponent(shareText)}`} aria-label={t('shareSms', language)}>
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{t('shareSms', language)}</span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-1.5 border-border"
            asChild
          >
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              aria-label={t('shareWhatsapp', language)}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{t('shareWhatsapp', language)}</span>
            </a>
          </Button>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientResult;
