import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from './i18n';

export type Role = 'patient' | 'asha' | null;

export interface PatientSession {
  village: string;
  phone: string;
  name?: string;
}
export interface AshaSession {
  workerId: string;
  name: string;
  village: string;
  patientsAssigned: number;
}

interface AppState {
  language: Language;
  role: Role;
  patient: PatientSession | null;
  asha: AshaSession | null;
  autoRetry: boolean;
  voiceConsent: boolean;
  setLanguage: (l: Language) => void;
  loginPatient: (p: PatientSession) => void;
  loginAsha: (a: AshaSession) => void;
  logout: () => void;
  setAutoRetry: (v: boolean) => void;
  setVoiceConsent: (v: boolean) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      language: 'hi',
      role: null,
      patient: null,
      asha: null,
      autoRetry: true,
      voiceConsent: false,
      setLanguage: (language) => set({ language }),
      loginPatient: (patient) => set({ role: 'patient', patient }),
      loginAsha: (asha) => set({ role: 'asha', asha }),
      logout: () => set({ role: null, patient: null, asha: null }),
      setAutoRetry: (autoRetry) => set({ autoRetry }),
      setVoiceConsent: (voiceConsent) => set({ voiceConsent }),
    }),
    { name: 'swasthya-sathi' },
  ),
);

// Triage result store — persisted so the last result is viewable offline
export interface TriageResult {
  urgency_tier: 1 | 2 | 3;
  condition_guess: string;
  home_remedy: string;
  referral_reason: string;
  confidence_score: number;
  symptoms_summary: string;
  transcript: { role: 'assistant' | 'user'; text: string }[];
  photo?: string; // base64 data URL of optional symptom photo
  cachedAt?: number; // epoch ms when stored
}

interface TriageState {
  result: TriageResult | null;
  setResult: (r: TriageResult | null) => void;
}
export const useTriage = create<TriageState>()(
  persist(
    (set) => ({
      result: null,
      setResult: (result) =>
        set({ result: result ? { ...result, cachedAt: result.cachedAt ?? Date.now() } : null }),
    }),
    { name: 'swasthya-sathi-triage' },
  ),
);
