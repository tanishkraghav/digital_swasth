import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export const OfflineBanner = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (online) return null;
  return (
    <div className="bg-warning-soft text-warning-foreground border-b border-warning/30 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4 text-warning" />
      <span className="text-warning">Offline mode — basic features available</span>
    </div>
  );
};

export const UrgencyBadge = ({ urgency, label }: { urgency: 'green' | 'amber' | 'red'; label?: string }) => {
  const cls =
    urgency === 'green'
      ? 'bg-success-soft text-success border-success/30'
      : urgency === 'amber'
      ? 'bg-warning-soft text-warning border-warning/30'
      : 'bg-destructive-soft text-destructive border-destructive/30';
  const dot =
    urgency === 'green' ? 'bg-success' : urgency === 'amber' ? 'bg-warning' : 'bg-destructive';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label ?? (urgency === 'green' ? 'Low' : urgency === 'amber' ? 'Moderate' : 'Urgent')}
    </span>
  );
};

export const Bilingual = ({ en, native, className = '' }: { en: string; native: string; className?: string }) => (
  <span className={className}>
    {native !== en ? (
      <>
        <span className="block">{native}</span>
        <span className="block text-[0.85em] opacity-70 font-normal">{en}</span>
      </>
    ) : (
      <span>{en}</span>
    )}
  </span>
);
