import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Minimal local icon components to avoid dependency on 'lucide-react'
import React from 'react';

const IconBase = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    {children}
  </svg>
);

export const LayoutDashboard = ({ size = 18 }: { size?: number }) => (
  <IconBase size={size}>
    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
  </IconBase>
);

export const UtensilsCrossed = ({ size = 18 }: { size?: number }) => (
  <IconBase size={size}>
    <path d="M7 2l5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 2l-5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

export const ImageIcon = ({ size = 18 }: { size?: number }) => (
  <IconBase size={size}>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
    <path d="M21 19l-6-6-4 4-3-3-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

export const Quote = ({ size = 18 }: { size?: number }) => (
  <IconBase size={size}>
    <path d="M7 7h3v6H5V9a2 2 0 012-2zM14 7h3v6h-5V9a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

export const SettingsIcon = ({ size = 18 }: { size?: number }) => (
  <IconBase size={size}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 012.27 16.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82L4.31 2.27A2 2 0 017.14 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001 1.51V3a2 2 0 014 0v.09c.28.11.54.28.76.5l.06.06a1.65 1.65 0 001.82.33h.09a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.11.28.18.57.18.87s-.07.59-.18.87v.09c.11.28.18.57.18.87s-.07.59-.18.87z" stroke="currentColor" strokeWidth="0" fill="currentColor" opacity="0.15" />
  </IconBase>
);

export const LogOut = ({ size = 18 }: { size?: number }) => (
  <IconBase size={size}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

export const Menu = ({ size = 24 }: { size?: number }) => (
  <IconBase size={size}>
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

export const X = ({ size = 22 }: { size?: number }) => (
  <IconBase size={size}>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Menu', to: '/dashboard/menu', icon: UtensilsCrossed },
  { label: 'Gallery', to: '/dashboard/gallery', icon: ImageIcon },
  { label: 'Testimonials', to: '/dashboard/testimonials', icon: Quote },
  { label: 'Settings', to: '/dashboard/settings', icon: SettingsIcon },
];

export default function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-ivory">
          Timavelle <span className="text-gold">Admin</span>
        </h1>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 font-utility text-sm transition-colors ${
                active ? 'bg-ivory/10 text-gold' : 'text-ivory/70 hover:bg-ivory/5 hover:text-ivory'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ivory/10 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-utility text-sm text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory md:flex">
      {/* Desktop sidebar — always visible from md breakpoint up */}
      <aside className="hidden w-64 shrink-0 bg-emerald-deep md:block">{sidebarContent}</aside>

      {/* Mobile top bar — only shown below md */}
      <header className="flex items-center justify-between bg-emerald-deep px-4 py-4 md:hidden">
        <h1 className="font-display text-lg font-semibold text-ivory">
          Timavelle <span className="text-gold">Admin</span>
        </h1>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-ivory">
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile slide-out drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-emerald-deep shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-4 top-4 text-ivory">
              <X size={22} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <main className="flex-1 p-5 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}