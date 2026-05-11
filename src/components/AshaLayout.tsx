import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Bell, User } from 'lucide-react';
import { OfflineBanner } from './Shared';

const tabs = [
  { to: '/asha/home', icon: Home, label: 'Home' },
  { to: '/asha/visits', icon: ClipboardList, label: 'Visits' },
  { to: '/asha/alerts', icon: Bell, label: 'Alerts' },
  { to: '/asha/profile', icon: User, label: 'Profile' },
];

export const AshaLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <OfflineBanner />
      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 bg-background border-t border-border z-40">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
