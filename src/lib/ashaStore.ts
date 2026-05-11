import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScheduledVisit {
  id: string;
  patientName: string;
  type: 'Antenatal' | 'Postnatal' | 'Child immunisation' | 'Sick child' | 'General illness';
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  notes?: string;
  reminderEnabled: boolean;
  done: boolean;
}

export interface LoggedVisit {
  id: string;
  patientName: string;
  type: ScheduledVisit['type'];
  loggedAt: number; // epoch ms
  measurements: Record<string, string>;
  redFlags: string[];
  notes: string;
  synced: boolean;
}

export type ReferralOutcome = 'pending' | 'seen' | 'admitted' | 'lost';
export interface Referral {
  id: string;
  patientName: string;
  reason: string;
  phc: string;
  referredAt: number;
  outcome: ReferralOutcome;
}

export interface StockItem {
  id: 'ors' | 'ifa' | 'paracetamol' | 'oxytocin' | 'condoms';
  label: string;
  count: number;
  threshold: number;
}

interface AshaWorkflowState {
  scheduled: ScheduledVisit[];
  logs: LoggedVisit[];
  referrals: Referral[];
  stock: StockItem[];
  addScheduled: (v: Omit<ScheduledVisit, 'id' | 'done'>) => void;
  toggleScheduledDone: (id: string) => void;
  removeScheduled: (id: string) => void;
  addLog: (v: Omit<LoggedVisit, 'id' | 'loggedAt' | 'synced'>) => void;
  syncAllLogs: () => void;
  addReferral: (r: Omit<Referral, 'id' | 'referredAt' | 'outcome'>) => void;
  setReferralOutcome: (id: string, outcome: ReferralOutcome) => void;
  adjustStock: (id: StockItem['id'], delta: number) => void;
}

const DEFAULT_STOCK: StockItem[] = [
  { id: 'ors', label: 'ORS sachets', count: 24, threshold: 10 },
  { id: 'ifa', label: 'IFA tablets', count: 120, threshold: 50 },
  { id: 'paracetamol', label: 'Paracetamol 500mg', count: 60, threshold: 20 },
  { id: 'oxytocin', label: 'Oxytocin (cold-chain)', count: 4, threshold: 2 },
  { id: 'condoms', label: 'Condoms', count: 40, threshold: 15 },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAsha = create<AshaWorkflowState>()(
  persist(
    (set, get) => ({
      scheduled: [],
      logs: [],
      referrals: [],
      stock: DEFAULT_STOCK,

      addScheduled: (v) =>
        set({ scheduled: [...get().scheduled, { ...v, id: uid(), done: false }] }),
      toggleScheduledDone: (id) =>
        set({ scheduled: get().scheduled.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) }),
      removeScheduled: (id) =>
        set({ scheduled: get().scheduled.filter((s) => s.id !== id) }),

      addLog: (v) =>
        set({
          logs: [
            { ...v, id: uid(), loggedAt: Date.now(), synced: typeof navigator !== 'undefined' ? navigator.onLine : true },
            ...get().logs,
          ],
        }),
      syncAllLogs: () =>
        set({ logs: get().logs.map((l) => ({ ...l, synced: true })) }),

      addReferral: (r) =>
        set({
          referrals: [
            { ...r, id: uid(), referredAt: Date.now(), outcome: 'pending' },
            ...get().referrals,
          ],
        }),
      setReferralOutcome: (id, outcome) =>
        set({ referrals: get().referrals.map((x) => (x.id === id ? { ...x, outcome } : x)) }),

      adjustStock: (id, delta) =>
        set({
          stock: get().stock.map((s) =>
            s.id === id ? { ...s, count: Math.max(0, s.count + delta) } : s,
          ),
        }),
    }),
    { name: 'swasthya-sathi-asha' },
  ),
);
