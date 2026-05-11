import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ALERTS, type Alert } from '@/lib/mockData';
import { UrgencyBadge } from '@/components/Shared';
import { ChevronLeft, MapPin, Clock } from 'lucide-react';

const AshaAlerts = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<Alert | null>(null);

  if (open) {
    return (
      <AshaLayout>
        <header className="px-5 pt-6 pb-3 flex items-center gap-2">
          <button onClick={() => setOpen(null)} className="text-muted-foreground"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Alert detail</h1>
        </header>
        <div className="px-5 space-y-3 pb-6">
          <Card className={`p-5 ${open.urgency === 'red' ? 'border-destructive/30 bg-destructive-soft' : 'border-warning/30 bg-warning-soft'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-lg">{open.patientName}</p>
              <UrgencyBadge urgency={open.urgency} />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {open.village}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5" /> {open.time}</p>
          </Card>

          <Card className="p-5 border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Symptoms reported</p>
            <ul className="space-y-1.5 text-sm">
              {open.symptoms.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}
            </ul>
          </Card>

          <Button onClick={() => navigate(`/asha/visit/v1`)} className="w-full h-12 bg-primary">
            Start linked visit
          </Button>
        </div>
      </AshaLayout>
    );
  }

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground">{ALERTS.length} active alerts in your area</p>
      </header>
      <div className="px-5 space-y-2.5 pb-6">
        {ALERTS.map((a) => (
          <Card key={a.id} onClick={() => setOpen(a)} className="p-4 border-border cursor-pointer hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.urgency === 'red' ? 'bg-destructive animate-pulse' : 'bg-warning'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-semibold truncate">{a.patientName}</p>
                  <UrgencyBadge urgency={a.urgency} />
                </div>
                <p className="text-xs text-muted-foreground">{a.village} · {a.time}</p>
                <p className="text-sm text-foreground/80 mt-1 line-clamp-1">{a.symptomSummary}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AshaLayout>
  );
};

export default AshaAlerts;
