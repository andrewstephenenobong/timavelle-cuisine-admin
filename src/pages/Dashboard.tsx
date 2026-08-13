/* Timavelle admin overview: editorial workspace with a live Africa/Lagos wall clock. */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, InboxIcon, SettingsIcon, UtensilsCrossed } from '../components/DashboardLayout';
import api, { type HealthResponse } from '../lib/api';
import '../styles/health.css';

const surfaces = [
  { label: 'Menu', state: 'Live data', detail: 'Keep the public menu focused.', icon: UtensilsCrossed, to: '/dashboard/menu' },
  { label: 'Gallery', state: 'Live data', detail: 'Shape the visual appetite.', icon: ImageIcon, to: '/dashboard/gallery' },
  { label: 'Enquiries', state: 'Lead inbox', detail: 'Follow up every request.', icon: InboxIcon, to: '/dashboard/enquiries' },
  { label: 'Settings', state: 'Workspace setup', detail: 'Security and site controls.', icon: SettingsIcon, to: '/dashboard/settings' },
];

const LAGOS_TIME_ZONE = 'Africa/Lagos';
const lagosDateFormatter = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: LAGOS_TIME_ZONE });
const lagosTimeFormatter = new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: LAGOS_TIME_ZONE });
const healthTimeFormatter = new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: LAGOS_TIME_ZONE });

type HealthState = 'loading' | 'connected' | 'degraded' | 'offline';

const healthCopy: Record<HealthState, { label: string; title: string; detail: string; width: string }> = {
  loading: { label: 'Checking', title: 'Checking the workspace connection.', detail: 'Confirming API and database readiness now.', width: '35%' },
  connected: { label: 'Connected', title: 'Content and conversations are connected.', detail: 'The API and database are responding. Published content and enquiries are available.', width: '100%' },
  degraded: { label: 'Degraded', title: 'The workspace is partially available.', detail: 'The API responded, but the database is not ready. Publishing and enquiry updates may be unavailable.', width: '55%' },
  offline: { label: 'Offline', title: 'The backend is not responding.', detail: 'The public site may still show fallback content, but admin changes cannot be confirmed until the connection returns.', width: '15%' },
};

function useLagosClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const parts = lagosTimeFormatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const second = Number(parts.find((part) => part.type === 'second')?.value ?? 0);

  return {
    dateLabel: lagosDateFormatter.format(now),
    timeLabel: lagosTimeFormatter.format(now),
    hour,
    hourAngle: ((hour % 12) + minute / 60) * 30,
    minuteAngle: (minute + second / 60) * 6,
    secondAngle: second * 6,
  };
}

