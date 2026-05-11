import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Download, MapPin, Phone, LogOut, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AshaProfile = () => {
  const navigate = useNavigate();
  const { asha, logout, language, autoRetry, setAutoRetry } = useApp();
  const { toast } = useToast();

  const visitsCompleted = 38;
  const visitsTarget = 50;
  const pct = Math.round((visitsCompleted / visitsTarget) * 100);

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Profile</h1>
      </header>

      <div className="px-5 space-y-3 pb-6">
        <Card className="p-5 border-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-green text-primary-foreground flex items-center justify-center text-2xl font-bold">
            {asha?.name?.[0] ?? 'A'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{asha?.name}</p>
            <p className="text-sm text-muted-foreground">{asha?.workerId}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5" /> +91 98765 11111</p>
          </div>
        </Card>

        <Card className="p-5 border-border">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Assigned cluster</p>
          <p className="font-semibold mb-3">{asha?.village}</p>
          <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-primary-soft via-secondary to-accent-soft border border-border relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto text-primary mb-1" />
                Map: {asha?.village}
                <p className="text-xs mt-1">{asha?.patientsAssigned} households</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Monthly performance</p>
            <span className="text-sm text-primary font-semibold">{pct}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-green" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{visitsCompleted} of {visitsTarget} visits completed this month</p>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
            <div><p className="text-xl font-bold">12</p><p className="text-xs text-muted-foreground">Antenatal</p></div>
            <div><p className="text-xl font-bold">8</p><p className="text-xs text-muted-foreground">Postnatal</p></div>
            <div><p className="text-xl font-bold">18</p><p className="text-xs text-muted-foreground">Sick visits</p></div>
          </div>
        </Card>

        <Card className="p-4 border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{t('autoRetry', language)}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t('autoRetryHint', language)}</p>
          </div>
          <Switch checked={autoRetry} onCheckedChange={setAutoRetry} aria-label={t('autoRetry', language)} />
        </Card>

        <Button variant="outline" className="w-full h-12" onClick={() => toast({ title: 'Report download started' })}>
          <Download className="w-4 h-4" /> Download monthly report (PDF)
        </Button>

        <Button variant="ghost" className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive-soft" onClick={() => { logout(); navigate('/'); }}>
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </AshaLayout>
  );
};

export default AshaProfile;
