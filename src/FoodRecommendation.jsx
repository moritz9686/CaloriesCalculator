import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const DIET_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "non-vegetarian", label: "Non-Vegetarian" }
];

const ALLERGEN_OPTIONS = [
  "dairy", "eggs", "gluten", "peanuts", "tree nuts",
  "soy", "fish", "shellfish", "sesame"
];

const BUDGET_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

const MEAL_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "snack", label: "Snack" },
  { value: "dinner", label: "Dinner" }
];

const WORKOUT_OPTIONS = [
  { value: "none", label: "No workout" },
  { value: "pre", label: "Pre-workout" },
  { value: "post", label: "Post-workout" }
];

function SkeletonCard() {
  return (
    <div className="food-rec-card food-rec-card--skeleton">
      <div className="food-rec-card__body">
        <div className="skeleton-text skeleton-text--long" />
        <div className="skeleton-text" />
        <div className="skeleton-text skeleton-text--short" />
      </div>
    </div>
  );
}

export default function FoodRecommendation({ token, consumedEntries, burnedEntries, manualConsumedTotal, manualBurnedTotal, manualWaterMl, initialFilters, dietType: initialDiet, onDietChange }) {
  const [dietType, setDietType] = useState(initialDiet || initialFilters?.dietType || "vegetarian");
  const [allergens, setAllergens] = useState(initialFilters?.allergens || []);
  const [budget, setBudget] = useState(initialFilters?.budget || "any");
  const [mealType, setMealType] = useState(initialFilters?.mealType || "");
  const [workoutStatus, setWorkoutStatus] = useState(initialFilters?.workoutStatus || "none");
  const [recommendations, setRecommendations] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleAllergen(a) {
    setAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  async function fetchRecommendations() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          consumedEntries,
          burnedEntries,
          manualConsumedTotal,
          manualBurnedTotal,
          manualWaterMl,
          dietType,
          allergens,
          budget,
          mealType: mealType || undefined,
          workoutStatus
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Failed to get recommendations.");
      setRecommendations(payload.recommendations);
      setRemaining(payload.remaining);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="food-rec-page">
      <section className="hero-card wide">
        <p className="eyebrow">Smart Recommendations</p>
        <h1>Find your perfect meal</h1>
        <p className="hero-copy">Personalized food suggestions based on your nutrition gaps, diet, and preferences.</p>
      </section>

      <section className="food-rec-filters">
        <div className="food-rec-filters__row">
          <div className="food-rec-filter-group">
            <label className="food-rec-filter-label">Diet</label>
            <select value={dietType} onChange={(e) => { setDietType(e.target.value); if (onDietChange) { onDietChange(e.target.value); localStorage.setItem("calories-diet", e.target.value); } }} className="food-rec-select">
              {DIET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="food-rec-filter-group">
            <label className="food-rec-filter-label">Budget</label>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className="food-rec-select">
              {BUDGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="food-rec-filter-group">
            <label className="food-rec-filter-label">Meal Time</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="food-rec-select">
              {MEAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="food-rec-filter-group">
            <label className="food-rec-filter-label">Workout</label>
            <select value={workoutStatus} onChange={(e) => setWorkoutStatus(e.target.value)} className="food-rec-select">
              {WORKOUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="food-rec-filter-group">
          <label className="food-rec-filter-label">Allergies</label>
          <div className="food-rec-allergens">
            {ALLERGEN_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                className={`coach-tag ${allergens.includes(a) ? "coach-tag--active" : ""}`}
                onClick={() => toggleAllergen(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="primary-button food-rec-submit" onClick={fetchRecommendations} disabled={loading}>
          {loading ? "Finding meals..." : "Get Recommendations"}
        </button>
      </section>

      {remaining && (
        <section className="food-rec-gaps">
          <p className="eyebrow">Remaining targets</p>
          <div className="food-rec-gaps__grid">
            {Object.entries(remaining).map(([key, val]) => (
              <div key={key} className={`food-rec-gap ${val <= 0 ? "food-rec-gap--met" : ""}`}>
                <span className="food-rec-gap__label">{key}</span>
                <span className="food-rec-gap__value">{Math.round(val)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="food-rec-results">
        <p className="eyebrow">Top Picks</p>
        {loading ? (
          <div className="food-rec-grid">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="status error">{error}</p>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="food-rec-grid">
            {recommendations.map((food, i) => (
              <div key={i} className="food-rec-card">
                <div className="food-rec-card__rank">{i + 1}</div>
                <div className="food-rec-card__body">
                  <h3 className="food-rec-card__name">{food.name}</h3>
                  <p className="food-rec-card__serving">{food.servingSize}</p>
                  <div className="food-rec-card__macros">
                    <span className="food-rec-macro"><strong>{food.calories}</strong> kcal</span>
                    <span className="food-rec-macro"><strong>{food.protein}</strong> P</span>
                    <span className="food-rec-macro"><strong>{food.fiber}</strong> F</span>
                  </div>
                  <div className="food-rec-card__meta">
                    {food.prepTime > 0 && <span className="food-rec-meta">{food.prepTime} min</span>}
                    {food.quickFood && <span className="food-rec-meta food-rec-meta--quick">Quick</span>}
                    <span className="food-rec-meta">{food.budget}</span>
                    {food.preWorkout && <span className="food-rec-meta food-rec-meta--pre">Pre-workout</span>}
                    {food.postWorkout && <span className="food-rec-meta food-rec-meta--post">Post-workout</span>}
                  </div>
                  <p className="food-rec-card__why">{food.explanation}</p>
                  <div className="food-rec-card__tags">
                    <span className="coach-tag">{food.dietType}</span>
                    {food.mealType !== "any" && <span className="coach-tag">{food.mealType}</span>}
                    {food.allergens.length > 0 && food.allergens.map((a) => (
                      <span key={a} className="coach-tag coach-tag--allergen">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nutrition-empty">
            <svg className="nutrition-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p>No matching foods found. Try adjusting your filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
