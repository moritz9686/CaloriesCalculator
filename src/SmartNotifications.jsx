import { GOALS } from "./coachShared.js";

export default function SmartNotifications({ analysis }) {
  const notifications = [];

  if (analysis.gaps.protein > 0 && analysis.gaps.protein >= 20) {
    notifications.push({ type: "protein", message: `You still need ${Math.round(analysis.gaps.protein)} g protein today.` });
  }

  if (analysis.gaps.water > 300) {
    notifications.push({ type: "water", message: `Drink ${Math.round(analysis.gaps.water)} ml of water.` });
  }

  if (analysis.burnedCalories > 300 && analysis.gaps.protein > 0) {
    notifications.push({ type: "recovery", message: "Your workout intensity was high. Get at least 8 hours of sleep." });
  }

  if (notifications.length === 0) return null;

  return (
    <section className="notifications">
      <div className="notifications__header">
        <p className="eyebrow">Reminders</p>
        <h3>Smart Notifications</h3>
      </div>
      <div className="notifications__list">
        {notifications.map((n, i) => (
          <div key={i} className={`notification-badge notification-badge--${n.type}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>{n.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
