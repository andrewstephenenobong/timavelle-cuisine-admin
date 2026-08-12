import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Menu', to: '/dashboard/menu' },
  { label: 'Gallery', to: '/dashboard/gallery' },
  { label: 'Testimonials', to: '/dashboard/testimonials' },
  { label: 'Settings', to: '/dashboard/settings' },
];

export default function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-ivory">
      <header className="flex items-center justify-between border-b border-stone/10 bg-white px-8 py-4">
        <h1 className="font-display text-xl font-semibold text-emerald-deep">Timavelle Admin</h1>
        <nav className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`font-utility text-sm ${
                location.pathname === item.to ? 'font-medium text-gold' : 'text-ink hover:text-gold'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="rounded-full border border-emerald px-4 py-1.5 font-utility text-xs text-emerald hover:bg-emerald hover:text-ivory"
        >
          Log Out
        </button>
      </header>
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
}
