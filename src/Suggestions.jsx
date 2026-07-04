import { GOALS } from "./coachShared.js";

const DIET_FILTER = {
  "non-vegetarian": {
    protein: ["Chicken Breast", "Eggs", "Fish", "Lean Beef", "Paneer", "Greek Yogurt", "Protein Shake", "Tofu"],
    fiber: ["Oats", "Apple", "Broccoli", "Beans", "Brown Rice", "Quinoa"]
  },
  "vegetarian": {
    protein: ["Paneer", "Greek Yogurt", "Protein Shake", "Tofu", "Soy Chunks", "Lentils", "Chickpeas", "Milk"],
    fiber: ["Oats", "Apple", "Broccoli", "Beans", "Brown Rice", "Quinoa", "Chia Seeds"]
  },
  "vegan": {
    protein: ["Tofu", "Soy Chunks", "Lentils", "Chickpeas", "Tempeh", "Quinoa", "Almonds", "Pumpkin Seeds"],
    fiber: ["Oats", "Apple", "Broccoli", "Beans", "Brown Rice", "Quinoa", "Chia Seeds", "Flax Seeds"]
  },
  "eggetarian": {
    protein: ["Eggs", "Paneer", "Greek Yogurt", "Protein Shake", "Tofu", "Lentils", "Chickpeas", "Milk"],
    fiber: ["Oats", "Apple", "Broccoli", "Beans", "Brown Rice", "Quinoa"]
  }
};

export default function Suggestions({ analysis, dietType = "vegetarian" }) {
  const foods = DIET_FILTER[dietType] || DIET_FILTER["vegetarian"];
  const suggestions = [];

  if (analysis.gaps.protein > 0) {
    suggestions.push({
      type: "protein",
      label: "High Protein Foods",
      items: foods.protein
    });
  }

  if (analysis.gaps.fiber > 0) {
    suggestions.push({
      type: "fiber",
      label: "High Fiber Foods",
      items: foods.fiber
    });
  }

  if (analysis.gaps.water > 0) {
    suggestions.push({
      type: "water",
      label: "Hydration",
      items: [],
      note: `Drink another ${Math.round(analysis.gaps.water)} ml of water.`
    });
  }

  if (analysis.sugar > GOALS.sugar) {
    suggestions.push({
      type: "sugar",
      label: "Sugar Alert",
      items: [],
      note: "Avoid sugary snacks for the rest of the day. Choose fruits instead."
    });
  }

  if (analysis.fat > GOALS.fat) {
    suggestions.push({
      type: "fat",
      label: "Fat Alert",
      items: [],
      note: "Prefer grilled food instead of fried meals."
    });
  }

  if (analysis.consumedCalories < GOALS.calories * 0.5 && analysis.burnedCalories > 0) {
    suggestions.push({
      type: "low-cal",
      label: "Too Few Calories",
      items: [],
      note: "You may not be eating enough to recover from today's workout. Increase calories using healthy foods."
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="suggestions">
      <div className="suggestions__header">
        <p className="eyebrow">Personalized Suggestions</p>
        <h3>Based on your nutrition</h3>
      </div>
      <div className="suggestions__grid">
        {suggestions.map((s) => (
          <div key={s.type} className={`suggestion-card suggestion-card--${s.type}`}>
            <h4 className="suggestion-card__title">
              {s.label}
            </h4>
            {s.note && <p className="suggestion-card__note">{s.note}</p>}
            {s.items.length > 0 && (
              <div className="suggestion-card__items">
                {s.items.map((item, i) => (
                  <span key={i} className="coach-tag">{item}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
