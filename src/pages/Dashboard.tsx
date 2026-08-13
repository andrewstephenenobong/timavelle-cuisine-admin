/* Timavelle admin overview: editorial workspace with a live Africa/Lagos wall clock. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, Quote, SettingsIcon, UtensilsCrossed } from '../components/DashboardLayout';

const surfaces = [
  { label: 'Menu', state: 'Live data', detail: 'Keep the public menu focused.', icon: UtensilsCrossed, to: '/dashboard/menu' },
  { label: 'Gallery', state: 'Live data', detail: 'Shape the visual appetite.', icon: ImageIcon, to: '/dashboard/gallery' },
  { label: 'Testimonials', state: 'Review queue', detail: 'Approve stories before publishing.', icon: Quote, to: '/dashboard/testimonials' },
  { label: 'Settings', state: 'Workspace setup', detail: 'Security and site controls.', icon: SettingsIcon, to: '/dashboard/settings' },
];

const LAGOS_TIME_ZONE = 'Africa/Lagos';
const lagosDateFormatter = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: LAGOS_TIME_ZONE });
const lagosTimeFormatter = new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: LAGOS_TIME_ZONE });

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
        <section className="admin-card"><div className="admin-card__eyebrow">Recent movement</div><h3>Workspace activity</h3><div className="admin-activity"><div className="admin-activity__row"><span className="admin-activity__mark"><UtensilsCrossed size={16} /></span><span className="admin-activity__copy"><strong>Menu surface</strong><small>Existing API-backed content</small></span><span className="admin-activity__time">Ready</span></div><div className="admin-activity__row"><span className="admin-activity__mark"><ImageIcon size={16} /></span><span className="admin-activity__copy"><strong>Gallery surface</strong><small>Existing API-backed content</small></span><span className="admin-activity__time">Ready</span></div><div className="admin-activity__row"><span className="admin-activity__mark"><Quote size={16} /></span><span className="admin-activity__copy"><strong>Testimonial review</strong><small>Use the content queue before publishing</small></span><span className="admin-activity__time">Review</span></div></div></section>
        <section className="admin-card"><div className="admin-card__eyebrow">Next to consider</div><h3>Lead workflow</h3><div className="admin-manager-note" style={{ marginTop: 22 }}><strong>Connect the enquiry path.</strong>The public form already has a clear place in the experience. Connect the existing API before treating this workspace as live.</div><Link className="admin-action" style={{ marginTop: 18, textDecoration: 'none' }} to="/dashboard/settings">Review settings ↗</Link></section>
      </div>
      <section className="admin-card admin-status-card"><div className="admin-card__eyebrow">Workspace health</div><h3>Everything is staged for a more considered table.</h3><p>Your content surfaces are organized. Connect the API before publishing live changes.</p><div className="admin-status-bar"><span /></div></section>
    </div>
  );
}
