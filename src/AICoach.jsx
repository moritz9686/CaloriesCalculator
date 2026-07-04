import { useEffect, useMemo, useState } from "react";
import { GOALS, analyzeDay } from "./coachShared.js";
import SmartNotifications from "./SmartNotifications.jsx";
import Suggestions from "./Suggestions.jsx";

const ACTION_PLAN_TASKS = [
  { id: "water", label: "more glasses of water", type: "water" },
  { id: "protein", label: "more g of protein", type: "protein" },
  { id: "fiber", label: "more g of fiber", type: "fiber" },
  { id: "sugar", label: "Stay under sugar limit", type: "sugar-limit" },
  { id: "walk", label: "Walk more steps", type: "walk" },
  { id: "stretch", label: "Stretch for 10 minutes", type: "stretch" }
];

const COACH_INSIGHTS = [
  "You usually eat less protein on weekends.",
  "Most of your calories come from dinner.",
  "Your recovery nutrition is improving.",
  "You consumed 22% less sugar than yesterday.",
  "Great consistency! You've met your protein goal for 5 consecutive days.",
  "Your breakfast contains too little protein. Adding eggs or yogurt could improve muscle recovery."
];

const ACHIEVEMENTS = [
  { id: "protein-goal", label: "Protein Goal Completed", icon: "M12 2l2.5 5.5L20 8.5l-4 4 1 6.5-5-3-5 3 1-6.5-4-4 5.5-1z", color: "#ff9b54" },
  { id: "workout-streak", label: "7-Day Workout Streak", icon: "M6 4v16M18 4v16M4 8h16M4 16h16", color: "#4ebeff" },
  { id: "low-sugar", label: "Low Sugar Day", icon: "M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z", color: "#4ecc7a" },
  { id: "hydration", label: "Hydration Master", icon: "M12 2a8 8 0 0 0-8 8c0 5 4 9 8 12 4-3 8-7 8-12a8 8 0 0 0-8-8z", color: "#4ebeff" },
  { id: "perfect-day", label: "Perfect Nutrition Day", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14", color: "#ff9b54" },
  { id: "fiber-champ", label: "Fiber Champion", icon: "M6 4v16M18 4v16M4 8h16M4 16h16M2 4h20M2 20h20", color: "#4ecc7a" },
  { id: "consistency", label: "Consistency Hero", icon: "M13 2L3 14h9l-1 8 10-12h-9z", color: "#ff5f6d" }
];

function getDailyAchievements(analysis) {
  const earned = [];
  if (analysis.protein >= GOALS.protein) earned.push("protein-goal");
  if (analysis.sugar <= GOALS.sugar * 0.6) earned.push("low-sugar");
  if (analysis.water >= GOALS.water) earned.push("hydration");
  if (analysis.fiber >= GOALS.fiber) earned.push("fiber-champ");
  const allMet =
    analysis.protein >= GOALS.protein &&
    analysis.fiber >= GOALS.fiber &&
    analysis.water >= GOALS.water &&
    analysis.sugar <= GOALS.sugar &&
    analysis.fat <= GOALS.fat;
  if (allMet) earned.push("perfect-day");
  return earned;
}

function CoachCard({ coach }) {
  return (
    <section className="coach-card">
      <div className="coach-card__badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.37 4.37a3 3 0 1 1 4.24 4.24l-8.59 8.59L8 20l2.8-3.8z" />
        </svg>
      </div>
      <h2 className="coach-card__title">{coach.title}</h2>
      <p className="coach-card__message">{coach.message}</p>
      <p className="coach-card__rec">{coach.recommendation}</p>
      {coach.suggestions.length > 0 && (
        <div className="coach-card__suggestions">
          <p className="coach-card__suggestions-label">Suggested</p>
          <div className="coach-card__tags">
            {coach.suggestions.map((item, i) => (
              <span key={i} className="coach-tag">{item}</span>
            ))}
          </div>
        </div>
      )}
      <button type="button" className="primary-button coach-card__btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        {coach.buttonLabel}
      </button>
    </section>
  );
}

function ActionPlan({ tasks, onToggle }) {
  const done = tasks.filter((t) => t.done).length;
  return (
    <section className="action-plan">
      <div className="action-plan__header">
        <div>
          <p className="eyebrow">Daily Plan</p>
          <h3>Today's Action Plan</h3>
        </div>
        <div className="action-plan__count">{done}/{tasks.length}</div>
      </div>
      <div className="action-plan__list">
        {tasks.map((task) => (
          <label key={task.id} className={`action-plan__task ${task.done ? "action-plan__task--done" : ""}`}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(task.id)}
              className="action-plan__checkbox"
            />
            <span className="action-plan__checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <span className="action-plan__label">{task.done ? <s>{task.label}</s> : task.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function DailyProgress({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const [showChecklist, setShowChecklist] = useState(false);

  return (
    <section className="daily-progress">
      <div className="daily-progress__header">
        <p className="eyebrow">Today's Progress</p>
      </div>
      <button type="button" className="daily-progress__ring-btn" onClick={() => setShowChecklist(!showChecklist)}>
        <div className="daily-progress__ring">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="65" cy="65" r="54" fill="none" stroke="#4ecc7a" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 65 65)"
              className="nutri-ring__fill" />
          </svg>
          <div className="daily-progress__inner">
            <span className="daily-progress__pct">{pct}%</span>
            <span className="daily-progress__sub">Completed</span>
          </div>
        </div>
        <span className="daily-progress__count">{done} / {total} Tasks</span>
      </button>
      {showChecklist && (
        <div className="daily-progress__checklist">
          <p className="eyebrow">Complete Checklist</p>
          <p className="daily-progress__checklist-text">Tap tasks in the Action Plan above to mark them complete.</p>
        </div>
      )}
    </section>
  );
}



function NavCards({ goToNutrition, goToDashboard }) {
  const cards = [
    { label: "Today's Meal Plan", icon: "M3 3h18v18H3zM3 9h18M9 21V9", color: "#ff9b54", onClick: goToNutrition },
    { label: "Protein Suggestions", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M20 4H6.5A2.5 2.5 0 0 0 4 6.5V20", color: "#4ecc7a", onClick: goToNutrition },
    { label: "Recommended Workout", icon: "M6 4v16M18 4v16M4 8h16M4 16h16", color: "#4ebeff", onClick: goToDashboard },
    { label: "Nutrition Details", icon: "M12 20v-6M9 18l3-3 3 3M12 4C9.5 6.5 8 9 8 12a4 4 0 0 0 8 0c0-3-1.5-5.5-4-8z", color: "#ff9b54", onClick: goToNutrition },
    { label: "Hydration Tracker", icon: "M12 2a8 8 0 0 0-8 8c0 5 4 9 8 12 4-3 8-7 8-12a8 8 0 0 0-8-8z", color: "#4ebeff", onClick: goToDashboard },
    { label: "Meal History", icon: "M12 8v4l3 3M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z", color: "#ff5f6d", onClick: goToNutrition }
  ];

  return (
    <section className="nav-cards">
      <div className="nav-cards__header">
        <p className="eyebrow">Quick Navigation</p>
      </div>
      <div className="nav-cards__grid">
        {cards.map((card, i) => (
          <button key={i} type="button" className="nav-card" onClick={card.onClick}>
            <svg className="nav-card__icon" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={card.icon} />
            </svg>
            <span className="nav-card__label">{card.label}</span>
            <svg className="nav-card__arrow" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}

function AIInsights() {
  const [insight] = useState(() => COACH_INSIGHTS[Math.floor(Math.random() * COACH_INSIGHTS.length)]);

  return (
    <section className="ai-insights">
      <div className="ai-insights__header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <path d="M12 20h9M16.37 4.37a3 3 0 1 1 4.24 4.24l-8.59 8.59L8 20l2.8-3.8z" />
        </svg>
        <div>
          <p className="eyebrow">AI Insight</p>
          <h3>Daily Analysis</h3>
        </div>
      </div>
      <p className="ai-insights__text">{insight}</p>
    </section>
  );
}

function Achievements({ earnedIds }) {
  const earned = ACHIEVEMENTS.filter((a) => earnedIds.includes(a.id));
  const locked = ACHIEVEMENTS.filter((a) => !earnedIds.includes(a.id));

  return (
    <section className="achievements">
      <div className="achievements__header">
        <p className="eyebrow">Badges</p>
        <h3>Achievements</h3>
      </div>
      <div className="achievements__grid">
        {earned.map((a) => (
          <div key={a.id} className="achievement-card achievement-card--earned">
            <svg className="achievement-card__icon" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={a.icon} />
            </svg>
            <span className="achievement-card__label">{a.label}</span>
          </div>
        ))}
        {locked.map((a) => (
          <div key={a.id} className="achievement-card achievement-card--locked">
            <svg className="achievement-card__icon" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={a.icon} />
            </svg>
            <span className="achievement-card__label">{a.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AICoach({
  consumedEntries,
  burnedEntries,
  manualWaterMl,
  savedConsumed,
  savedBurned,
  bodyWeight,
  height,
  userName,
  dietType = "vegetarian"
}) {
  const analysis = useMemo(
    () => analyzeDay(consumedEntries, burnedEntries, manualWaterMl, savedConsumed, savedBurned),
    [consumedEntries, burnedEntries, manualWaterMl, savedConsumed, savedBurned]
  );

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("coach-tasks");
      if (saved) return JSON.parse(saved);
    } catch {}
    return ACTION_PLAN_TASKS.map((t) => ({ ...t, done: false }));
  });

  useEffect(() => {
    localStorage.setItem("coach-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.type === "water" && analysis.water >= GOALS.water) return { ...t, done: true };
        if (t.type === "protein" && analysis.protein >= GOALS.protein) return { ...t, done: true };
        if (t.type === "fiber" && analysis.fiber >= GOALS.fiber) return { ...t, done: true };
        if (t.type === "sugar-limit" && analysis.sugar <= GOALS.sugar) return { ...t, done: true };
        return t;
      })
    );
  }, [analysis]);

  function handleTaskToggle(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function getTaskLabels(tasks, analysis) {
    return tasks.map((t) => {
      if (t.type === "water") return { ...t, label: `Drink ${Math.ceil(analysis.gaps.water / 250)} more glasses of water` };
      if (t.type === "protein") return { ...t, label: `Eat ${Math.round(analysis.gaps.protein)} more g of protein` };
      if (t.type === "fiber") return { ...t, label: `Eat ${Math.round(analysis.gaps.fiber)} more g of fiber` };
      return t;
    });
  }

  const completedTasks = tasks.filter((t) => t.done).length;
  const taskLabels = getTaskLabels(tasks, analysis);
  const earnedIds = getDailyAchievements(analysis);

  return (
    <div className="coach-page">
      <section className="hero-card wide">
        <p className="eyebrow">AI Coach</p>
        <h1>Hey {userName}, here's your daily plan.</h1>
        <p className="hero-copy">Personalized recommendations based on today's nutrition and activity.</p>
      </section>

      <div className="coach-grid">
        <CoachCard coach={analysis.coach} />
        <DailyProgress done={completedTasks} total={tasks.length} />
      </div>

      <ActionPlan tasks={taskLabels} onToggle={handleTaskToggle} />

      <Suggestions analysis={analysis} dietType={dietType} />

      <SmartNotifications analysis={analysis} />

      <div className="coach-insights-row">
        <AIInsights />
      </div>

      <NavCards goToNutrition={() => window.location.hash = ""} goToDashboard={() => window.location.hash = "dashboard"} />

      <Achievements earnedIds={earnedIds} />
    </div>
  );
}
