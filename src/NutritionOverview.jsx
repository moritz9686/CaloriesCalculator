import { useEffect, useRef, useState } from "react";

const NUTRIENTS = [
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    goal: 2400,
    desc: "Calories measure the energy your body gets from food and drink. They fuel every process in your body — from breathing to exercising.",
    benefits: [
      "Provides energy for daily activities",
      "Supports metabolic function",
      "Fuels physical performance",
      "Maintains body temperature"
    ],
    tip: "Focus on nutrient-dense calories from whole foods rather than empty calories from processed items."
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    goal: 50,
    desc: "Protein is made of amino acids that serve as the building blocks for your body's tissues, enzymes, and hormones.",
    benefits: [
      "Muscle recovery and growth",
      "Builds and repairs lean tissue",
      "Helps keep you full longer",
      "Supports immune function"
    ],
    tip: "Include protein in every meal — aim for 20–30g per meal for optimal muscle protein synthesis."
  },
  {
    key: "carbs",
    label: "Carbohydrates",
    unit: "g",
    goal: 275,
    desc: "Carbohydrates are the body's primary energy source. They break down into glucose which your cells use for fuel.",
    benefits: [
      "Powers brain function",
      "Provides quick energy",
      "Supports digestive health (fiber)",
      "Spares protein for repair"
    ],
    tip: "Prioritize complex carbs like oats, quinoa, and sweet potatoes over refined sugars."
  },
  {
    key: "fat",
    label: "Fat",
    unit: "g",
    goal: 70,
    desc: "Dietary fat is essential for hormone production, nutrient absorption, and protecting your organs.",
    benefits: [
      "Absorbs fat-soluble vitamins",
      "Supports brain health",
      "Regulates hormones",
      "Provides sustained energy"
    ],
    tip: "Include healthy fats from avocados, nuts, seeds, and olive oil in your daily diet."
  },
  {
    key: "fiber",
    label: "Fiber",
    unit: "g",
    goal: 30,
    desc: "Fiber is the indigestible part of plant foods that supports digestive health and helps regulate blood sugar.",
    benefits: [
      "Promotes regular digestion",
      "Helps control blood sugar",
      "Lowers cholesterol levels",
      "Increases satiety"
    ],
    tip: "Gradually increase fiber intake and drink plenty of water to help your digestive system adjust."
  },
  {
    key: "sugar",
    label: "Sugar",
    unit: "g",
    goal: 50,
    desc: "Sugar occurs naturally in many foods. While natural sugars are fine, added sugars should be limited for optimal health.",
    benefits: [
      "Provides quick energy",
      "Enhances flavor naturally",
      "Supports brain function (glucose)",
      "Natural sugars in fruit come with fiber"
    ],
    tip: "Limit added sugars to under 50g per day. Check labels — sugar hides in sauces, breads, and drinks."
  },
  {
    key: "water",
    label: "Water",
    unit: "ml",
    goal: 3000,
    desc: "Water is essential for nearly every bodily function including temperature regulation, joint lubrication, and waste removal.",
    benefits: [
      "Regulates body temperature",
      "Lubricates joints",
      "Transports nutrients",
      "Flushes waste products"
    ],
    tip: "Drink water consistently throughout the day. If you feel thirsty, you're already slightly dehydrated."
  }
];

const ICONS = {
  calories: "M12 20v-6M9 18l3-3 3 3M12 4C9.5 6.5 8 9 8 12a4 4 0 0 0 8 0c0-3-1.5-5.5-4-8z",
  protein: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M20 4H6.5A2.5 2.5 0 0 0 4 6.5V20",
  carbs: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  fat: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  fiber: "M6 4v16M18 4v16M4 8h16M4 16h16M2 4h20M2 20h20",
  sugar: "M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4zM6 14a6 6 0 0 0 12 0v-2",
  water: "M12 2a8 8 0 0 0-8 8c0 5 4 9 8 12 4-3 8-7 8-12a8 8 0 0 0-8-8z"
};

function progressColor(pct) {
  if (pct > 100) return "#4ebeff";
  if (pct >= 71) return "#4ecc7a";
  if (pct >= 31) return "#ff9b54";
  return "#ff5f6d";
}

function CircularRing({ pct, color, icon, label, value, unit, goal, onClick }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const displayPct = Math.round(Math.min(pct, 100));

  return (
    <button type="button" className="nutri-ring-btn" onClick={onClick}>
      <div className="nutri-ring">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle
            cx="65" cy="65" r="54"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx="65" cy="65" r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 65 65)"
            className="nutri-ring__fill"
          />
        </svg>
        <div className="nutri-ring__inner">
          <svg className="nutri-ring__icon" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
          <span className="nutri-ring__pct" style={{ color }}>{displayPct}%</span>
        </div>
      </div>
      <span className="nutri-ring__label">{label}</span>
      <span className="nutri-ring__value">{value}{unit === "kcal" ? "" : ""}</span>
      <span className="nutri-ring__unit">{value !== "--" ? unit : ""}</span>
      <span className="nutri-ring__goal">Goal: {goal}{unit === "kcal" ? " kcal" : ` ${unit}`}</span>
    </button>
  );
}

