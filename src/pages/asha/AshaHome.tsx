import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ClipboardCheck, ArrowUpRight, AlertTriangle, LogOut, Calendar, Package, CloudOff, RefreshCw } from 'lucide-react';
import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/store';
import { useAsha } from '@/lib/ashaStore';
import { VISITS, ALERTS } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const Stat = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) => (
  <Card className="p-4 border-border">
    <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center mb-3`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </Card>
);

const QuickTile = ({ icon: Icon, label, badge, onClick, accent }: { icon: any; label: string; badge?: number; onClick: () => void; accent: string }) => (
  <button
    onClick={onClick}
    className="bg-card border border-border rounded-xl p-3 flex flex-col items-start gap-2 hover:border-primary/40 transition-colors text-left active:scale-[0.98]"
  >
    <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center relative`}>
      <Icon className="w-4 h-4" />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
    <span className="text-xs font-medium leading-tight">{label}</span>
  </button>
);

const AshaHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { asha, logout } = useApp();
  const { scheduled, logs, referrals, stock, syncAllLogs } = useAsha();
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const on = () => { setOnline(true); if (logs.some((l) => !l.synced)) { syncAllLogs(); toast({ title: 'Offline visits synced' }); } };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [logs, syncAllLogs, toast]);

  const pending = VISITS.filter((v) => v.status === 'Pending').length;
  const referred = VISITS.filter((v) => v.status === 'Referred').length + referrals.length;
  const critical = ALERTS.filter((a) => a.urgency === 'red').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayScheduled = scheduled.filter((s) => !s.done && s.date === today);
  const upcomingScheduled = scheduled.filter((s) => !s.done && s.date > today).slice(0, 1);
  const unsyncedLogs = logs.filter((l) => !l.synced).length;
  const lowStock = stock.filter((s) => s.count <= s.threshold).length;
  const pendingRefs = referrals.filter((r) => r.outcome === 'pending').length;

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Namaste 🙏</p>
          <h1 className="text-2xl font-bold text-foreground">{asha?.name ?? 'ASHA'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{asha?.village} · {asha?.workerId}</p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="text-muted-foreground p-2" aria-label="Logout">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {(!online || unsyncedLogs > 0) && (
        <div className="mx-5 mb-3">
          <Card className={`p-3 flex items-center gap-2.5 ${online ? 'bg-primary-soft border-primary/30' : 'bg-warning-soft border-warning/30'}`}>
            {online ? <RefreshCw className="w-4 h-4 text-primary shrink-0" /> : <CloudOff className="w-4 h-4 text-warning shrink-0" />}
            <p className="text-xs leading-snug flex-1">
              {online
                ? `${unsyncedLogs} visit${unsyncedLogs > 1 ? 's' : ''} pending sync`
                : 'Offline — visits will be saved locally and synced later.'}
            </p>
            {online && unsyncedLogs > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { syncAllLogs(); toast({ title: 'Synced' }); }}>
                Sync now
              </Button>
            )}
          </Card>
        </div>
      )}

      <section className="px-5 grid grid-cols-2 gap-3 mb-5">
        <Stat icon={Users} label="Patients this month" value={asha?.patientsAssigned ?? 47} accent="bg-primary-soft text-primary" />
        <Stat icon={ClipboardCheck} label="Pending visits" value={pending} accent="bg-warning-soft text-warning" />
        <Stat icon={ArrowUpRight} label="Referrals made" value={referred} accent="bg-accent-soft text-accent" />
        <Stat icon={AlertTriangle} label="Critical alerts" value={critical} accent="bg-destructive-soft text-destructive" />
      </section>

      <div className="px-5 mb-5">
        <Button onClick={() => navigate('/asha/visits')} className="w-full h-14 bg-gradient-green text-primary-foreground text-base shadow-card">
          <Plus className="w-5 h-5" /> Start new visit
        </Button>
      </div>

      <section className="px-5 mb-5">
        <h2 className="font-semibold text-base mb-3">Quick actions</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickTile
            icon={Calendar}
            label="Schedule"
            badge={todayScheduled.length}
            onClick={() => navigate('/asha/schedule')}
            accent="bg-primary-soft text-primary"
          />
          <QuickTile
            icon={ArrowUpRight}
            label="Referrals"
            badge={pendingRefs}
            onClick={() => navigate('/asha/referrals')}
            accent="bg-accent-soft text-accent"
          />
          <QuickTile
            icon={Package}
            label="Stock"
            badge={lowStock}
            onClick={() => navigate('/asha/stock')}
            accent="bg-warning-soft text-warning"
          />
        </div>
      </section>

      {(todayScheduled.length > 0 || upcomingScheduled.length > 0) && (
        <section className="px-5 mb-5">
          <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Scheduled
          </h2>
          <div className="space-y-2">
            {[...todayScheduled, ...upcomingScheduled].slice(0, 3).map((s) => (
              <Card key={s.id} className="p-3 border-border flex items-center gap-3">
                <div className={`w-1 h-10 rounded-full ${s.date === today ? 'bg-warning' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.patientName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.type} · {s.date === today ? `Today${s.time ? ` ${s.time}` : ''}` : `${s.date}${s.time ? ` ${s.time}` : ''}`}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/asha/schedule')} className="text-primary text-xs">Open</Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="px-5">
        <h2 className="font-semibold text-base mb-3">Today's priority</h2>
        <div className="space-y-2.5">
          {ALERTS.slice(0, 2).map((a) => (
            <Card key={a.id} className="p-4 border-border flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${a.urgency === 'red' ? 'bg-destructive' : 'bg-warning'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.patientName} · {a.village}</p>
                <p className="text-xs text-muted-foreground truncate">{a.symptomSummary}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/asha/alerts')} className="text-primary">View</Button>
            </Card>
          ))}
        </div>
      </section>
    </AshaLayout>
  );
};

export default AshaHome;
