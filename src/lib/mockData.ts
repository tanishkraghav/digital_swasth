export type Urgency = 'green' | 'amber' | 'red';

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'F' | 'M';
  village: string;
  pregnant?: boolean;
  phone: string;
}

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  type: 'Antenatal' | 'Postnatal' | 'Child immunisation' | 'Sick child' | 'General illness';
  date: string;
  status: 'Pending' | 'Completed' | 'Referred';
  urgency: Urgency;
  notes?: string;
}

export interface Alert {
  id: string;
  patientName: string;
  village: string;
  symptomSummary: string;
  urgency: Urgency;
  time: string;
  symptoms: string[];
}

export interface Consultation {
  id: string;
  date: string;
  urgency: Urgency;
  summary: string;
}

export const PATIENTS: Patient[] = [
  { id: 'p1', name: 'Sunita Devi', age: 32, sex: 'F', village: 'Rampur', phone: '9876500001' },
  { id: 'p2', name: 'Ramesh Kumar', age: 45, sex: 'M', village: 'Belwa', phone: '9876500002' },
  { id: 'p3', name: 'Priya Singh', age: 24, sex: 'F', village: 'Lakhimpur', pregnant: true, phone: '9876500003' },
];

export const ASHA_WORKERS = [
  { id: 'a1', workerId: 'ASH-UP-2241', name: 'Meena Kumari', village: 'Rampur Cluster', patientsAssigned: 47, phone: '9876511111' },
  { id: 'a2', workerId: 'ASH-UP-2242', name: 'Savita Yadav', village: 'Belwa Cluster', patientsAssigned: 53, phone: '9876522222' },
];

export const VISITS: Visit[] = [
  { id: 'v1', patientId: 'p3', patientName: 'Priya Singh', age: 24, type: 'Antenatal', date: '2025-04-21', status: 'Pending', urgency: 'amber', notes: 'BP check due' },
  { id: 'v2', patientId: 'p1', patientName: 'Sunita Devi', age: 32, type: 'General illness', date: '2025-04-20', status: 'Completed', urgency: 'green' },
  { id: 'v3', patientId: 'p2', patientName: 'Ramesh Kumar', age: 45, type: 'General illness', date: '2025-04-19', status: 'Referred', urgency: 'red', notes: 'Chest pain — referred to PHC' },
  { id: 'v4', patientId: 'p3', patientName: 'Anjali Devi', age: 28, type: 'Postnatal', date: '2025-04-18', status: 'Completed', urgency: 'green' },
  { id: 'v5', patientId: 'p1', patientName: 'Aarav Kumar', age: 1, type: 'Child immunisation', date: '2025-04-17', status: 'Completed', urgency: 'green' },
  { id: 'v6', patientId: 'p2', patientName: 'Riya Sharma', age: 3, type: 'Sick child', date: '2025-04-16', status: 'Pending', urgency: 'amber', notes: 'Fever 3 days' },
];

export const ALERTS: Alert[] = [
  { id: 'al1', patientName: 'Sunita Devi', village: 'Rampur', symptomSummary: 'High fever 102°F + cough 3 days', urgency: 'amber', time: '12 min ago', symptoms: ['Fever 102°F', 'Productive cough', 'Body ache', 'No breathlessness'] },
  { id: 'al2', patientName: 'Mohan Lal', village: 'Belwa', symptomSummary: 'Severe chest pain + sweating', urgency: 'red', time: '34 min ago', symptoms: ['Chest pain (crushing)', 'Sweating', 'Left arm pain', 'Nausea'] },
  { id: 'al3', patientName: 'Priya Singh', village: 'Lakhimpur', symptomSummary: 'Pregnant — swollen feet + headache', urgency: 'red', time: '1 hr ago', symptoms: ['28 weeks pregnant', 'Swollen feet', 'Severe headache', 'Blurred vision'] },
  { id: 'al4', patientName: 'Aarav Kumar', village: 'Rampur', symptomSummary: 'Child loose motion 4 episodes', urgency: 'amber', time: '2 hr ago', symptoms: ['Age 2', 'Loose stools 4x', 'Mild dehydration', 'Drinking ORS'] },
];

export const RECENT_CONSULTATIONS: Consultation[] = [
  { id: 'c1', date: '2025-04-20', urgency: 'green', summary: 'Mild cold — home care' },
  { id: 'c2', date: '2025-04-12', urgency: 'amber', summary: 'Fever + cough — visited ASHA' },
  { id: 'c3', date: '2025-03-28', urgency: 'green', summary: 'Stomach ache — home remedy' },
];

export const NEAREST_PHC = {
  name: 'Rampur Primary Health Centre',
  distance: '4.2 km',
  directions: 'https://maps.google.com/?q=Rampur+PHC',
  ambulance: '108',
};

export const ASSIGNED_ASHA = ASHA_WORKERS[0];

export function urgencyColor(u: Urgency) {
  return u === 'green' ? 'bg-success' : u === 'amber' ? 'bg-warning' : 'bg-destructive';
}
export function urgencyTextColor(u: Urgency) {
  return u === 'green' ? 'text-success' : u === 'amber' ? 'text-warning' : 'text-destructive';
}
export function urgencySoftBg(u: Urgency) {
  return u === 'green' ? 'bg-success-soft' : u === 'amber' ? 'bg-warning-soft' : 'bg-destructive-soft';
}
