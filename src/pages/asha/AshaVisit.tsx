import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VISITS } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/lib/store';
import { useAsha } from '@/lib/ashaStore';
import { t } from '@/lib/i18n';

interface Step {
  id: string;
  question: string;
  type: 'number' | 'text' | 'yesno' | 'bp';
  unit?: string;
}

const STEPS_BY_TYPE: Record<string, Step[]> = {
  Antenatal: [
    { id: 'weeks', question: 'Pregnancy weeks', type: 'number', unit: 'weeks' },
    { id: 'bp', question: 'Blood pressure', type: 'bp' },
    { id: 'weight', question: 'Weight', type: 'number', unit: 'kg' },
    { id: 'fetal_movement', question: 'Fetal movement felt today?', type: 'yesno' },
    { id: 'swelling', question: 'Swelling in feet/hands?', type: 'yesno' },
    { id: 'notes', question: 'Other observations', type: 'text' },
  ],
  Postnatal: [
    { id: 'days', question: 'Days post-delivery', type: 'number', unit: 'days' },
    { id: 'temp', question: 'Temperature', type: 'number', unit: '°F' },
    { id: 'bleeding', question: 'Excessive bleeding?', type: 'yesno' },
    { id: 'breastfeeding', question: 'Breastfeeding successfully?', type: 'yesno' },
    { id: 'notes', question: 'Other observations', type: 'text' },
  ],
  'Child immunisation': [
    { id: 'age', question: 'Child age', type: 'number', unit: 'months' },
    { id: 'weight', question: 'Weight', type: 'number', unit: 'kg' },
    { id: 'vaccine', question: 'Vaccine due (e.g., DPT-2)', type: 'text' },
    { id: 'fever_history', question: 'Recent fever?', type: 'yesno' },
    { id: 'notes', question: 'Notes', type: 'text' },
  ],
  'Sick child': [
    { id: 'age', question: 'Child age', type: 'number', unit: 'years' },
    { id: 'temp', question: 'Temperature', type: 'number', unit: '°F' },
    { id: 'breathing_rate', question: 'Breaths per minute', type: 'number', unit: 'bpm' },
    { id: 'diarrhea', question: 'Diarrhea present?', type: 'yesno' },
    { id: 'notes', question: 'Symptoms', type: 'text' },
  ],
  'General illness': [
    { id: 'temp', question: 'Temperature', type: 'number', unit: '°F' },
    { id: 'bp', question: 'Blood pressure', type: 'bp' },
    { id: 'pulse', question: 'Pulse', type: 'number', unit: 'bpm' },
    { id: 'symptoms', question: 'Symptoms reported', type: 'text' },
    { id: 'duration', question: 'How many days?', type: 'number', unit: 'days' },
  ],
};

