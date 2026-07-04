export const GOALS = {
  calories: 2400,
  protein: 50,
  carbs: 275,
  fat: 70,
  fiber: 30,
  sugar: 50,
  water: 3000
};

export function sumMacro(entries, key) {
  let total = 0;
  for (const entry of entries) {
    const v = Number(entry[key]);
    if (Number.isFinite(v) && v > 0) total += v;
  }
  return total;
}

export function sumCalories(entries) {
  return entries.reduce((t, e) => t + (Number.isFinite(Number(e.calories)) ? Number(e.calories) : 0), 0);
}

export function analyzeDay(consumedEntries, burnedEntries, manualWaterMl, savedConsumed, savedBurned) {
  const protein = sumMacro(consumedEntries, "protein");
  const fiber = sumMacro(consumedEntries, "fiber");
  const sugar = sumMacro(consumedEntries, "sugar");
  const fat = sumMacro(consumedEntries, "fat");
  const carbs = sumMacro(consumedEntries, "carbs");
  const waterFromFood = sumMacro(consumedEntries, "waterMl");
  const water = waterFromFood + Number(manualWaterMl || 0);
  const consumedCalories = savedConsumed;
  const burnedCalories = savedBurned;
  const netCalories = consumedCalories - burnedCalories;
  const burnedTotal = sumCalories(burnedEntries);

  const gaps = {};
  gaps.protein = Math.max(0, GOALS.protein - protein);
  gaps.fiber = Math.max(0, GOALS.fiber - fiber);
  gaps.water = Math.max(0, GOALS.water - water);
  gaps.sugar = sugar > GOALS.sugar ? sugar - GOALS.sugar : 0;
  gaps.fat = fat > GOALS.fat ? fat - GOALS.fat : 0;
  gaps.calories = consumedCalories > GOALS.calories ? consumedCalories - GOALS.calories : 0;

  let coach = null;

  if (burnedTotal > 0 && gaps.protein > 0) {
    coach = {
      title: "Great Workout!",
      message: `You burned ${burnedTotal} kcal today. Your muscles need more protein for recovery.`,
      recommendation: `Eat 25-30 g of protein within the next 2 hours.`,
      suggestionType: "protein",
      suggestions: ["Grilled Chicken", "Eggs", "Greek Yogurt", "Whey Protein", "Paneer", "Tofu"],
      buttonLabel: "View Meal Suggestions",
      buttonAction: "meals"
    };
  } else if (gaps.calories > 200) {
    coach = {
      title: "High Calorie Intake",
      message: `You have consumed ${Math.round(gaps.calories)} kcal more than your target today.`,
      recommendation: "Complete one of these activities to balance your intake.",
      suggestionType: "exercise",
      suggestions: ["45 min Walking", "30 min Cycling", "20 min Running", "40 min Swimming"],
      buttonLabel: "Start Workout",
      buttonAction: "workout"
    };
  } else if (gaps.protein >= GOALS.protein * 0.5) {
    coach = {
      title: "Protein Intake Low",
      message: `You have consumed only ${Math.round(protein)} g of protein.`,
      recommendation: `Target: ${GOALS.protein} g | Remaining: ${Math.round(gaps.protein)} g`,
      suggestionType: "protein",
      suggestions: ["Chicken Breast", "Paneer", "Eggs", "Fish", "Soy Chunks", "Lentils", "Protein Shake"],
      buttonLabel: "Complete Protein Goal",
      buttonAction: "meals"
    };
  } else {
    coach = {
      title: "Excellent Progress",
      message: "You achieved every nutrition goal today.",
      recommendation: "Keep following this routine tomorrow.",
      suggestionType: null,
      suggestions: [],
      buttonLabel: "View Progress",
      buttonAction: "nutrition"
    };
  }

  return { protein, fiber, sugar, fat, carbs, water, consumedCalories, burnedCalories, netCalories, gaps, coach, waterFromFood, burnedTotal };
}
