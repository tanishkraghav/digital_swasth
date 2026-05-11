import { OfflineBanner } from './Shared';

export const PatientLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-secondary/40 flex flex-col">
    <OfflineBanner />
    <main className="flex-1 max-w-xl mx-auto w-full">{children}</main>
  </div>
);