function LagosWallClock({ clock }: { clock: ReturnType<typeof useLagosClock> }) {
  return (
    <div className="admin-wallclock" aria-label={`Current Lagos time: ${clock.dateLabel}, ${clock.timeLabel} WAT`} aria-live="polite">
      <div className="admin-wallclock__face" aria-hidden="true">
        <span className="admin-wallclock__tick admin-wallclock__tick--top" />
        <span className="admin-wallclock__tick admin-wallclock__tick--right" />
        <span className="admin-wallclock__tick admin-wallclock__tick--bottom" />
        <span className="admin-wallclock__tick admin-wallclock__tick--left" />
        <i className="admin-wallclock__hand admin-wallclock__hand--hour" style={{ transform: `rotate(${clock.hourAngle}deg)` }} />
        <i className="admin-wallclock__hand admin-wallclock__hand--minute" style={{ transform: `rotate(${clock.minuteAngle}deg)` }} />
        <i className="admin-wallclock__hand admin-wallclock__hand--second" style={{ transform: `rotate(${clock.secondAngle}deg)` }} />
        <b className="admin-wallclock__pin" />
      </div>
      <div className="admin-wallclock__details">
        <span className="admin-wallclock__date">{clock.dateLabel}</span>
        <strong>{clock.timeLabel} <small>WAT</small></strong>
        <span>Lagos · UTC+1</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const clock = useLagosClock();
  const greeting = clock.hour < 12 ? 'Good morning' : clock.hour < 18 ? 'Good afternoon' : 'Good evening';
  const [healthState, setHealthState] = useState<HealthState>('loading');
  const [healthMessage, setHealthMessage] = useState(healthCopy.loading.detail);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkHealth = useCallback(async () => {
    setCheckingHealth(true);
    setHealthState('loading');
    setHealthMessage(healthCopy.loading.detail);
    try {
      const response = await api.get<HealthResponse>('/api/health', { timeout: 8000 });
      const nextState: HealthState = response.data.status === 'ok' && response.data.database === 'ready' ? 'connected' : 'degraded';
      setHealthState(nextState);
      setHealthMessage(response.data.message || healthCopy[nextState].detail);
    } catch (error: unknown) {
      const response = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: HealthResponse } }).response
        : undefined;
      const backendState = response?.data?.status === 'degraded' ? 'degraded' : 'offline';
      setHealthState(backendState);
      setHealthMessage(response?.data?.message || healthCopy[backendState].detail);
    } finally {
      setLastChecked(new Date().toISOString());
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => checkHealth());
  }, [checkHealth]);

  const currentHealth = healthCopy[healthState];

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <div className="admin-page__clock-row"><div className="admin-page__eyebrow">{clock.dateLabel}</div><LagosWallClock clock={clock} /></div>
          <h2>{greeting}, <em>Timavelle.</em></h2>
          <p className="admin-page__intro">A considered view of the content that shapes your public table.</p>
        </div>
        <Link className="admin-action" to="/dashboard/menu">Review content ↗</Link>
      </div>
      <div className="admin-stat-grid">{surfaces.map((surface) => <Link key={surface.label} to={surface.to} className="admin-stat" style={{ textDecoration: 'none' }}><span className="admin-stat__label">{surface.label}</span><strong>{surface.state}</strong><small>{surface.detail}</small></Link>)}</div>
      <div className="admin-card-grid">
        <section className="admin-card"><div className="admin-card__eyebrow">Recent movement</div><h3>Workspace activity</h3><div className="admin-activity"><div className="admin-activity__row"><span className="admin-activity__mark"><UtensilsCrossed size={16} /></span><span className="admin-activity__copy"><strong>Menu surface</strong><small>Existing API-backed content</small></span><span className="admin-activity__time">Ready</span></div><div className="admin-activity__row"><span className="admin-activity__mark"><ImageIcon size={16} /></span><span className="admin-activity__copy"><strong>Gallery surface</strong><small>Existing API-backed content</small></span><span className="admin-activity__time">Ready</span></div><div className="admin-activity__row"><span className="admin-activity__mark"><InboxIcon size={16} /></span><span className="admin-activity__copy"><strong>Enquiry inbox</strong><small>Track, qualify, and follow up leads</small></span><span className="admin-activity__time">Live</span></div></div></section>
        <section className="admin-card"><div className="admin-card__eyebrow">Lead workflow</div><h3>Every request has a next step.</h3><div className="admin-manager-note" style={{ marginTop: 22 }}><strong>Follow up from one inbox.</strong>Review new enquiries, add internal notes, and move each request from first contact to closed.</div><Link className="admin-action" style={{ marginTop: 18, textDecoration: 'none' }} to="/dashboard/enquiries">Open enquiry inbox ↗</Link></section>
      </div>
      <section className="admin-card admin-status-card" data-health-state={healthState} aria-live="polite"><div className="admin-status-card__topline"><div className="admin-card__eyebrow">Workspace health</div><span className="admin-health-badge">{currentHealth.label}</span></div><h3>{currentHealth.title}</h3><p>{healthMessage}</p><div className="admin-status-bar" aria-hidden="true"><span style={{ width: currentHealth.width }} /></div><div className="admin-status-card__footer"><span>{lastChecked ? `Last checked ${healthTimeFormatter.format(new Date(lastChecked))} WAT` : 'Checking live status…'}</span><button type="button" className="admin-status-card__retry" onClick={() => void checkHealth()} disabled={checkingHealth}>{checkingHealth ? 'Checking…' : 'Retry connection ↗'}</button></div></section>
    </div>
  );
}
