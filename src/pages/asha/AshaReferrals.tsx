import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, ArrowUpRight } from 'lucide-react';
import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAsha, type ReferralOutcome } from '@/lib/ashaStore';
import { useToast } from '@/hooks/use-toast';
import { NEAREST_PHC } from '@/lib/mockData';

const OUTCOMES: { id: ReferralOutcome; label: string; cls: string }[] = [
  { id: 'pending', label: 'Pending', cls: 'bg-warning-soft text-warning border-warning/30' },
  { id: 'seen', label: 'Seen at PHC', cls: 'bg-primary-soft text-primary border-primary/30' },
  { id: 'admitted', label: 'Admitted', cls: 'bg-accent-soft text-accent border-accent/30' },
  { id: 'lost', label: 'Lost to follow-up', cls: 'bg-destructive-soft text-destructive border-destructive/30' },
];

const AshaReferrals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { referrals, addReferral, setReferralOutcome } = useAsha();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');

  function save() {
    if (!name.trim() || !reason.trim()) {
      toast({ title: 'Name and reason required', variant: 'destructive' });
      return;
    }
    addReferral({ patientName: name.trim(), reason: reason.trim(), phc: NEAREST_PHC.name });
    setName(''); setReason(''); setOpen(false);
    toast({ title: 'Referral logged' });
  }

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-3 flex items-center gap-2">
        <button onClick={() => navigate('/asha/home')} className="text-muted-foreground" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-xs text-muted-foreground">{referrals.filter((r) => r.outcome === 'pending').length} pending</p>
        </div>
        <Button size="sm" className="bg-primary" onClick={() => setOpen((v) => !v)}>
          <Plus className="w-4 h-4" /> New
        </Button>
      </header>

      {open && (
        <Card className="mx-5 mb-4 p-4 border-primary/30 space-y-3 animate-fade-in-up">
          <div>
            <Label className="text-xs">Patient name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
          </div>
          <div>
            <Label className="text-xs">Reason for referral</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. BP 160/110, severe headache" />
          </div>
          <p className="text-xs text-muted-foreground">Referring to <span className="font-medium text-foreground">{NEAREST_PHC.name}</span></p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-11 bg-primary" onClick={save}>Log referral</Button>
          </div>
        </Card>
      )}

      <div className="px-5 space-y-2.5 pb-6">
        {referrals.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            <ArrowUpRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No referrals logged yet.
          </Card>
        )}
        {referrals.map((r) => {
          const cur = OUTCOMES.find((o) => o.id === r.outcome)!;
          return (
            <Card key={r.id} className="p-4 border-border">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold">{r.patientName}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${cur.cls}`}>{cur.label}</span>
              </div>
              <p className="text-sm text-foreground/80">{r.reason}</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {r.phc} · {new Date(r.referredAt).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setReferralOutcome(r.id, o.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      r.outcome === o.id ? o.cls : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </AshaLayout>
  );
};

export default AshaReferrals;