function InfoCard({ nutrient, value, unit, isOpen, onToggle }) {
  return (
    <div className={`info-card ${isOpen ? "info-card--open" : ""}`}>
      <button
        type="button"
        className="info-card__header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="info-card__title">
          <svg className="info-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[nutrient.key]} />
          </svg>
          <span>{nutrient.label}</span>
        </div>
        <div className="info-card__current">
          <strong>{value}</strong>
          <small>{unit}</small>
        </div>
        <svg className={`info-card__chevron ${isOpen ? "info-card__chevron--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
      <div className="info-card__body">
        <div className="info-card__divider" />
        <div className="info-card__content">
          <p className="info-card__desc">{nutrient.desc}</p>
          <div className="info-card__section">
            <h4>Benefits</h4>
            <ul className="info-card__list">
              {nutrient.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="info-card__section">
            <h4>Daily Goal</h4>
            <p className="info-card__goal">{nutrient.goal} {unit === "kcal" ? "kcal" : `g`}{nutrient.key === "water" ? " (ml)" : ""}/day</p>
          </div>
          <div className="info-card__section">
            <h4>Health Tip</h4>
            <p className="info-card__tip">{nutrient.tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRing() {
  return (
    <div className="nutri-ring-btn nutri-ring-btn--skeleton">
      <div className="nutri-ring">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" transform="rotate(-90 65 65)" />
        </svg>
        <div className="nutri-ring__inner">
          <div className="skeleton-icon" />
        </div>
      </div>
      <div className="skeleton-text" />
      <div className="skeleton-text skeleton-text--short" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="info-card info-card--skeleton">
      <div className="info-card__header">
        <div className="info-card__title">
          <div className="skeleton-icon" />
          <div className="skeleton-text" />
        </div>
        <div className="skeleton-text skeleton-text--short" />
      </div>
    </div>
  );
}

function sumMacro(entries, key) {
  let total = 0;
  for (const entry of entries) {
    const v = Number(entry[key]);
    if (Number.isFinite(v) && v > 0) total += v;
  }
  return total;
}

export default function NutritionOverview({ entries, loading, manualWaterMl }) {
  const [openCard, setOpenCard] = useState(null);
  const [animated, setAnimated] = useState(false);
  const cardRefs = useRef({});

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totals = {};
  for (const n of NUTRIENTS) {
    if (n.key === "water") {
      totals.water = sumMacro(entries, "waterMl") + Number(manualWaterMl || 0);
    } else if (n.key === "calories") {
      totals.calories = sumMacro(entries, "calories");
    } else {
      totals[n.key] = sumMacro(entries, n.key);
    }
  }

  function handleRingClick(nutrientKey) {
    const idx = NUTRIENTS.findIndex((n) => n.key === nutrientKey);
    setOpenCard((prev) => (prev === idx ? null : idx));
    const el = cardRefs.current[nutrientKey];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (loading) {
    return (
      <section className="nutrition-section">
        <div className="nutrition-header">
          <p className="eyebrow">Nutrition Overview</p>
          <h2>Daily Nutrition</h2>
        </div>
        <div className="nutri-grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonRing key={i} />
          ))}
        </div>
        <div className="info-cards">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  const hasData = entries.length > 0 && entries.some((e) => Number(e.calories) > 0);

  return (
    <section className="nutrition-section">
      <div className="nutrition-header">
        <p className="eyebrow">Nutrition Overview</p>
        <h2>Daily Nutrition</h2>
      </div>

      {!hasData ? (
        <div className="nutrition-empty">
          <svg className="nutrition-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p>No food logged yet today. Add a meal or scan a photo to see your nutrition breakdown.</p>
        </div>
      ) : (
        <div className="nutri-grid">
          {NUTRIENTS.map((n) => {
            const value = totals[n.key];
            const pct = n.goal > 0 ? (value / n.goal) * 100 : 0;
            const color = progressColor(pct);
            const displayValue = value > 0 ? Math.round(value) : "--";
            return (
              <CircularRing
                key={n.key}
                pct={animated ? pct : 0}
                color={color}
                icon={ICONS[n.key]}
                label={n.label}
                value={displayValue}
                unit={n.unit}
                goal={n.goal}
                onClick={() => handleRingClick(n.key)}
              />
            );
          })}
        </div>
      )}

      <div className="info-cards">
        {NUTRIENTS.map((n, idx) => {
          const value = totals[n.key];
          const displayValue = value > 0 ? Math.round(value) : "--";
          return (
            <div key={n.key} ref={(el) => { cardRefs.current[n.key] = el; }}>
              <InfoCard
                nutrient={n}
                value={displayValue}
                unit={n.unit}
                isOpen={openCard === idx}
                onToggle={() => setOpenCard((prev) => (prev === idx ? null : idx))}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
