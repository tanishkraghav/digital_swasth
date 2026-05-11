import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VISITS, type Visit } from '@/lib/mockData';
import { UrgencyBadge } from '@/components/Shared';
import { ChevronRight, Filter } from 'lucide-react';

const TYPES: Visit['type'][] = ['Antenatal', 'Postnatal', 'Child immunisation', 'Sick child', 'General illness'];
const STATUSES: Visit['status'][] = ['Pending', 'Completed', 'Referred'];

const AshaVisits = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<Visit['type'] | 'All'>('All');
  const [status, setStatus] = useState<Visit['status'] | 'All'>('All');

  const filtered = useMemo(() =>
    VISITS.filter((v) => (type === 'All' || v.type === type) && (status === 'All' || v.status === status)),
    [type, status]);

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Visits</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} of {VISITS.length} shown</p>
      </header>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Filter className="w-3.5 h-3.5" /> Type</div>
        <div className="flex gap-2 flex-wrap">
          {(['All', ...TYPES] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Status</div>
        <div className="flex gap-2">
          {(['All', ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${status === s ? 'bg-foreground text-background border-foreground' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-2.5 pb-6">
        {filtered.map((v) => (
          <Card key={v.id} onClick={() => navigate(`/asha/visit/${v.id}`)} className="p-4 border-border cursor-pointer hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${v.urgency === 'red' ? 'bg-destructive' : v.urgency === 'amber' ? 'bg-warning' : 'bg-success'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-foreground">{v.patientName} <span className="text-sm font-normal text-muted-foreground">· {v.age}y</span></p>
                  <UrgencyBadge urgency={v.urgency} label={v.status} />
                </div>
                <p className="text-xs text-muted-foreground">{v.type} · {v.date}</p>
                {v.notes && <p className="text-sm text-foreground/80 mt-1.5">{v.notes}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground border-dashed">No visits match these filters.</Card>
        )}
      </div>
    </AshaLayout>
  );
};

export default AshaVisits;