const AshaVisit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useApp();
  const { addLog, addReferral } = useAsha();
  const visit = VISITS.find((v) => v.id === id) ?? VISITS[0];
  const steps = STEPS_BY_TYPE[visit.type] ?? STEPS_BY_TYPE['General illness'];

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [showRedFlag, setShowRedFlag] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ red_flags: string[]; protocol_next_step: string; referral_recommended: boolean; referral_reason: string; visit_notes_summary: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  function checkRedFlag(stepId: string, value: string) {
    if (stepId === 'bp' && bpSys && bpDia) {
      const s = parseInt(bpSys), d = parseInt(bpDia);
      if (s >= 140 || d >= 90) {
        const flag = `BP ${s}/${d} — possible pre-eclampsia, consider referral.`;
        if (!redFlags.includes(flag)) setRedFlags((r) => [...r, flag]);
        setShowRedFlag(flag);
        return;
      }
    }
    if (stepId === 'temp') {
      const t = parseFloat(value);
      if (t >= 102) { const flag = `Temp ${t}°F — high fever, monitor closely.`; if (!redFlags.includes(flag)) setRedFlags((r) => [...r, flag]); setShowRedFlag(flag); return; }
    }
    if (stepId === 'breathing_rate') {
      const b = parseInt(value);
      if (b > 50) { const flag = `Breaths ${b}/min — possible pneumonia, refer urgently.`; if (!redFlags.includes(flag)) setRedFlags((r) => [...r, flag]); setShowRedFlag(flag); return; }
    }
    if (stepId === 'bleeding' && value === 'yes') {
      const flag = 'Excessive postnatal bleeding — refer immediately.'; if (!redFlags.includes(flag)) setRedFlags((r) => [...r, flag]); setShowRedFlag(flag); return;
    }
    setShowRedFlag(null);
  }

  function next() {
    let val = answers[step.id] ?? '';
    if (step.type === 'bp') {
      val = `${bpSys}/${bpDia}`;
      setAnswers((a) => ({ ...a, bp: val }));
    }
    checkRedFlag(step.id, val);
    if (!isLast) setStepIdx((i) => i + 1);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const measurements = { ...answers, bp: bpSys && bpDia ? `${bpSys}/${bpDia}` : undefined };
      const { data, error } = await supabase.functions.invoke('asha-protocol', {
        body: { visitType: visit.type, patient: { name: visit.patientName, age: visit.age }, measurements },
      });
      if (error) throw error;
      setSummary(data);
    } catch (e: any) {
      // Localized fallback summary
      setSummary({
        red_flags: redFlags,
        protocol_next_step: t('continueVisit', language),
        referral_recommended: redFlags.length > 0,
        referral_reason: redFlags[0] ?? '',
        visit_notes_summary: `${visit.type} visit for ${visit.patientName}. Measurements: ${Object.entries(answers).map(([k, v]) => `${k}=${v}`).join(', ')}.`,
      });
      toast({ title: t('continueVisit', language) });
    } finally {
      setSubmitting(false);
    }
  }

  if (summary) {
    return (
      <AshaLayout>
        <header className="px-5 pt-6 pb-3 flex items-center gap-2">
          <button onClick={() => navigate('/asha/visits')} className="text-muted-foreground"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Visit summary</h1>
        </header>
        <div className="px-5 space-y-3 pb-6">
          <Card className="p-5 border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Patient</p>
            <p className="font-semibold">{visit.patientName} · {visit.age}y · {visit.type}</p>
          </Card>

          {summary.red_flags.length > 0 && (
            <Card className="p-5 border-destructive/30 bg-destructive-soft">
              <div className="flex items-center gap-2 mb-2 text-destructive font-semibold">
                <AlertTriangle className="w-5 h-5" /> Red flags
              </div>
              <ul className="space-y-1.5 text-sm text-foreground">
                {summary.red_flags.map((f, i) => (<li key={i}>• {f}</li>))}
              </ul>
            </Card>
          )}

          <Card className="p-5 border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Next step</p>
            <p className="text-sm">{summary.protocol_next_step}</p>
          </Card>

          <Card className="p-5 border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Notes</p>
            <p className="text-sm leading-relaxed">{summary.visit_notes_summary}</p>
          </Card>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {summary.referral_recommended && (
              <Button
                className="h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  addReferral({
                    patientName: visit.patientName,
                    reason: summary.referral_reason || summary.red_flags[0] || 'Clinical concern',
                    phc: 'Rampur PHC',
                  });
                  toast({ title: 'Referred to PHC', description: 'Tracked under Referrals' });
                  navigate('/asha/referrals');
                }}
              >
                Refer to PHC
              </Button>
            )}
            <Button
              className={`h-12 ${summary.referral_recommended ? '' : 'col-span-2'} bg-primary text-primary-foreground hover:bg-primary/90`}
              onClick={() => {
                const measurements = { ...answers, bp: bpSys && bpDia ? `${bpSys}/${bpDia}` : '' };
                addLog({
                  patientName: visit.patientName,
                  type: visit.type,
                  measurements,
                  redFlags: summary.red_flags,
                  notes: summary.visit_notes_summary,
                });
                toast({
                  title: 'Visit saved',
                  description: navigator.onLine ? 'Synced' : 'Saved offline — will sync when online',
                });
                navigate('/asha/visits');
              }}
            >
              <CheckCircle2 className="w-5 h-5" /> Submit & save
            </Button>
          </div>
        </div>
      </AshaLayout>
    );
  }

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-3 flex items-center gap-2">
        <button onClick={() => navigate('/asha/visits')} className="text-muted-foreground"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">{visit.patientName}</h1>
          <p className="text-xs text-muted-foreground">{visit.type} · {visit.age}y</p>
        </div>
        <span className="text-xs text-muted-foreground">{stepIdx + 1}/{steps.length}</span>
      </header>

      <div className="px-5 mb-3">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="px-5 pb-6 space-y-3">
        {showRedFlag && (
          <Card className="border-destructive/40 bg-destructive-soft p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-foreground font-medium">{showRedFlag}</p>
          </Card>
        )}

        <Card className="p-5 border-border">
          <Label className="text-base font-semibold block mb-3">{step.question}</Label>

          {step.type === 'number' && (
            <div className="flex items-center gap-2">
              <Input type="number" inputMode="numeric" value={answers[step.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [step.id]: e.target.value }))} className="h-12 text-base" autoFocus />
              {step.unit && <span className="text-sm text-muted-foreground">{step.unit}</span>}
            </div>
          )}
          {step.type === 'text' && (
            <Textarea value={answers[step.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [step.id]: e.target.value }))} rows={3} className="text-base" autoFocus />
          )}
          {step.type === 'bp' && (
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="SYS" value={bpSys} onChange={(e) => setBpSys(e.target.value)} className="h-12 text-base text-center" />
              <span className="text-xl text-muted-foreground">/</span>
              <Input type="number" placeholder="DIA" value={bpDia} onChange={(e) => setBpDia(e.target.value)} className="h-12 text-base text-center" />
              <span className="text-sm text-muted-foreground">mmHg</span>
            </div>
          )}
          {step.type === 'yesno' && (
            <div className="grid grid-cols-2 gap-2">
              {['yes', 'no'].map((v) => (
                <button
                  key={v}
                  onClick={() => setAnswers((a) => ({ ...a, [step.id]: v }))}
                  className={`h-12 rounded-lg border-2 font-medium capitalize transition-colors ${
                    answers[step.id] === v ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-background text-foreground'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-2">
          {stepIdx > 0 && (
            <Button variant="outline" onClick={() => setStepIdx((i) => i - 1)} className="h-12 flex-1">Back</Button>
          )}
          {!isLast ? (
            <Button onClick={next} className="h-12 flex-1 bg-primary">Next</Button>
          ) : (
            <Button onClick={() => { next(); submit(); }} disabled={submitting} className="h-12 flex-1 bg-primary">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Generate summary</>}
            </Button>
          )}
        </div>
      </div>
    </AshaLayout>
  );
};

export default AshaVisit;
