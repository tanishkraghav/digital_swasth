import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, Stethoscope, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGES, tb, t } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { ASHA_WORKERS } from '@/lib/mockData';
import { Bilingual } from '@/components/Shared';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, loginPatient, loginAsha } = useApp();
  const [step, setStep] = useState<'role' | 'patient' | 'asha'>('role');

  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [pin, setPin] = useState('');

  const handlePatient = () => {
    const v = village.trim();
    const p = phone.trim().replace(/\D/g, '');
    if (v.length < 2) {
      toast({ title: 'Please enter your village name', variant: 'destructive' });
      return;
    }
    if (p.length !== 10) {
      toast({ title: `Phone must be 10 digits (you entered ${p.length})`, variant: 'destructive' });
      return;
    }
    loginPatient({ village: v, phone: p });
    navigate('/patient/home');
  };

  const handleAsha = () => {
    const worker = ASHA_WORKERS.find((w) => w.workerId.toLowerCase() === workerId.trim().toLowerCase());
    if (!worker || pin.length < 4) {
      toast({
        title: 'Try ASH-UP-2241 with PIN 1234',
        description: 'Demo credentials',
      });
      return;
    }
    loginAsha({ workerId: worker.workerId, name: worker.name, village: worker.village, patientsAssigned: worker.patientsAssigned });
    navigate('/asha/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft/40 via-background to-background flex flex-col">
      {/* Top bar with language */}
      <div className="flex justify-end p-4">
        <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
          <SelectTrigger className="w-auto gap-2 border-border bg-background/80 backdrop-blur">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.native} {l.code !== 'en' && <span className="text-muted-foreground ml-1">({l.label})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="text-center mb-10 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-green shadow-glow mb-5">
            <Heart className="w-8 h-8 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
            {t('appName', language)}
          </h1>
          {language !== 'en' && (
            <p className="text-lg text-muted-foreground mb-1">Swasthya Sathi</p>
          )}
          <p className="text-base text-muted-foreground mt-3">
            {t('tagline', language)}{language !== 'en' && <span className="block text-sm opacity-70">Your health companion</span>}
          </p>
        </div>

        {step === 'role' && (
          <div className="w-full max-w-md grid gap-4">
            <button
              onClick={() => setStep('patient')}
              className="group bg-card border-2 border-border hover:border-primary hover:shadow-card rounded-2xl p-6 flex items-center gap-5 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-soft flex items-center justify-center group-hover:bg-primary-soft/80 transition-colors">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <Bilingual {...tb('iAmPatient', language)} className="text-lg font-semibold text-foreground" />
              </div>
            </button>

            <button
              onClick={() => setStep('asha')}
              className="group bg-card border-2 border-border hover:border-accent hover:shadow-card rounded-2xl p-6 flex items-center gap-5 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-accent-soft flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-accent" />
              </div>
              <div className="flex-1">
                <Bilingual {...tb('iAmAsha', language)} className="text-lg font-semibold text-foreground" />
              </div>
            </button>
          </div>
        )}

        {step === 'patient' && (
          <Card className="w-full max-w-md p-6 shadow-card border-border/60">
            <h2 className="text-xl font-semibold mb-1">
              <Bilingual {...tb('iAmPatient', language)} />
            </h2>
            <p className="text-sm text-muted-foreground mb-5">No password needed</p>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">{t('village', language)}</Label>
                <Input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Rampur" className="h-12 text-base" />
              </div>
              <div>
                <Label className="mb-1.5 block">{t('phone', language)}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98XXXXXXXX" type="tel" inputMode="numeric" maxLength={10} className="h-12 text-base" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('role')} className="flex-1 h-12">Back</Button>
                <Button onClick={handlePatient} className="flex-1 h-12 bg-primary hover:bg-primary/90">
                  {t('continue', language)}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 'asha' && (
          <Card className="w-full max-w-md p-6 shadow-card border-border/60">
            <h2 className="text-xl font-semibold mb-1">
              <Bilingual {...tb('iAmAsha', language)} />
            </h2>
            <p className="text-sm text-muted-foreground mb-5">Demo: ASH-UP-2241 / PIN 1234</p>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">{t('workerId', language)}</Label>
                <Input value={workerId} onChange={(e) => setWorkerId(e.target.value)} placeholder="ASH-UP-2241" className="h-12 text-base" />
              </div>
              <div>
                <Label className="mb-1.5 block">{t('pin', language)}</Label>
                <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" type="password" maxLength={6} className="h-12 text-base" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('role')} className="flex-1 h-12">Back</Button>
                <Button onClick={handleAsha} className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground">
                  {t('continue', language)}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <footer className="text-center py-4 text-xs text-muted-foreground">
        Built for ASHA workers and rural communities · NHM-aligned
      </footer>
    </div>
  );
};

export default Index;
