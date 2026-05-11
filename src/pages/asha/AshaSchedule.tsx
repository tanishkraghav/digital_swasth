import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Bell, BellOff, Trash2, CheckCircle2, Calendar as CalIcon } from 'lucide-react';
import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAsha, type ScheduledVisit } from '@/lib/ashaStore';
import { useToast } from '@/hooks/use-toast';

const TYPES: ScheduledVisit['type'][] = ['Antenatal', 'Postnatal', 'Child immunisation', 'Sick child', 'General illness'];

const AshaSchedule = () => {
  const navigate = useNavigate();
  const { scheduled, addScheduled, toggleScheduledDone, removeScheduled } = useAsha();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ScheduledVisit['type']>('Antenatal');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState(true);

  async function requestNotifPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const r = await Notification.requestPermission();
    return r === 'granted';
  }

  async function save() {
    if (!name.trim()) { toast({ title: 'Patient name required', variant: 'destructive' }); return; }
    let reminderEnabled = reminder;
    if (reminder) {
      const ok = await requestNotifPermission();
      if (!ok) {
        toast({ title: 'Notification permission denied — reminder will be in-app only' });
        reminderEnabled = false;
      }
    }
    addScheduled({ patientName: name.trim(), type, date, time, notes: notes.trim() || undefined, reminderEnabled });
    setName(''); setNotes(''); setOpen(false);
    toast({ title: 'Visit scheduled' });
  }

  const upcoming = [...scheduled].sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-3 flex items-center gap-2">
        <button onClick={() => navigate('/asha/home')} className="text-muted-foreground" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-xs text-muted-foreground">{upcoming.filter((v) => !v.done).length} upcoming</p>
        </div>
        <Button size="sm" className="bg-primary" onClick={() => setOpen((v) => !v)}>
          <Plus className="w-4 h-4" /> New
        </Button>
      </header>

      {open && (
        <Card className="mx-5 mb-4 p-4 border-primary/30 space-y-3 animate-fade-in-up">
          <div>
            <Label className="text-xs">Patient name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunita Devi" className="h-11" />
          </div>
          <div>
            <Label className="text-xs">Visit type</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="BP, weight, etc." />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-primary" /> Browser reminder on day-of
            </div>
            <Switch checked={reminder} onCheckedChange={setReminder} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-11 bg-primary" onClick={save}>Save</Button>
          </div>
        </Card>
      )}

      <div className="px-5 space-y-2.5 pb-6">
        {upcoming.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            <CalIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No visits scheduled yet.
          </Card>
        )}
        {upcoming.map((v) => (
          <Card key={v.id} className={`p-4 border-border ${v.done ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleScheduledDone(v.id)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  v.done ? 'bg-success border-success text-success-foreground' : 'border-muted-foreground/40'
                }`}
                aria-label={v.done ? 'Mark not done' : 'Mark done'}
              >
                {v.done && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${v.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {v.patientName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {v.type} · {v.date}{v.time ? ` · ${v.time}` : ''}
                </p>
                {v.notes && <p className="text-sm text-foreground/80 mt-1.5">{v.notes}</p>}
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  {v.reminderEnabled ? <Bell className="w-3 h-3 text-primary" /> : <BellOff className="w-3 h-3" />}
                  {v.reminderEnabled ? 'Reminder on' : 'No reminder'}
                </div>
              </div>
              <button
                onClick={() => removeScheduled(v.id)}
                className="text-muted-foreground hover:text-destructive p-1.5 rounded"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </AshaLayout>
  );
};

export default AshaSchedule;
