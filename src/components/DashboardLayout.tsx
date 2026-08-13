import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PUBLIC_SITE_URL } from '../lib/site';
import '../styles/accessibility.css';

const IconBase = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {children}
  </svg>
);

export const LayoutDashboard = ({ size = 18 }: { size?: number }) => <IconBase size={size}><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" /></IconBase>;
export const UtensilsCrossed = ({ size = 18 }: { size?: number }) => <IconBase size={size}><path d="M7 2l5 10M12 2l-5 10M7 12h10M7 18h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></IconBase>;
export const ImageIcon = ({ size = 18 }: { size?: number }) => <IconBase size={size}><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" /><path d="M21 19l-6-6-4 4-3-3-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></IconBase>;
export const Quote = ({ size = 18 }: { size?: number }) => <IconBase size={size}><path d="M7 7h3v6H5V9a2 2 0 012-2zM14 7h3v6h-5V9a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></IconBase>;
export const InboxIcon = ({ size = 18 }: { size?: number }) => <IconBase size={size}><path d="M4 5h16v11H4zM4 12h4l2 3h4l2-3h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></IconBase>;
export const SettingsIcon = ({ size = 18 }: { size?: number }) => <IconBase size={size}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M19 13a7 7 0 000-2l2-1-2-3-2 1a7 7 0 00-2-1l-.3-2h-3.5L11 7a7 7 0 00-2 1L7 7 5 10l2 1a7 7 0 000 2l-2 1 2 3 2-1a7 7 0 002 1l.3 2h3.5l.3-2a7 7 0 002-1l2 1 2-3-2-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></IconBase>;
export const LogOut = ({ size = 18 }: { size?: number }) => <IconBase size={size}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></IconBase>;
export const Menu = ({ size = 24 }: { size?: number }) => <IconBase size={size}><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></IconBase>;
export const X = ({ size = 22 }: { size?: number }) => <IconBase size={size}><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></IconBase>;

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Menu', to: '/dashboard/menu', icon: UtensilsCrossed },
  { label: 'Gallery', to: '/dashboard/gallery', icon: ImageIcon },
  { label: 'Testimonials', to: '/dashboard/testimonials', icon: Quote },
  { label: 'Enquiries', to: '/dashboard/enquiries', icon: InboxIcon },
  { label: 'Services', to: '/dashboard/services', icon: UtensilsCrossed },
  { label: 'FAQs', to: '/dashboard/faqs', icon: Quote },
  { label: 'Contact', to: '/dashboard/contact', icon: ImageIcon },
  { label: 'Settings', to: '/dashboard/settings', icon: SettingsIcon },
];

const focusableSelector = 'button:not([disabled]), a[href], input, textarea, select';

export default function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const handleLogout = () => { logout(); navigate('/login'); };
  const currentLabel = navItems.find((item) => location.pathname === item.to)?.label ?? navItems.find((item) => location.pathname.startsWith(`${item.to}/`))?.label ?? 'Overview';

  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 680px)').matches) return undefined;
    const trigger = mobileTriggerRef.current;
    sidebarRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = sidebarRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="admin-shell">
      <aside ref={sidebarRef} id="admin-navigation" className="admin-shell__sidebar" data-open={open} aria-label="Workspace sidebar">
        <div className="admin-shell__brand"><span className="ad-mark" aria-hidden="true"><i /><i /><i /></span><span className="admin-shell__brand-copy"><strong>Timavelle</strong><small>Admin workspace</small></span></div>
        <button className="admin-shell__drawer-close" type="button" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        <div className="admin-shell__stamp">Private culinary house<span>Content control room</span></div>
        <div className="admin-shell__label">Workspace</div>
        <nav className="admin-shell__nav" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return <Link key={item.to} to={item.to} onClick={() => setOpen(false)} data-active={active} aria-current={active ? 'page' : undefined}><Icon size={18} />{item.label}{item.label === 'Testimonials' && <span className="admin-shell__badge">Review</span>}{item.label === 'Enquiries' && <span className="admin-shell__badge admin-shell__badge--quiet">Inbox</span>}</Link>;
          })}
        </nav>
        <div className="admin-shell__divider" />
        <div className="admin-shell__label">System</div>
        <a className="admin-shell__nav" href="mailto:hello@timavellecuisine.com" style={{ textDecoration: 'none' }}><span style={{ color: 'rgba(247,245,240,.62)' }}>?</span>Help centre</a>
        <div className="admin-shell__bottom"><div className="admin-shell__status">Health monitored<small>See Overview for live status</small></div><button className="admin-shell__logout" onClick={handleLogout}><LogOut size={17} />Log out</button></div>
      </aside>
      <div className="admin-shell__main">
        <header className="admin-shell__mobilebar"><span className="admin-shell__brand-copy"><strong>Timavelle</strong><small>Admin workspace</small></span><button ref={mobileTriggerRef} onClick={() => setOpen(true)} aria-controls="admin-navigation" aria-label="Open navigation"><Menu size={23} /></button></header>
        <div className="admin-topbar" role="region" aria-label="Workspace toolbar"><span className="admin-topbar__crumb">Timavelle / <strong>{currentLabel}</strong></span><div className="admin-topbar__actions"><button className="admin-topbar__notice" aria-label="Notifications">•</button><a className="admin-topbar__link" href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer">View site ↗</a><button className="admin-topbar__link" onClick={() => setOpen(!open)} aria-controls="admin-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? 'Close' : 'Menu'}</button></div></div>
        <main><h1 className="sr-only">Timavelle Admin Workspace</h1><Outlet /></main>
      </div>
      {open && <button type="button" className="fixed inset-0 z-20 hidden bg-black/40 md:hidden" aria-label="Close navigation overlay" onClick={() => setOpen(false)} />}
    </div>
  );
}
