import { useNavigate } from 'react-router-dom';
import { Mic, ChevronLeft, Calendar, RotateCcw } from 'lucide-react';
import { PatientLayout } from '@/components/PatientLayout';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { RECENT_CONSULTATIONS } from '@/lib/mockData';
import { UrgencyBadge } from '@/components/Shared';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const PatientHome = () => {
  const navigate = useNavigate();
  const { language, patient, logout, autoRetry, setAutoRetry } = useApp();

  return (
    <PatientLayout>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ChevronLeft className="w-4 h-4" /> Switch role
        </button>
        <span className="text-xs text-muted-foreground">{patient?.village}</span>
      </div>

      <div className="px-6 pt-6 pb-10 flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold mb-1">{t('appName', language)}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline', language)}</p>

        <div className="my-12 relative">
          <button
            onClick={() => navigate('/patient/triage')}
            className="relative w-44 h-44 rounded-full bg-gradient-green text-primary-foreground shadow-glow flex items-center justify-center transition-transform active:scale-95"
            aria-label="Start voice triage"
          >
            <span className="pulse-ring" />
            <Mic className="w-16 h-16" strokeWidth={2} />
          </button>
        </div>

        <p className="text-lg font-medium text-foreground max-w-xs leading-snug">
          {t('tapAndSpeak', language)}
        </p>
        {language !== 'en' && (
          <p className="text-sm text-muted-foreground mt-1">Tap and speak your symptoms</p>
        )}
      </div>

      <section className="px-5 pb-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{t('autoRetry', language)}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t('autoRetryHint', language)}</p>
          </div>
          <Switch
            checked={autoRetry}
            onCheckedChange={setAutoRetry}
            aria-label={t('autoRetry', language)}
          />
        </div>
      </section>

      <section className="px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base">{t('recentVisits', language)}</h2>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-2.5">
          {RECENT_CONSULTATIONS.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.summary}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.date}</p>
              </div>
              <UrgencyBadge urgency={c.urgency} />
            </div>
          ))}
        </div>
      </section>
    </PatientLayout>
  );
};

export default PatientHome;
